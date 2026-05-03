# Current Project State

Cập nhật: `2026-05-02` (Asia/Saigon)

## 1) Tổng quan kiến trúc

Hệ thống hiện gồm 3 dịch vụ chính:

- `frontend`: Next.js App Router, route marketing + patient + doctor + admin.
- `backend`: NestJS + TypeORM, API trung tâm, auth, booking, AI proxy, moderation, livestream, notifications, Q&A.
- `ai service`: FastAPI + LangChain + Gemini + ChromaDB RAG, xử lý chat/diagnostic và gợi ý cơ sở y tế gần người dùng.

DB chạy qua Docker:

- Container: `health-assistant-db`
- DB: `health_assistant`
- Port: `5432`
- Init schema: `backend/database/schema.sql`

## 2) Trạng thái tính năng hiện tại

### Auth / User

- Đăng ký/đăng nhập/đăng xuất email-password.
- OTP verify email cho patient.
- Quên mật khẩu + reset mật khẩu.
- Google OAuth.
- RBAC qua `roles` + `user_roles` (`patient`, `doctor`, `admin`).

### Patient

- AI assistant đa lượt + lịch sử session.
- Chẩn đoán dự kiến từ AI + disclaimer.
- Gợi ý bác sĩ chuyên khoa từ backend.
- Tạo booking theo slot còn chỗ, xem lịch hẹn, hủy lịch pending.
- Quản lý profile và security.

### Doctor

- Quản lý slot.
- Xử lý booking (approve/reject).
- Quản lý bài viết.
- Quản lý livestream.
- Trả lời câu hỏi Q&A.

### Admin

- Dashboard tổng quan.
- Quản lý users.
- Duyệt bác sĩ chờ duyệt.
- Duyệt bài viết/câu hỏi.
- Quản lý specialties.

### Content/Community

- Blog public + comments + reactions.
- Livestream public.
- Q&A public.
- Notifications in-app + SSE.

## 3) Các thay đổi kỹ thuật quan trọng gần đây

### AI recommendation flow

- Frontend AI chat gọi backend `/ai/chat` (không gọi thẳng AI service).
- Backend truyền `user_id` + `patient_context` sang AI service.
- `chat_sessions.user_id` đã được lưu.
- Sau khi có chẩn đoán, backend trả thêm `recommendation_options` (2 lựa chọn):
  - Gợi ý bác sĩ uy tín
  - Bệnh viện/phòng khám gần tôi
- Frontend có fallback UI để vẫn hiển thị 2 lựa chọn nếu message chưa kèm options.

### Gợi ý bác sĩ theo khu vực

- Đã nâng `recommendDoctors` theo chiến lược 3 bước:
  1. cùng quận/huyện
  2. cùng tỉnh/thành
  3. liên tỉnh (fallback khi thiếu kết quả)
- Ranking text location dùng `unaccent` + `pg_trgm`.
- Có index tìm kiếm workplace: `idx_doctor_profiles_workplace_search`.

### Chuẩn hóa chuyên khoa chính

- Đã chuẩn hóa dữ liệu `doctor_specialties` để mỗi bác sĩ chỉ có 1 `is_primary = true`.
- Đã thêm unique partial index:
  - `idx_doctor_specialties_one_primary_per_doctor`

## 4) Trạng thái dữ liệu DB hiện tại (thực tế)

Số bản ghi tại thời điểm cập nhật:

- `users`: 34
- `doctor_profiles`: 31
- `specialties`: 13
- `doctor_specialties`: 63
- `doctor_available_slots`: 616
- `bookings`: 1
- `chat_sessions`: 14
- `chat_messages`: 100
- `posts`: 14
- `doctor_questions`: 0
- `notifications`: 0

Kiểm tra chất lượng dữ liệu:

- Số bác sĩ có nhiều hơn 1 dòng `is_primary = true`: `0`

## 5) Frontend routes chính (đang có trong code)

### Marketing/Public

- `/`
- `/ai`
- `/doctors`
- `/doctors/[id]`
- `/blog`
- `/blog/[slug]`
- `/hoi-bac-si-mien-phi`
- `/hoi-bac-si-mien-phi/[id]`
- `/cam-nang-hoi-dap`
- `/dat-lich`
- `/live/[streamId]`

### Auth

- `/login`
- `/register`
- `/register/verify`
- `/forgot-password`
- `/reset-password`
- `/oauth/google`

### Patient

- `/patient`
- `/patient/ai-assistant`
- `/patient/doctors`
- `/patient/doctors/[doctorUserId]`
- `/patient/bookings`
- `/patient/profile`
- `/patient/security`

### Doctor

- `/doctor`
- `/doctor/slots`
- `/doctor/bookings`
- `/doctor/profile`
- `/doctor/posts`
- `/doctor/posts/create`
- `/doctor/live`
- `/doctor/qa`
- `/doctor/settings`
- `/doctor/security`

### Admin

- `/admin`
- `/admin/users`
- `/admin/doctors/pending`
- `/admin/posts/pending`
- `/admin/questions/pending`
- `/admin/specialties`
- `/admin/settings`

## 6) Ghi chú vận hành

- Rewrite frontend:
  - `/api/:path* -> http://localhost:4000/:path*`
- Schema chat đã nằm trong `backend/database/schema.sql`, không còn phụ thuộc riêng vào `ai service/src/database/chat_schema.sql` cho DB mới.
- Migrations mới đáng chú ý:
  - `20260426_add_workplace_search_extensions_and_index.sql`
  - `20260427_normalize_doctor_specialties_primary.sql`
