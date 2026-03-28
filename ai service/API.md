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
Agent hỏi-đáp để thu thập đầy đủ thông tin triệu chứng. Khi đã nhận đủ dữ liệu, AI tự động kích hoạt tiến trình chẩn đoán. Nếu confidence ≥ 70% và có `user_location`, AI gợi ý cơ sở y tế gần đó.

- **Endpoint**: `POST /api/v1/chat/`
- **Method**: `POST`
- **Content-Type**: `application/json`

### Request Body
```json
{
  "session_id": "chuỗi-id-định-danh-phiên-chat",
  "message": "Chào bác sĩ, dạo này tôi hay bị đau đầu bên phải.",
  "history": [
    { "role": "user", "content": "Tôi muốn tư vấn khám bệnh" },
    { "role": "assistant", "content": "Chào bạn, hãy mô tả chi tiết hơn triệu chứng!" }
  ],
  "user_location": "Hoàn Kiếm, Hà Nội"
}
```

**Chi tiết Input**:
| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `session_id` | string | ✅ | ID phiên hội thoại (do Frontend/Backend quản lý) |
| `message` | string | ✅ | Câu chat mới nhất (1–2000 ký tự) |
| `history` | array | ✅ (có thể rỗng) | Lịch sử hội thoại trước đó |
| `user_location` | string | ❌ tùy chọn | Địa chỉ người dùng – dùng để gợi ý bệnh viện/phòng khám gần đó |

### Phản hồi thành công (200 OK)
**Khi AI đang hỏi thêm (Chưa đủ dữ liệu):**
```json
{
  "session_id": "...",
  "reply": "Bạn bị đau nhiều vào lúc nào trong ngày?",
  "is_ready_to_diagnose": false,
  "final_result": null,
  "hospital_suggestion": null
}
```

**Khi AI đủ thông tin + confidence ≥ 70% + có `user_location`:**
```json
{
  "session_id": "...",
  "reply": "Dựa trên các triệu chứng bạn cung cấp...",
  "is_ready_to_diagnose": true,
  "final_result": {
    "disclaimer": "Đây là kết quả sàng lọc AI...",
    "top_diseases": [ { "rank": 1, "disease": "Đau nửa đầu Migraine", "match_score": 0.85, "suggested_specialty": "Nội thần kinh", "reasoning": "...", "treatment_direction": "..." } ],
    "emergency_warning": null,
    "general_advice": "...",
    "used_web_search": false
  },
  "hospital_suggestion": {
    "invitation_text": "Dựa trên kết quả phân tích, tôi thấy bạn nên đến khám chuyên khoa Nội thần kinh sớm. Tôi đã tìm thấy 3 cơ sở y tế trong bán kính 5km gần Hoàn Kiếm, Hà Nội... 🏥",
    "hospitals": [
      {
        "name": "Bệnh viện Bạch Mai",
        "address": "78 Giải Phóng, Đống Đa, Hà Nội",
        "phone": "+84-24-38694931",
        "specialty": null,
        "amenity_type": "hospital"
      }
    ],
    "search_radius_km": 5,
    "location_used": "Hoàn Kiếm, Hà Nội"
  }
}
```

> **Ghi chú Adaptive Suggestion**: `hospital_suggestion` chỉ xuất hiện khi đồng thời:
> 1. `is_ready_to_diagnose = true`
> 2. `match_score` cao nhất ≥ **70%**
> 3. `user_location` được cung cấp trong request
>
> Nếu confidence ≥ 70% nhưng thiếu `user_location`, AI sẽ tự thêm một câu nhắc nhẹ ở cuối `reply` để mời người dùng cung cấp vị trí.


