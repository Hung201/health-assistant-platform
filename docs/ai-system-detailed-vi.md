# Tài liệu Chi tiết Hệ thống AI (Health Assistant Platform)

Cập nhật: `2026-05-22` (Asia/Saigon)

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
  - Hiển thị chat đa lượt.
  - Kết quả chẩn đoán (`final_result`) và gợi ý bác sĩ thực tế (`doctor_recommendations`) hiển thị ở **cột bên phải (sidebar)**. Thẻ bác sĩ cho phép click trực tiếp để chuyển hướng sang luồng Đặt lịch.
  - Gợi ý bệnh viện/phòng khám (`hospital_suggestion`) hiển thị **inline** trực tiếp trong luồng chat.
- **Backend (NestJS)**:
  - Gateway/auth/session owner.
  - API AI: `POST /ai/chat`.
  - Lưu `chat_sessions`, `chat_messages`.
  - Enrich response bằng `doctor_recommendations` từ DB backend.
  - Kiểm soát hiển thị nút gợi ý (`recommendation_options`) dựa trên việc đã có vị trí của người dùng chưa.
  - Thực hiện cơ chế chống ảo giác (Anti-hallucination) bằng cách ghi đè tin nhắn phản hồi của LLM khi có gợi ý bác sĩ thực tế.
  - Tự động duy trì chẩn đoán gần nhất bằng cách inject `last_final_result` từ session metadata.
- **AI Service (Python/FastAPI)**:
  - Endpoint mới: `POST /v1/chat/` (tách biệt Phase A và Phase B).
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

## 4) Pipeline AI chẩn đoán & Tìm kiếm cơ sở (Tách biệt 2 Phase)

Hệ thống AI được thiết kế tối ưu bằng cách tách biệt luồng chẩn đoán và tìm kiếm bệnh viện nhằm tiết kiệm token và cải thiện hiệu năng.

### 4.1 Luồng hội thoại và Chẩn đoán (Phase A)
- **Hội thoại thu thập triệu chứng**: LLM (Gemini) đóng vai trò Trợ lý Y tế AI, lắng nghe và đặt 2-3 câu hỏi để làm rõ triệu chứng của người dùng.
- **Quyết định chẩn đoán**: Khi đã thu thập đủ thông tin triệu chứng, LLM sẽ kết thúc câu trả lời bằng từ khóa đặc biệt `READY_TO_DIAGNOSE`.
- **Chạy Diagnostic Agent**:
  1. Chỉ khi phát hiện từ khóa `READY_TO_DIAGNOSE`, hệ thống mới kích hoạt Diagnostic Agent (File: [diagnostic_agent.py](file:///f:/PROJECTS/health-assistant-platform/ai%20service/src/agents/diagnostic_agent.py)).
  2. Truy xuất context từ ChromaDB (RAG) dựa trên toàn bộ triệu chứng đã thu thập trong session.
  3. Prompt `DIAGNOSTIC_PROMPT` + Gemini để sinh ra JSON chẩn đoán.
  4. Nếu điểm tin cậy (`confidence`) thấp hoặc có placeholder, hệ thống fallback gọi Web Search (Tavily), rồi phân tích lại bằng `DIAGNOSTIC_PROMPT_WITH_WEB`.
  5. Parse thành `DiagnosticResult` và trả về trường `final_result`.

**Output chính của Phase A:**
- `top_diseases[]` (rank, disease, match_score, reasoning, suggested_specialty)
- `general_advice`
- `emergency_warning` (nếu có cảnh báo nguy hiểm)
- `used_web_search`, `web_search_sources`

### 4.2 Luồng tìm kiếm cơ sở y tế gần đó (Phase B)
- **Kích hoạt độc lập**: Chạy độc lập khi phát hiện ý định hỏi về địa điểm khám của người dùng (`location intent` qua các từ khóa như *bệnh viện, phòng khám, ở đâu, gần đây...*) hoặc có vị trí mới được trích xuất.
- **Sử dụng chẩn đoán**:
  - Dùng kết quả chẩn đoán mới từ Phase A (nếu vừa chạy).
  - Hoặc tự động khôi phục kết quả chẩn đoán gần nhất (`last_final_result`) từ metadata của session được NestJS lưu trữ trước đó.
- **Geocoding & Tìm kiếm**: Nếu điểm tin cậy của chẩn đoán đạt ngưỡng (`top_score >= HOSPITAL_SUGGESTION_CONFIDENCE_THRESHOLD`, mặc định `0.70`) và có vị trí người dùng (`location`), hệ thống sẽ geocode vị trí qua Nominatim và gọi Overpass API để gợi ý các phòng khám/bệnh viện phù hợp với chuyên khoa chẩn đoán.

---

## 5) Tìm cơ sở y tế gần người dùng

File: [hospital_search.py](file:///f:/PROJECTS/health-assistant-platform/ai%20service/src/tools/hospital_search.py)

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
- Kết quả được trả về dưới dạng `hospital_suggestion` và hiển thị **inline** trực tiếp trong giao diện chat dưới dạng danh sách cơ sở kèm thông tin MapPin/Phone.

---

## 6) Luồng chat và quản lý ngữ cảnh hội thoại

### 6.1 Khởi tạo và Lưu trữ
- NestJS là bên quản lý và lưu trữ chính thức lịch sử hội thoại:
  - `chat_sessions`: Quản lý phiên chat, lưu token sử dụng và siêu dữ liệu (metadata).
  - `chat_messages`: Lưu chi tiết tin nhắn của user và assistant.
- Phía Python AI cũng duy trì lưu vết nội bộ khi gọi endpoint cũ để phục vụ debug, nhưng luồng chính thực tế thuộc quyền quản lý của NestJS.

### 6.2 Lưu trữ Metadata phiên trong NestJS
Cột `chat_sessions.metadata` lưu giữ các trường thông tin quan trọng:
- `ai_provider`: Provider đang chạy (`legacy`, `python_shadow`, hoặc `python_primary`).
- `last_telemetry`: Dữ liệu telemetry từ AI service.
- `last_final_result`: Kết quả chẩn đoán gần nhất (khi có `final_result`). 
  - *Ý nghĩa:* Khi người dùng chuyển hướng hỏi thăm địa chỉ hoặc các thông tin khác mà AI không thực hiện chẩn đoán lại, NestJS sẽ tự động inject lại `last_final_result` này vào response giúp frontend luôn duy trì chẩn đoán và hiển thị nó ở thanh bên phải (sidebar).
- `last_location_hint`: Gợi ý vị trí cuối cùng được trích xuất (từ tin nhắn của user, từ input location hoặc từ kết quả tìm kiếm bệnh viện).
  - *Ý nghĩa:* Tránh việc người dùng phải nhập lại địa chỉ ở các câu hỏi tiếp theo.

### 6.3 Cơ chế chống ảo giác bác sĩ (Anti-hallucination)
- **Ở phía Python AI**: System prompt quy định chặt chẽ rằng trợ lý AI **không được phép tự bịa đặt** tên bác sĩ, số điện thoại hay địa chỉ phòng khám. Chỉ hướng dẫn người dùng xem thông tin bác sĩ và đặt lịch ở thanh bên phải (sidebar).
- **Ở phía NestJS**: Khi API `/ai/chat` tìm thấy bác sĩ thực tế phù hợp từ cơ sở dữ liệu qua `recommendDoctors`, nếu người dùng có ý định hỏi bác sĩ, backend sẽ **ghi đè hoàn toàn (override)** tin nhắn phản hồi của LLM bằng câu trả lời chuẩn hướng dẫn người dùng sử dụng sidebar. Điều này ngăn chặn triệt để tình trạng LLM tự bịa ra thông tin bác sĩ ảo hoặc lấy thông tin không khớp từ web search.

### 6.4 Nút gợi ý lựa chọn (recommendation_options)
- Các nút như "Gợi ý bác sĩ uy tín" hay "Bệnh viện/phòng khám gần tôi" chỉ được trả về từ NestJS backend **sau khi hệ thống đã xác định được vị trí** của người dùng (có `userLocation` hoặc `locationHint`).
- Nếu chưa có vị trí, backend sẽ trả về `recommendation_options = null` để AI tiếp tục hỏi địa chỉ người dùng trước, tránh hiển thị các nút lựa chọn quá sớm.
- Frontend phụ thuộc hoàn toàn vào backend để render các nút này (không tự ý hiển thị fallback).

---

## 7) Gợi ý bác sĩ: thuật toán và hiển thị

Phần này được thực hiện hoàn toàn ở backend NestJS (file [doctors.service.ts](file:///f:/PROJECTS/health-assistant-platform/backend/src/doctors/doctors.service.ts) + [ai.service.ts](file:///f:/PROJECTS/health-assistant-platform/backend/src/ai/ai.service.ts)) dựa trên cơ sở dữ liệu thực tế của hệ thống.

### 7.1 Inputs cho recommendation
- `specialtyId`: Được xác định bằng cách ánh xạ từ `suggested_specialty` trong kết quả chẩn đoán của AI sang danh mục chuyên khoa trong DB (sử dụng so khớp tên không dấu, từ đồng nghĩa hoặc fallback).
- `locationHint` (Độ ưu tiên):
  1. `user_location` gửi trực tiếp từ request chat.
  2. Địa điểm trích xuất tự động từ tin nhắn của người dùng.
  3. Vị trí đã sử dụng trong tìm kiếm bệnh viện (`hospital_suggestion.location_used`).
  4. `last_location_hint` được khôi phục từ metadata của phiên chat.
- `workplaceQuery`: Từ khóa tìm kiếm nơi làm việc của bác sĩ.

### 7.2 Hiển thị kết quả gợi ý bác sĩ
- Danh sách bác sĩ thực tế sau khi truy vấn được trả về trong trường `doctor_recommendations`.
- Frontend hiển thị danh sách này ở **cột bên phải (sidebar)** dưới dạng các thẻ bác sĩ (doctor cards).
- Mỗi thẻ hiển thị đầy đủ thông tin: Ảnh đại diện, tên bác sĩ, chuyên khoa, nơi làm việc, số năm kinh nghiệm, đánh giá trung bình (rating), và lịch khám khả dụng gần nhất.
- Bệnh nhân có thể **click trực tiếp** vào thẻ bác sĩ để chuyển nhanh sang luồng đặt lịch khám (`/dat-lich`).

### 7.3 Chiến dịch lọc theo khu vực (Locality-first)
`DoctorsService.recommendDoctors` áp dụng chiến lược 3 giai đoạn (stage) để tìm kiếm bác sĩ gần người dùng nhất:
1. **Stage 1 (Quận/Huyện)**: Lọc cứng bác sĩ làm việc cùng quận/huyện với người dùng.
2. **Stage 2 (Tỉnh/Thành phố)**: Nếu Stage 1 không có kết quả, mở rộng phạm vi lọc cùng tỉnh/thành phố.
3. **Stage 3 (Liên tỉnh/Toàn quốc)**: Nếu vẫn không có kết quả, fallback tìm kiếm trên toàn quốc (chỉ chạy khi được cấu hình cho phép, trong luồng AI mặc định tắt cross-province để ưu tiên yếu tố địa lý).

### 7.4 Scoring thành phần theo workplace/location
Trong query SQL chấm điểm so khớp địa chỉ:
- `district_match`: +40 điểm.
- `province_match`: +25 điểm.
- `full_phrase_match`: +15 điểm.
- `keyword_match`: +10 điểm.
Tìm kiếm sử dụng PostgreSQL extension `unaccent` kết hợp với index trigram `idx_doctor_profiles_workplace_search` để hỗ trợ tìm kiếm không dấu và viết tắt tốt.

Ngoài ra có các cột hỗ trợ sắp xếp:
- `has_available_slot` (có slot tương lai còn chỗ hay không)
- `next_available_slot`
- `priority_score` (từ doctor profile)
- `years_of_experience`

### 7.5 Xếp hạng tổng thể
Thứ tự sắp xếp trong từng giai đoạn (ưu tiên từ trên xuống dưới):
1. `workplace_score DESC` (Mức độ khớp vị trí/khu vực làm việc, giảm dần)
2. `has_available_slot DESC` (Có lịch khám khả dụng trong tương lai hay không, giảm dần)
3. `ranking_score DESC` (Điểm đánh giá ứng dụng thuật toán Bayesian, giảm dần)
4. `priority_score DESC` (Điểm ưu tiên hệ thống của bác sĩ, giảm dần)
5. `years_of_experience DESC` (Số năm kinh nghiệm, giảm dần)
6. `next_available_slot ASC` (Thời gian đến lịch khám trống gần nhất, tăng dần - ưu tiên lịch càng sớm càng tốt)
7. `created_at DESC` (Thời gian tạo tài khoản, giảm dần - ưu tiên bác sĩ mới tham gia)

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

### 8.3 Công thức điểm (Bayesian Smoothing)
Trong danh sách và hệ thống gợi ý:
- `ratingAverage = AVG(rating)`: Điểm trung bình các review `published`
- `ratingCount = COUNT(*)`: Tổng số lượng đánh giá
- `recommendationRate = % review có rating >= 4`
- `rankingScore` dùng thuật toán **Bayesian Average** (Trung bình Bayes):

`ranking = (v/(v+m))*R + (m/(v+m))*C`

Trong đó:
- `v` (votes): Số lượng đánh giá thực tế của bác sĩ.
- `R` (Rating): Điểm trung bình hiện tại của bác sĩ.
- `C` (Constant/Mean): Điểm trung bình chung của toàn bộ bác sĩ trên hệ thống.
- `m` (minimum): Ngưỡng tối thiểu lượng đánh giá (hệ thống hiện cài đặt là `5`). Đây là "trọng số niềm tin" của hệ thống.

**Ý nghĩa và cơ chế hoạt động:**
- Công thức này giúp đánh giá công bằng giữa bác sĩ mới có ít lượt review (nhưng điểm cao) với bác sĩ lâu năm có nhiều lượt review.
- **Khi `v` nhỏ (bác sĩ mới, ít review):** Điểm đánh giá sẽ bị kéo về gần với điểm trung bình hệ thống (`C`) do chưa đủ dữ liệu để chứng minh năng lực. Tránh tình trạng chỉ với 1-2 đánh giá 5 sao đã có thể đẩy bác sĩ đó lên hạng 1.
- **Khi `v` lớn (bác sĩ đã khám nhiều, nhiều review):** Hệ thống đã có đủ dữ liệu đáng tin cậy. Trọng số sẽ dồn về `R`, điểm xếp hạng lúc này sẽ phản ánh sát nhất với điểm thực tế của chính bác sĩ đó.

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

## 11) Giao thức API AI (API Contract)

### 11.1 Frontend -> NestJS
- Endpoint: `POST /api/ai/chat` (Thông qua Next.js rewrite -> NestJS `/ai/chat`)
- Payload:
  ```json
  {
    "session_id": "uuid-chuỗi-phiên-nếu-có",
    "message": "Nội dung chat của người dùng",
    "user_location": "Vị trí người dùng nhập vào (quận/huyện, tỉnh/thành) hoặc null"
  }
  ```

### 11.2 NestJS -> Python AI Service
- Endpoint: `POST /v1/chat/` (Chế độ `python_primary`)
- Payload:
  ```json
  {
    "session_id": "uuid-phiên",
    "message": "Tin nhắn người dùng",
    "history": [],
    "user_location": "Vị trí người dùng",
    "user_id": "uuid-người-dùng",
    "patient_context": {
      "age": 30,
      "gender": "male",
      "height_cm": 170,
      "weight_kg": 65,
      "chronic_conditions": ["Tiểu đường"]
    }
  }
  ```

### 11.3 Response trả về cho Frontend
Cấu trúc response đảm bộ đồng bộ:
- `session_id`: ID của phiên chat hiện tại.
- `reply` (string): Câu trả lời của AI trợ lý (hoặc đã được NestJS ghi đè bằng hướng dẫn khi có gợi ý bác sĩ).
- `final_result` (DiagnosticResult | null): Kết quả chẩn đoán (được trả về khi Phase A hoàn tất hoặc tự động inject lại từ session metadata).
- `doctor_recommendations` (Array): Danh sách bác sĩ thực tế gợi ý từ DB.
- `hospital_suggestion` (HospitalSuggestion | null): Danh sách bệnh viện/phòng khám gần đó tìm qua OSM (Phase B).
- `recommendation_options` (Array | null): Các nút lựa chọn gợi ý (chỉ trả về khi đã xác định được vị trí người dùng).

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

## 13) Các điểm kỹ thuật cần lưu ý (Current State)

1. **Lưu trữ lịch sử chat**:
   - NestJS quản lý lưu trữ chính thức. Python AI service giữ cơ chế lưu log phục vụ so sánh và chẩn đoán.

2. **Duy trì ngữ cảnh vị trí (Location context)**:
   - Hệ thống tự động cập nhật và duy trì `last_location_hint` trong session metadata để tránh yêu cầu người dùng nhập lại nhiều lần.

3. **Duy trì chẩn đoán (Diagnostic retention)**:
   - Nếu lượt chat hiện tại không kích hoạt lại Phase A (không có chẩn đoán mới), backend tự động khôi phục và trả về `last_final_result` từ session metadata để frontend không bị mất thông tin hiển thị trên sidebar.

4. **Chống ảo giác (Anti-hallucination)**:
   - Kiểm soát nghiêm ngặt câu trả lời của AI: cấm AI bịa thông tin bác sĩ, và backend NestJS chủ động thay thế phản hồi khi tìm thấy bác sĩ thực tế để hướng dẫn người dùng chuyển sang sidebar.

5. **Trễ mạng và tối ưu hiệu năng**:
   - Geocoding và Overpass API tìm cơ sở y tế có thể gây trễ. Việc tách biệt luồng giúp giảm thiểu số lần gọi không cần thiết, đồng thời NestJS hỗ trợ cấu hình timeout và retry hợp lý.

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
- **Tách biệt 2 Phase**: Phase A (chẩn đoán triệu chứng qua RAG + Gemini + Web fallback) và Phase B (tìm kiếm cơ sở y tế qua Nominatim + Overpass khi có location intent).
- **Chống ảo giác**: AI không bịa thông tin bác sĩ; NestJS backend chủ động override reply khi tìm thấy danh sách bác sĩ thực tế từ DB.
- **Gợi ý bác sĩ**: Do NestJS thực hiện bằng cách truy vấn DB + chấm điểm đa tiêu chí (vị trí/workplace/rating/slot khả dụng).
- **Đánh giá bác sĩ**: Điểm đánh giá áp dụng công thức Bayesian smoothing.
- **Trải nghiệm người dùng (UX)**: Chẩn đoán được duy trì qua session metadata. Bác sĩ gợi ý hiển thị ở sidebar và có thể click đặt lịch khám trực tiếp; Bệnh viện gần đó hiển thị inline trong chat. Nút gợi ý chỉ hiện sau khi có vị trí.
