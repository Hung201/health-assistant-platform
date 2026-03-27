# AI Service API Documentation

Tài liệu này mô tả chi tiết các RESTful API của AI Health Assistant Service.
Base URL (khi chạy local): `http://localhost:8000`

---

## 1. Health Check
Kiểm tra trạng thái hoạt động của Service.

- **Endpoint**: `GET /api/v1/health/health`
- **Method**: `GET`
- **Mô tả**: Không yêu cầu xác thực. Trả về trạng thái, phiên bản và thời gian của hệ thống.

### Phản hồi thành công (200 OK)
```json
{
  "status": "healthy",
  "service": "AI Health Assistant Service",
  "version": "1.0.0",
  "timestamp": "2026-03-27T13:45:12.000000Z"
}
```

---

## 2. Phân tích triệu chứng sơ bộ (Diagnostic)
Nhận mô tả triệu chứng bằng tiếng Việt, dùng RAG Pipeline truy xuất kiến thức và LLM phân tích, trả về top các bệnh có thể.

- **Endpoint**: `POST /api/v1/diagnostic/analyze`
- **Method**: `POST`
- **Content-Type**: `application/json`

### Request Body
```json
{
  "symptoms": "Tôi bị đau đầu dữ dội vùng trán, kèm buồn nôn và chóng mặt từ sáng đến giờ",
  "patient_context": {
    "age": 30,
    "gender": "male",
    "height_cm": 170.5,
    "weight_kg": 65.0,
    "chronic_conditions": ["Tăng huyết áp"]
  }
}
```
**Chi tiết Input**:
- `symptoms` (string, bắt buộc): Mô tả triệu chứng, độ dài 10 - 2000 ký tự.
- `patient_context` (object, tùy chọn): Thông tin cá nhân để cá nhân hóa kết quả (tất cả các trường bên trong đều là optional).

### Phản hồi thành công (200 OK)
Cấu trúc trả về được bọc trong `APIResponse` chuẩn (`success`, `data`, `message`).
```json
{
  "success": true,
  "message": "Phân tích hoàn tất",
  "data": {
    "disclaimer": "Đây là kết quả sàng lọc AI, KHÔNG thay thế chẩn đoán từ bác sĩ.",
    "top_diseases": [
      {
        "rank": 1,
        "disease": "Đau xoang trán",
        "match_score": 0.85,
        "reasoning": "Dựa trên triệu chứng đau đầu vùng trán, buồn nôn...",
        "suggested_specialty": "Tai Mũi Họng"
      }
    ],
    "emergency_warning": null,
    "general_advice": "Nên nghỉ ngơi và uống nhiều nước...",
    "used_web_search": false,
    "web_search_disclaimer": null,
    "web_search_sources": null
  }
}
```
*Lưu ý*: Nếu hệ thống không đủ dữ liệu RAG, AI sẽ dùng Tavily Web Search để tìm kiếm bổ sung. Khi đó `used_web_search = true` cùng với các đường link nguồn ở `web_search_sources`.

---

## 3. Chat Đa Lượt (Chatbot)
Agent hỏi-đáp để thu thập đầy đủ thông tin triệu chứng. Khi đã nhận đủ dữ liệu, AI tự động kích hoạt tiến trình chẩn đoán sơ bộ.

- **Endpoint**: `POST /api/v1/chat/`
- **Method**: `POST`
- **Content-Type**: `application/json`

### Request Body
```json
{
  "session_id": "chuỗi-id-định-danh-phiên-chat",
  "message": "Chào bác sĩ, dạo này tôi hay bị đau đầu bên phải.",
  "history": [
    {
      "role": "user",
      "content": "Tôi muốn tư vấn khám bệnh"
    },
    {
      "role": "assistant",
      "content": "Chào bạn, hãy mô tả chi tiết hơn triệu chứng hiện tại của bạn nhé!"
    }
  ]
}
```
**Chi tiết Input**:
- `session_id` (string, bắt buộc): ID phiên hội thoại (do Frontend hoặc Backend quản lý).
- `message` (string, bắt buộc): Câu chat mới nhất của User (1-2000 ký tự).
- `history` (array, bắt buộc/có thể rỗng): Lịch sử hội thoại trước đó để AI hiểu ngữ cảnh.

### Phản hồi thành công (200 OK)
**Khi AI đang trong quá trình hỏi thêm thông tin (Chưa đủ kết luận):**
```json
{
  "session_id": "chuỗi-id-định-danh-phiên-chat",
  "reply": "Bạn bị đau nhiều vào lúc nào trong ngày?",
  "is_ready_to_diagnose": false,
  "final_result": null
}
```

**Khi AI thu thập đủ thông tin (Kết thúc tiến trình chat):**
```json
{
  "session_id": "chuỗi-id-định-danh-phiên-chat",
  "reply": "Dựa trên các triệu chứng bạn cung cấp, bộ phận phân tích đã đưa ra kết quả sau:",
  "is_ready_to_diagnose": true,
  "final_result": {
    "disclaimer": "Đây là kết quả sàng lọc AI...",
    "top_diseases": [ ... ],
    "emergency_warning": null,
    "general_advice": "...",
    "used_web_search": false
  }
}
```
*(Ghi chú: `final_result` có cấu trúc giống hệt object `data` của API `POST /api/v1/diagnostic/analyze`)*
