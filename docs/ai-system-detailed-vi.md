# Tài liệu Chi tiết Hệ thống AI (Health Assistant Platform)

Cập nhật: `2026-05-14`

## 1) Mục tiêu và phạm vi
Tài liệu này mô tả chi tiết cách AI đang hoạt động trong dự án hiện tại:
- Luồng dữ liệu từ frontend -> NestJS -> Python AI.
- Nguồn dữ liệu y khoa, ingest, embedding, RAG.
- Cách gợi ý bác sĩ theo chuyên khoa + khu vực.
- Thu thập rating, tính điểm/ranking bác sĩ.
- Các bảng DB liên quan đến AI và recommendation.

Phạm vi theo code hiện tại trong repo tại ngày cập nhật tài liệu.

---

## 2) Kiến trúc tổng thể

### 2.1 Thành phần chính
- **Frontend (Next.js)**:
  - Gọi `POST /api/ai/chat` qua rewrite tới Nest backend.
  - Hiển thị chat, kết quả sàng lọc, doctor cards, facility cards.
- **Backend (NestJS)**:
  - Gateway/auth/session owner.
  - API AI: `POST /ai/chat`.
  - Lưu `chat_sessions`, `chat_messages`.
  - Enrich response bằng `doctor_recommendations` từ DB backend.
- **AI Service (Python/FastAPI)**:
  - Endpoint legacy: `POST /api/v1/chat/`.
  - Endpoint mới: `POST /v1/chat/` (contract mới).
  - DiagnosticAgent (RAG + Gemini + Web fallback).
  - HospitalSearch (Nominatim + Overpass).
- **PostgreSQL**:
  - Lưu user/doctor/specialty/slot/booking/review/chat.
- **ChromaDB (local disk)**:
  - Vector store cho dữ liệu y khoa đã ingest.

### 2.2 Chế độ gọi AI từ Nest
Biến môi trường `AI_PROVIDER`:
- `legacy`: Nest gọi Python `POST /api/v1/chat/`.
- `python_shadow`: trả kết quả legacy cho user, gọi thêm `/v1/chat/` để so sánh telemetry.
- `python_primary`: Nest gọi Python `POST /v1/chat/`.

Nest có timeout + retry nhẹ khi gọi Python (`AI_TIMEOUT_MS`, mặc định 15000ms).

---

## 3) Nguồn dữ liệu AI và ingest

### 3.1 Dữ liệu đầu vào cho RAG
Trong AI service:
- `ai service/data/raw/ViMedical_Disease.csv`
- `ai service/data/processed/ViMedical_Cleaned.json`
- `ai service/data/processed/Vietnamese_Medical_QA_Cleaned.json`

### 3.2 Script ingest
File: `ai service/scripts/ingest_data.py`

Luồng ingest:
1. Đọc JSON processed.
2. Chuyển thành LangChain `Document` (`page_content` + `metadata`).
3. Chunk văn bản bằng `RecursiveCharacterTextSplitter`:
  - `chunk_size=400`
  - `chunk_overlap=50`
4. Embed từng chunk.
5. Ghi vào Chroma collection `symptom_checker_db`.

### 3.3 Embedding model và vector store
File: `ai service/src/ml/vector_store.py`
- Embedding model: `dangvantuan/vietnamese-embedding`.
- Vector store: `langchain_chroma.Chroma`.
- Persist dir: `settings.CHROMA_DB_DIR` (trong `models/chroma_db`).
- Retriever `k` mặc định do agent config (thường `k=10`).

---

## 4) Pipeline AI chẩn đoán (RAG + LLM)

### 4.1 Agent
File: `ai service/src/agents/diagnostic_agent.py`

Flow:
1. Truy xuất context từ ChromaDB theo triệu chứng.
2. Prompt `DIAGNOSTIC_PROMPT` + Gemini (`gemini-2.0-flash`) để sinh JSON chẩn đoán.
3. Parse thành `DiagnosticResult`.
4. Nếu confidence thấp/placeholder thì fallback Web Search (Tavily), rồi phân tích lại bằng `DIAGNOSTIC_PROMPT_WITH_WEB`.

Output chính:
- `top_diseases[]` (rank, disease, match_score, reasoning, suggested_specialty)
- `general_advice`
- `emergency_warning` (nếu có)
- `used_web_search`, `web_search_sources`

### 4.2 Ngưỡng confidence
Từ config:
- `HOSPITAL_SUGGESTION_CONFIDENCE_THRESHOLD = 0.70`

Ý nghĩa:
- Top score >= 0.70 thì đủ tự tin để gợi ý cơ sở y tế gần đó (nếu có location).

---

## 5) Tìm cơ sở y tế gần người dùng

File: `ai service/src/tools/hospital_search.py`

Flow:
1. Geocode địa chỉ user bằng Nominatim -> `(lat, lon)`.
2. Map chuyên khoa sang OSM tags (vd TMH -> `ent`).
3. Query Overpass API (có failover nhiều endpoint).
4. Parse/sort kết quả:
  - Ưu tiên khớp chuyên khoa.
  - Ưu tiên loại hình (`hospital`, `clinic`, `doctors`...).
  - Ưu tiên bản ghi có địa chỉ.
5. Trả về tối đa 10 cơ sở.

Lưu ý:
- Đây là search theo OSM (ngoài hệ thống), không phải DB nội bộ bác sĩ.

---

## 6) Luồng chat và ownership dữ liệu chat

### 6.1 Ownership hiện tại
- NestJS lưu chat chính thức ở:
  - `chat_sessions`
  - `chat_messages`
- AI Python legacy endpoint vẫn có logic lưu chat nội bộ riêng (technical debt, cần dọn ở bước cutover hoàn tất).

### 6.2 Metadata session trong Nest
`chat_sessions.metadata` đang lưu thêm:
- `last_telemetry`
- `last_final_result`
- `last_location_hint`
- `ai_provider`

Mục đích:
- Giữ ngữ cảnh qua nhiều lượt chat.
- Tránh mất location/specialty ở lượt sau.
- Giúp gợi ý bác sĩ dù lượt hiện tại thiếu `final_result`.

---

## 7) Gợi ý bác sĩ: thuật toán và công nghệ

Phần này chạy ở backend Nest (file `backend/src/doctors/doctors.service.ts` + `backend/src/ai/ai.service.ts`).

### 7.1 Inputs cho recommendation
- `specialtyId` (map từ `suggested_specialty` của AI).
- `locationHint` (ưu tiên):
  1. `user_location` từ request
  2. location trích từ message
  3. `hospital_suggestion.location_used`
  4. `last_location_hint` từ metadata phiên
- `workplaceQuery` (dùng text match workplace).

### 7.2 Scoring thành phần theo workplace/location
Trong query SQL:
- `district_match`: +40
- `province_match`: +25
- `full_phrase_match`: +15
- `keyword_match`: +10

Ngoài ra có cột hỗ trợ:
- `has_available_slot` (có slot tương lai còn chỗ hay không)
- `next_available_slot`
- `priority_score` (từ doctor profile)
- `years_of_experience`

### 7.3 Xếp hạng tổng thể
Thứ tự sort hiện tại:
1. `workplace_score DESC`
2. `has_available_slot DESC`
3. `ranking_score DESC` (Bayesian từ review)
4. `priority_score DESC`
5. `years_of_experience DESC`
6. `next_available_slot ASC`
7. `created_at DESC`

### 7.4 Locality-first theo stage
`recommendDoctors()` chạy theo stage:
1. Cùng quận (`hardLocationScope='district'`)
2. Cùng tỉnh/thành (`hardLocationScope='province'`)
3. Liên tỉnh (chỉ khi cho phép fallback)

Trong luồng AI hiện tại:
- đang gọi với `allowCrossProvinceFallback=false` để tránh kéo bác sĩ liên tỉnh quá sớm.

---

## 8) Rating bác sĩ: thu thập và tính điểm

### 8.1 Thu thập review
API: `POST /doctors/:doctorUserId/reviews`

Điều kiện tạo review:
- User phải có role `patient`.
- Review gắn với `booking_id` cụ thể.
- `booking.doctor_user_id` phải khớp bác sĩ được review.
- `booking.patient_user_id` phải là chính user hiện tại.
- Chỉ được review sau khi khám kết thúc:
  - `booking.status='completed'`, hoặc
  - `status='approved'` và `appointment_end_at <= now`.
- Mỗi booking chỉ review 1 lần (`booking_id` unique trong `doctor_reviews`).

### 8.2 Bảng review
`doctor_reviews`:
- `rating` (1..5)
- `bedside_manner`, `clarity`, `wait_time` (1..5, optional)
- `comment`, `is_anonymous`
- `status` (`published`/`hidden`)

### 8.3 Công thức điểm
Trong list/ranking:
- `ratingAverage = AVG(rating)` với review `published`
- `ratingCount = COUNT(*)`
- `recommendationRate = % review có rating >= 4`
- `rankingScore` dùng Bayesian smoothing:

`ranking = (v/(v+m))*R + (m/(v+m))*C`

Trong đó:
- `v`: số lượng review của bác sĩ
- `R`: ratingAverage của bác sĩ
- `C`: global average rating toàn hệ thống
- `m`: ngưỡng tối thiểu mẫu, hiện đang dùng `5`

Ý nghĩa:
- Tránh bác sĩ có 1-2 review 5 sao vượt mặt bác sĩ có nhiều review ổn định.

---

## 9) Các bảng DB liên quan AI/recommendation

### 9.1 Chat
- `chat_sessions`
  - `id`, `user_id`, `title`, `is_active`, `total_tokens`, `metadata`, timestamps
- `chat_messages`
  - `id`, `session_id`, `role`, `content`, `token_count`, `created_at`

### 9.2 Recommendation domain
- `doctor_profiles`
  - hồ sơ bác sĩ, workplace, verification, consultation fee, priority
- `doctor_specialties`
  - mapping bác sĩ - chuyên khoa, `is_primary`
- `doctor_available_slots`
  - lịch khám/slot khả dụng
- `doctor_reviews`
  - rating/review
- `specialties`
  - danh mục chuyên khoa
- `bookings`
  - dữ liệu đặt lịch để kiểm tra quyền review

### 9.3 Index quan trọng
Trong schema có index cho:
- `chat_sessions.user_id`
- `chat_messages.session_id`
- `doctor_reviews(doctor_user_id, created_at desc)`
- `doctor_reviews(patient_user_id)`
- `doctor_reviews(status)`

Gợi ý tối ưu thêm (nếu chưa bật):
- `unaccent` + functional index cho workplace text search (nếu rollout full-text mạnh hơn).

---

## 10) Seed dữ liệu liên quan AI/demo

File: `backend/src/seed.ts`

Đang seed:
- Nhiều specialty active.
- Nhiều bác sĩ demo verified.
- Slot tương lai cho bác sĩ approved.
- Booking + review dataset để test rating/ranking.
- Các bác sĩ TMH Hà Nội phục vụ test locality recommendation:
  - Nam Từ Liêm
  - Cầu Giấy
  - Thanh Xuân

---

## 11) Contract API AI hiện tại

### 11.1 Frontend -> Nest
- `POST /api/ai/chat` (through Next rewrite -> backend `/ai/chat`)

### 11.2 Nest -> Python
- Legacy: `POST /api/v1/chat/`
- New: `POST /v1/chat/`

Response cho frontend giữ tương thích:
- `reply`
- `final_result`
- `doctor_recommendations`
- `hospital_suggestion`
- `recommendation_options`
- `session_id`

---

## 12) Observability và log

### 12.1 Python AI
- In thinking/log cho:
  - phase RAG
  - confidence decision
  - web fallback
  - hospital search/geocoding/overpass

### 12.2 Nest
- Ghi `traceId` cho call gateway sang Python.
- `python_shadow` log so sánh legacy vs new contract.
- Khi timeout/network error có fallback message an toàn cho user.

---

## 13) Các điểm kỹ thuật cần lưu ý (current state)

1. **Dual chat persistence**:
  - Nest đã lưu chat chính thức.
  - Python legacy vẫn còn logic tự lưu chat (nên dọn khi cutover hoàn tất để tránh mâu thuẫn).

2. **Location context qua nhiều lượt**:
  - Đã bổ sung lưu `last_location_hint` trong metadata, dùng lại khi user không nhập lại vị trí.

3. **Recommendation có thể rỗng nếu thiếu context**:
  - Đã có fallback dùng `last_final_result` và intent doctor để tránh UI rỗng.

4. **Latency khi có hospital search**:
  - Geocoding + Overpass có thể chậm; Nest cần timeout đủ lớn (`AI_TIMEOUT_MS`) và retry nhẹ.

---

## 14) Checklist kiểm thử thủ công đề xuất

1. Chat chẩn đoán cơ bản có `final_result`.
2. User gửi location, hệ thống trả hospital suggestion.
3. User bấm/nhắn intent “gợi ý bác sĩ uy tín”, trả doctor cards.
4. Case Hà Nội (`Nam Từ Liêm`) ưu tiên local trước liên tỉnh.
5. Case không dấu (`nam tu liem, ha noi`) vẫn match đúng.
6. Review flow:
  - hoàn tất khám -> tạo review -> điểm hiển thị ở list/detail/AI card.
7. Restart backend/frontend, load lại session cũ vẫn giữ location context.

---

## 15) Biến môi trường quan trọng

### 15.1 Backend (Nest)
- `AI_SERVICE_URL`
- `AI_PROVIDER` = `legacy|python_shadow|python_primary`
- `AI_TIMEOUT_MS`

### 15.2 Python AI
- `GEMINI_API_KEY`
- `LLM_MODEL` (mặc định `gemini-2.0-flash`)
- `TAVILY_API_KEY`
- `CHROMA_DB_DIR`
- `EMBEDDING_MODEL`
- `HOSPITAL_SEARCH_RADIUS_M`
- `HOSPITAL_SUGGESTION_CONFIDENCE_THRESHOLD`
- `DATABASE_URL` (chỉ cần nếu dùng endpoint có persistence bên Python)

---

## 16) Tóm tắt ngắn
- AI chẩn đoán dùng **RAG + Gemini**, fallback web khi cần.
- Gợi ý cơ sở y tế dùng **Nominatim + Overpass**.
- Gợi ý bác sĩ hiện do **Nest query DB + scoring SQL** (location/workplace/rating/slot).
- Rating dùng **Bayesian ranking** để công bằng hơn với số lượng review thấp.
- Chat/session đang do Nest quản lý chính; có metadata để giữ ngữ cảnh qua nhiều lượt.
