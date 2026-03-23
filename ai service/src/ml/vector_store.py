from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
import typing
import os
import sys

# Đảm bảo đường dẫn import cho src module
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from src.core.config import settings

class VectorStoreManager:
    def __init__(self, collection_name: str = "medical_qa_db"):
        self.collection_name = collection_name
        self.embedding_function = self._init_embeddings()
        self.vector_store = self._init_chroma()

    def _init_embeddings(self) -> HuggingFaceEmbeddings:
        """
        Khởi tạo mô hình nhúng tiếng Việt dangvantuan/vietnamese-embedding.
        Hỗ trợ tốt cho các truy vấn y khoa tiếng Việt.
        """
        print(f"Loading embedding model: {settings.EMBEDDING_MODEL}...")
        embeddings = HuggingFaceEmbeddings(
            model_name=settings.EMBEDDING_MODEL,
            model_kwargs={'device': 'cpu'},
            encode_kwargs={
                'normalize_embeddings': True,
                'truncate_dim': None,    # Giữ nguyên số chiều
            }
        )
        # Ép cứng giới hạn token tối đa để không bao giờ bị lỗi out of bounds
        # dangvantuan/vietnamese-embedding dùng max_position_embeddings = 258
        # nhưng thực tế phải để là 256 (vì 2 vị trí reserved cho [CLS] và [SEP])
        embeddings._client.max_seq_length = 256
        return embeddings

    def _init_chroma(self) -> Chroma:
        """Khởi tạo kết nối với ChromaDB, lưu trữ trên ổ đĩa."""
        return Chroma(
            collection_name=self.collection_name,
            embedding_function=self.embedding_function,
            persist_directory=settings.CHROMA_DB_DIR
        )

    def search_similar_symptoms(self, query: str, k: int = 5) -> typing.List[typing.Any]:
        """
        Tìm kiếm các triệu chứng có độ tương đồng Semantic cao nhất với câu hỏi người dùng.
        """
        return self.vector_store.similarity_search_with_score(query, k=k)

    def get_retriever(self, k: int = 5):
        """
        Trả về Retriever cho LangChain để cắm vào RAG Pipeline sau này.
        """
        return self.vector_store.as_retriever(search_kwargs={"k": k})
