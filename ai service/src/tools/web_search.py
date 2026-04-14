"""
Tavily Web Search Tool cho DiagnosticAgent.
Được gọi khi ChromaDB không có đủ thông tin (match_score thấp).
"""
import logging
from typing import List, Optional
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class WebSearchResult:
    """Kết quả từ một trang web tìm kiếm."""
    title: str
    url: str
    content: str
    score: float = 0.0


@dataclass 
class WebSearchSummary:
    """Tổng hợp kết quả web search."""
    query: str
    results: List[WebSearchResult] = field(default_factory=list)
    context_text: str = ""          # Nội dung đã xử lý để đưa vào prompt
    disclaimer: str = (
        "⚠️ Thông tin bổ sung từ Internet (Nguồn: Tavily Web Search). "
        "Đây chỉ là thông tin THAM KHẢO, chưa được kiểm chứng chuyên sâu. "
        "Hãy tham khảo ý kiến bác sĩ để có chẩn đoán chính xác."
    )


class TavilySearchTool:
    """
    Wrapper cho Tavily Search API.
    Được khởi tạo lazy (chỉ khi có key) để không block startup nếu key rỗng.
    """

    # Confidence threshold: nếu tất cả match_score < ngưỡng này → trigger web search
    LOW_CONFIDENCE_THRESHOLD = 0.5

    def __init__(self, api_key: str, max_results: int = 5):
        self.api_key = api_key
        self.max_results = max_results
        self._client = None

        if api_key:
            self._init_client()
        else:
            logger.warning("[WebSearch] TAVILY_API_KEY rỗng – tắt chức năng web search.")

    def _init_client(self):
        try:
            from tavily import TavilyClient
            self._client = TavilyClient(api_key=self.api_key)
            logger.info("[WebSearch] ✅ TavilyClient khởi tạo thành công.")
        except ImportError:
            logger.error("[WebSearch] Thư viện 'tavily-python' chưa được cài. Chạy: pip install tavily-python")
        except Exception as e:
            logger.error(f"[WebSearch] Không thể khởi tạo TavilyClient: {e}")

    @property
    def is_available(self) -> bool:
        return self._client is not None

    def search(self, query: str) -> WebSearchSummary:
        """
        Thực hiện tìm kiếm y khoa bằng Tavily.
        
        Args:
            query: Câu hỏi/triệu chứng cần tìm kiếm thêm thông tin

        Returns:
            WebSearchSummary với danh sách kết quả và context text.
        """
        summary = WebSearchSummary(query=query)

        if not self.is_available:
            logger.warning("[WebSearch] Bỏ qua web search – client không khả dụng.")
            return summary

        medical_query = f"triệu chứng bệnh {query} y tế Việt Nam"
        
        try:
            logger.info(f"[WebSearch] Đang tìm kiếm: {medical_query[:80]}...")
            response = self._client.search(
                query=medical_query,
                search_depth="basic",
                max_results=self.max_results,
                include_answer=False,
            )

            for item in response.get("results", []):
                result = WebSearchResult(
                    title=item.get("title", ""),
                    url=item.get("url", ""),
                    content=item.get("content", "")[:500],  # Giới hạn 500 ký tự/nguồn
                    score=item.get("score", 0.0),
                )
                summary.results.append(result)

            if summary.results:
                lines = []
                for i, r in enumerate(summary.results, 1):
                    lines.append(
                        f"[Web {i}] {r.title}\n"
                        f"URL: {r.url}\n"
                        f"Nội dung: {r.content}"
                    )
                summary.context_text = "\n\n".join(lines)
                logger.info(f"[WebSearch] Tìm được {len(summary.results)} kết quả.")
            else:
                logger.info("[WebSearch] Không có kết quả nào.")

        except Exception as e:
            logger.error(f"[WebSearch] Lỗi khi tìm kiếm: {e}")

        return summary

    def should_search(self, top_match_score: float) -> bool:
        """
        Quyết định có cần thực hiện web search không.
        Trả về True nếu match_score cao nhất thấp hơn ngưỡng tin cậy.
        """
        return top_match_score < self.LOW_CONFIDENCE_THRESHOLD
