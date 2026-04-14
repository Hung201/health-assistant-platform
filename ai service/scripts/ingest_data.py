import json
import os
import sys
from pathlib import Path
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from tqdm import tqdm

# Đảm bảo có thể import module từ src
current_dir = Path(__file__).parent.resolve()
ai_service_dir = current_dir.parent
sys.path.append(str(ai_service_dir))

from src.core.config import settings
from src.ml.vector_store import VectorStoreManager

def load_json_data(file_name: str) -> list[dict]:
    file_path = os.path.join(settings.PROCESSED_DATA_DIR, file_name)
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return []
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

def run_ingestion():
    files_to_load = [
        "ViMedical_Cleaned.json",
        "Vietnamese_Medical_QA_Cleaned.json"
    ]
    
    print("--- KHỞI TẠO VECTOR STORE MANAGER ---")
    vs_manager = VectorStoreManager(collection_name="symptom_checker_db")
    
    for filename in files_to_load:
        print(f"\n[INFO] Đang xử lý file dữ liệu: {filename}")
        data = load_json_data(filename)
        if not data:
            continue
            
        print(f"-> Tổng cộng {len(data)} documents. Đang chuyển thành LangChain Documents...")
        documents = []
        for item in data:
            # Lấy data và thiết lập cấu trúc Document
            page_content = item.get("page_content", "")
            if not page_content:
                continue
                
            metadata = item.get("metadata", {})
            metadata["source_file"] = filename # Add thêm nguồn file
            
            doc = Document(page_content=page_content, metadata=metadata)
            documents.append(doc)
            
        print(f"-> Tổng số bản ghi gốc: {len(documents)}. Đang băm nhỏ (chunking) văn bản để chống lỗi token...")
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=400,   # Tiếng Việt có dấu, sau tokenize phình ~2x -> 400 ký tự ~ 200-250 tokens
            chunk_overlap=50,
            separators=["\n\n", "\n", ".", " ", ""]
        )
        split_docs = text_splitter.split_documents(documents)
        print(f"-> Sau khi băm đạt chuẩn: {len(split_docs)} chunks an toàn.")
        
        # Ingestion theo Batch để tránh sập RAM
        BATCH_SIZE = 5461 # Giới hạn của ChromaDB SQLite
        num_batches = (len(split_docs) + BATCH_SIZE - 1) // BATCH_SIZE
        
        print(f"-> Đang chèn vào ChromaDB ({num_batches} batches)...")
        for i in tqdm(range(0, len(split_docs), BATCH_SIZE)):
            batch_docs = split_docs[i : i + BATCH_SIZE]
            vs_manager.vector_store.add_documents(batch_docs)
            
    print("\n✅ HOÀN TẤT INGESTION!")
    print(f"Cơ sở dữ liệu đã được lưu tại: {settings.CHROMA_DB_DIR}")

if __name__ == "__main__":
    run_ingestion()
