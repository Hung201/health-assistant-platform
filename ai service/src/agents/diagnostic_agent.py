import json
import sys
import os
from typing import Optional

from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_google_genai import ChatGoogleGenerativeAI

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from src.core.config import settings
from src.ml.vector_store import VectorStoreManager
from src.prompts.diagnostic_prompt import DIAGNOSTIC_PROMPT
from src.schemas.diagnostic_schema import DiagnosticResult


def _format_docs(docs) -> str:
    """Định dạng các Document truy xuất từ Vector DB thành chuỗi Context."""
    formatted = []
    for i, doc in enumerate(docs, 1):
        disease = doc.metadata.get("disease", "Không rõ")
        source = doc.metadata.get("source", "")
        formatted.append(f"[{i}] Bệnh: {disease}\nNội dung: {doc.page_content}\nNguồn: {source}")
    return "\n\n".join(formatted)


class DiagnosticAgent:
    """
    Agent phân tích triệu chứng dựa trên RAG Pipeline:
    User query -> Embedding -> ChromaDB retrieval -> LLM synthesis -> JSON output
    """

    def __init__(self, k: int = 10):
        """
        Args:
            k: Số lượng documents truy xuất từ ChromaDB cho mỗi query.
               Mặc định 10 để LLM có đủ context để phân tích top 3 bệnh.
        """
        print("[DiagnosticAgent] Khởi tạo Vector Store...")
        self.vs_manager = VectorStoreManager(collection_name="symptom_checker_db")
        self.retriever = self.vs_manager.get_retriever(k=k)

        print("[DiagnosticAgent] Khởi tạo LLM (Gemini)...")
        self.llm = ChatGoogleGenerativeAI(
            model=settings.LLM_MODEL,
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.2,
        )

        self.chain = self._build_rag_chain()
        print("[DiagnosticAgent] ✅ Agent sẵn sàng!")

    def _build_rag_chain(self):
        """
        Xây dựng RAG Chain theo pattern chuẩn của LangChain:
        (context + question) -> prompt -> llm -> str output
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

    def analyze(self, symptoms: str) -> DiagnosticResult:
        """
        Phân tích triệu chứng và trả về kết quả chuẩn hóa Pydantic.

        Args:
            symptoms: Mô tả triệu chứng của người dùng (tiếng Việt tự nhiên)

        Returns:
            DiagnosticResult object chứa top 3 bệnh, điểm khớp, chuyên khoa gợi ý.
        """
        raw_output = self.chain.invoke(symptoms)

        # Parse JSON từ LLM output, đôi khi LLM wrap trong markdown ```json ... ```
        cleaned = raw_output.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            cleaned = "\n".join(lines[1:-1])  # Bỏ dòng ``` đầu và cuối

        data = json.loads(cleaned)
        return DiagnosticResult(**data)

    def analyze_raw(self, symptoms: str) -> str:
        """Trả về raw string JSON từ LLM (dùng để debug)."""
        return self.chain.invoke(symptoms)
