# AI Service - Hệ thống Trợ lý Y tế Sàng lọc Thông minh

## 🧠 Tổng quan AI Module (Symptom Checker & Diagnostic Agent)

AI Service là bộ não phân tích của "Hệ thống Trợ lý Y tế", được xây dựng độc lập dưới dạng một microservice bằng **Python, FastAPI và LangChain**. Nhiệm vụ chính của AI là giao tiếp với bệnh nhân, hiểu ngôn ngữ tự nhiên về các triệu chứng, và đưa ra báo cáo sàng lọc sơ bộ.

### 🎯 Quy trình hoạt động cốt lõi của AI Agent

1. **Tiếp nhận Context (Ngữ cảnh):**
   - Lấy thông tin cá nhân cơ bản từ backend chính (Tuổi, Giới tính, Chiều cao, Cân nặng/BMI).
   - Truy xuất hồ sơ bệnh nền (Chronic Conditions) nếu có.
   
2. **Thu thập Triệu chứng (Tương tác tự nhiên):**
   - Bệnh nhân nhập triệu chứng bằng văn bản tự do (ví dụ: *"Tôi bị đau đầu vùng trán 3 ngày nay, kèm theo buồn nôn..."*).
   - Agent có khả năng đặt câu hỏi phụ (Follow-up questions) nếu thông tin triệu chứng quá sơ sài.

3. **Phân tích (Diagnostic Reasoning):**
   - Sử dụng LLM kết hợp với RAG (Kéo dữ liệu từ kho bài viết chuyên gia/y khoa chuẩn) để suy luận bệnh lý.
   - Chặn các truy vấn ngoài lề (không liên quan đến y tế) bằng cơ chế kiểm duyệt (Guardrails).

4. **Kế xuất Báo cáo (Structured Output):**
   - API trả về một JSON có cấu trúc rõ ràng cho Frontend/Backend hiển thị, bao gồm:
     - `top_diseases`: Danh sách tối đa 3 bệnh lý có thể mắc phải kèm tỷ lệ % dự đoán và mức độ nguy hiểm (Xanh/Vàng/Đỏ).
     - `recommended_specialties`: Chuyên khoa (ID/Tên) cần thiết để khám (VD: Thần kinh học, Tiêu hóa).
     - `related_articles`: Danh sách link bài viết y khoa hữu ích trên hệ thống.
     - `disclaimer`: Lời cảnh báo y tế bắt buộc (Tham khảo, không thay thế bác sĩ).

---

## 🏗️ Cấu trúc thư mục (AI Service)

```text
ai_service/
├── data/                   # Dữ liệu phục vụ RAG (tài liệu y khoa, bài blog đã duyệt)
├── models/                 # Chứa vector db (Chroma/FAISS) hoặc local LLM weights
├── src/                    
│   ├── api/                # FastAPI Routes (VD: POST /analyze-symptoms)
│   ├── agents/             # Logic của LangChain Agent (DiagnosticAgent, Guardrails)
│   ├── prompts/            # System Prompts chuyên ngành y khoa
│   ├── schemas/            # Pydantic Models để validate Input/Output
│   ├── services/           # Kết nối Database, gọi external API (Backend NestJS)
│   └── main.py             # Entrypoint khởi chạy server
├── tests/                  # Unit/Integration tests cho Agent
├── .env                    # Biến môi trường (OPENAI_API_KEY, DB_URL...)
├── requirements.txt        # Các dependency (fastapi, langchain, uvicorn...)
└── README.md               # Tài liệu này
```

---

## 🛠️ Ngăn xếp Công nghệ (Tech Stack)

| Thành phần | Công nghệ sử dụng | Mục đích |
| :--- | :--- | :--- |
| **API Framework** | FastAPI | Tốc độ cao, hỗ trợ Async, tự động tạo OpenAPI docs, validate data tốt bằng Pydantic. |
| **Server** | Uvicorn | Chạy FastAPI app trong môi trường production. |
| **LLM Orchestration** | LangChain / LangGraph | Xây dựng luồng tư duy (Chain of Thought), quản lý bộ nhớ hội thoại, và RAG pipeline. |
| **LLM Provider** | OpenAI (GPT-4o-mini) / Gemini | Cung cấp khả năng suy luận ngôn ngữ tự nhiên xuất sắc. (Có thể switch qua LLM nội bộ nếu cần bảo mật dữ liệu y tế gắt gao). |
| **Vector Store** | Qdrant / ChromaDB | (Tùy chọn cho RAG) - Lưu trữ embeddings từ bài blog chuyên gia để AI trích xuất ngữ cảnh. |

---

## 🛡️ Rủi ro và Biện pháp giảm thiểu (AI Safety)

Vì liên quan đến sức khỏe con người, module AI được thiết kế với tiêu chí **"An toàn là trên hết"**:

1. **Hallucination (AI Bịa chuyện):**
   - *Biện pháp:* Sử dụng kỹ thuật Few-shot Prompting và RAG. Bắt buộc LLM trả lời "Tôi không chắc chắn, bạn cần đi khám ngay" nếu độ tự tin dưới ngưỡng cho phép.
2. **Trách nhiệm pháp lý:**
   - *Biện pháp:* Mọi phản hồi (từ UI đến API Response) luôn luôn đính kèm **`disclaimer`** (Miễn trừ trách nhiệm). Output của AI chỉ được gọi là "Sàng lọc sơ bộ" (Symptom Check), tuyệt đối không dùng từ "Chẩn đoán chính thức".
3. **Emergency Cases (Trường hợp khẩn cấp):**
   - *Biện pháp:* Có một bộ lọc Keyword Rules (ví dụ: *đau thắt ngực trái*, *khó thở dữ dội*, *đột quỵ*). Khi bắt gặp, AI bypass toàn bộ luồng suy luận và ngay lập tức trả về cảnh báo đỏ cờ: **"Gọi ngay cấp cứu 115"**.

---

## 🚀 Hướng dẫn khởi chạy (Local Development)

**1. Khởi tạo môi trường ảo (Virtual Environment)**
```bash
cd "ai service"
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
```

**2. Cài đặt thư viện**
```bash
pip install -r requirements.txt
```

**3.  Cấu hình biến môi trường**
Tạo file `.env` từ `.env.example` và điền key:
```env
OPENAI_API_KEY=sk-your-api-key-here
NESTJS_API_URL=http://localhost:4000
```

**4. Chạy server**
```bash
uvicorn src.main:app --reload --port 8000
```
- Khám phá API tài liệu tự động: `http://localhost:8000/docs`
