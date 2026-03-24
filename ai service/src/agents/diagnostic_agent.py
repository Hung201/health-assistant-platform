"""
DiagnosticAgent – RAG Pipeline với Web Search Fallback.

Luồng hoạt động:
  1. Truy xuất ChromaDB → LLM phân tích → lấy DiagnosticResult sơ bộ (raw)
  2. Kiểm tra confidence: nếu tất cả match_score < LOW_CONFIDENCE_THRESHOLD hoặc kết quả là "Không rõ"
     → Gọi Tavily Web Search để bổ sung context
     → LLM phân tích lại với prompt có web context
     → Đánh dấu result: used_web_search=True, kèm disclaimer nguồn
  3. Trả DiagnosticResult hoàn chỉnh
"""
import json
import logging
import sys
import os
from typing import Optional

from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_google_genai import ChatGoogleGenerativeAI

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from src.core.config import settings
from src.ml.vector_store import VectorStoreManager
from src.prompts.diagnostic_prompt import DIAGNOSTIC_PROMPT, DIAGNOSTIC_PROMPT_WITH_WEB
from src.schemas.diagnostic_schema import DiagnosticResult, WebSearchSource
from src.tools.web_search import TavilySearchTool

logger = logging.getLogger(__name__)


def _format_docs(docs) -> str:
    """Định dạng các Document truy xuất từ Vector DB thành chuỗi Context."""
    formatted = []
    for i, doc in enumerate(docs, 1):
        disease = doc.metadata.get("disease", "Không rõ")
        source = doc.metadata.get("source", "")
        formatted.append(f"[{i}] Bệnh: {disease}\nNội dung: {doc.page_content}\nNguồn: {source}")
    return "\n\n".join(formatted)


def _parse_llm_json(raw_output: str) -> dict:
    """
    Parse JSON từ LLM output.
    Xử lý trường hợp LLM wrap trong markdown ```json ... ```
    """
    cleaned = raw_output.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        cleaned = "\n".join(lines[1:-1])
    return json.loads(cleaned)


def print_thinking(title: str, content: str = ""):
    """In 'tư duy' của agent vào stderr để đảm bảo hiện ngay lập tức trên terminal uvicorn."""
    print(f"\n>>> [THINKING] {title.upper()}:", file=sys.stderr, flush=True)
    if content:
        print(f"{content}\n", file=sys.stderr, flush=True)


class DiagnosticAgent:
    """
    Agent phân tích triệu chứng với 2-phase pipeline và verbose thinking process.
    """

    def __init__(self, k: int = 10):
        """
        Args:
            k: Số lượng documents truy xuất từ ChromaDB cho mỗi query.
        """
        logger.info("[DiagnosticAgent] Khởi tạo Vector Store...")
        self.vs_manager = VectorStoreManager(collection_name="symptom_checker_db")
        self.retriever = self.vs_manager.get_retriever(k=k)

        logger.info("[DiagnosticAgent] Khởi tạo LLM (Gemini)...")
        self.llm = ChatGoogleGenerativeAI(
            model=settings.LLM_MODEL,
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.2,
        )

        logger.info("[DiagnosticAgent] Khởi tạo Tavily Web Search Tool...")
        self.web_search = TavilySearchTool(
            api_key=settings.TAVILY_API_KEY,
            max_results=5,
        )

        self._rag_chain = self._build_rag_chain()
        logger.info("[DiagnosticAgent] ✅ Agent sẵn sàng!")

    def _build_rag_chain(self):
        """
        Xây dựng RAG Chain Phase 1 (không có web context):
        (context + question) → DIAGNOSTIC_PROMPT → LLM → str
        """
        return (
            {
                "context": self.retriever | _format_docs,
                "question": RunnablePassthrough(),
            }
            | DIAGNOSTIC_PROMPT
            | self.llm
            | StrOutputParser()
        )

    def _get_rag_context(self, symptoms: str) -> str:
        """Truy xuất và định dạng context từ ChromaDB."""
        docs = self.retriever.invoke(symptoms)
        return _format_docs(docs)

    def analyze(self, symptoms: str) -> DiagnosticResult:
        """
        Phân tích triệu chứng với hiển thị 'tư duy' của agent ra terminal.
        """
        print(f"\n" + "="*80, file=sys.stderr, flush=True)
        print_thinking("RECEIVED SYMPTOMS", symptoms)

        # ── Phase 1: RAG ──────────────────────────────────────────────────────
        print_thinking("PHASE 1", "Retrieving internal medical knowledge from ChromaDB...")
        rag_context = self._get_rag_context(symptoms)
        
        # In tóm tắt context (lấy tối đa 3 đoạn đầu)
        ctx_parts = rag_context.split("\n\n")
        print_thinking("CHROMADB CONTEXT (TOP 3)", "\n\n".join(ctx_parts[:3]) + ("\n..." if len(ctx_parts) > 3 else ""))

        print_thinking("LLM REASONING", "Generating initial analysis from RAG context...")
        raw_output = self._rag_chain.invoke(symptoms)
        
        try:
            data = _parse_llm_json(raw_output)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error (Phase 1): {e}")
            raise

        result = DiagnosticResult(**data)

        # ── Kiểm tra confidence & kết quả placeholder ────────────────────────
        top_score = max((d.match_score for d in result.top_diseases), default=0.0)
        top_disease = result.top_diseases[0].disease if result.top_diseases else "N/A"
        
        print_thinking("PHASE 1 RESULT", f"Disease: {top_disease} | Score: {top_score:.2f}")
        print_thinking("PHASE 1 REASONING", result.top_diseases[0].reasoning if result.top_diseases else "N/A")

        # Kiểm tra nếu kết quả là placeholder (AI không tìm thấy bệnh cụ thể)
        placeholders = ["không rõ", "chưa xác định", "không xác định", "không tìm thấy", "không cụ thể"]
        has_placeholder = False
        if result.top_diseases:
            top_disease_name = top_disease.lower()
            has_placeholder = any(p in top_disease_name for p in placeholders)

        if not self.web_search.is_available:
            return result

        # Điều kiện dừng: Score đủ cao VÀ không phải là kết quả placeholder
        if not self.web_search.should_search(top_score) and not has_placeholder:
            print_thinking("DECISION", f"Confidence is high ({top_score:.2f}). Returning RAG result.")
            return result
        
        # ── Phase 2: Web Search Fallback ─────────────────────────────────────
        reason = "Placeholder result" if has_placeholder else f"Low confidence ({top_score:.2f} < {self.web_search.LOW_CONFIDENCE_THRESHOLD})"
        print_thinking("PHASE 2 - WEB SEARCH FALLBACK", f"Reason: {reason}. Searching Internet via Tavily...")
        
        web_summary = self.web_search.search(symptoms)

        if not web_summary.results:
            print_thinking("PHASE 2 ERROR", "No web results found. Staying with Phase 1 result.")
            return result

        print_thinking("WEB CONTEXT FOUND", web_summary.context_text[:1000] + ("..." if len(web_summary.context_text) > 1000 else ""))

        # Re-analyze với context bổ sung từ web
        print_thinking("PHASE 2 RE-ANALYZE", "Merging internal RAG + Web context for final decision...")
        web_chain = (
            DIAGNOSTIC_PROMPT_WITH_WEB
            | self.llm
            | StrOutputParser()
        )
        raw_output_2 = web_chain.invoke({
            "context": rag_context,
            "web_context": web_summary.context_text,
            "question": symptoms,
        })

        try:
            data2 = _parse_llm_json(raw_output_2)
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parse error (Phase 2): {e} – Falling back to Phase 1 result.")
            return result

        result2 = DiagnosticResult(**data2)
        result2.used_web_search = True
        result2.web_search_disclaimer = web_summary.disclaimer
        result2.web_search_sources = [
            WebSearchSource(title=r.title, url=r.url)
            for r in web_summary.results
            if r.title and r.url
        ]

        logger.info(f"✅ Phase 2 Done. Final Top Score: {max((d.match_score for d in result2.top_diseases), default=0.0):.2f}")
        return result2

    def analyze_raw(self, symptoms: str) -> str:
        """Trả về raw string JSON từ LLM Phase 1 (dùng để debug)."""
        return self._rag_chain.invoke(symptoms)
