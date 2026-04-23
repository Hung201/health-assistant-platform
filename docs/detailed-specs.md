# Đặc tả Hệ thống Chi tiết (Code + Ảnh chụp DB thực tế)

Dự án: `health-assistant-platform`  
Cập nhật lúc: `2026-04-23` (múi giờ: Asia/Saigon)  
Phạm vi: backend, frontend, AI service và PostgreSQL chạy Docker (`health-assistant-db`)

---

## 1. Tổng quan hệ thống

### 1.1 Thành phần runtime

1. `frontend` (Next.js): giao diện marketing, patient, doctor, admin.
2. `backend` (NestJS + TypeORM): API chính, auth, booking, nội dung, moderation, notifications, AI proxy.
3. `ai service` (FastAPI): chat nhiều lượt, phân tích chẩn đoán, gợi ý cơ sở y tế.
4. `postgres` (Docker): cơ sở dữ liệu quan hệ chính.

### 1.2 Luồng tích hợp

1. Frontend gọi backend qua rewrite: `/api/* -> http://localhost:4000/*`.
2. Backend module AI gọi AI service (`/api/v1/chat/`) và truyền ngữ cảnh user đã đăng nhập.
3. AI service lưu session/message vào PostgreSQL (`chat_sessions`, `chat_messages`).
4. Backend enrich kết quả AI bằng danh sách bác sĩ gợi ý theo chuyên khoa.

---

## 2. Các phân hệ chức năng (theo trạng thái code hiện tại)

### 2.1 Xác thực & định danh

- Đăng ký/đăng nhập/đăng xuất bằng email + password.
- Hỗ trợ Google OAuth (`/auth/google`, `/auth/google/callback`).
- Xác thực email bệnh nhân bằng OTP:
  - `POST /auth/register/patient/verify-email`
  - `POST /auth/register/patient/resend-code`
- Phân quyền RBAC qua `roles` + `user_roles` (`patient`, `doctor`, `admin`).
- Trạng thái user đang dùng trong code: `pending_email_verification`, `active`, `disabled`.

### 2.2 Cổng bệnh nhân (Patient Portal)

- Quản lý hồ sơ và dữ liệu y tế:
  - `users`, `patient_profiles`, `medical_profiles`, `patient_chronic_conditions`.
- Tìm bác sĩ theo chuyên khoa/khu vực (`provinceCode`, `districtCode`).
- Đặt lịch khám (đăng nhập và khách):
  - `POST /bookings`
  - `POST /bookings/guest`
  - `PATCH /bookings/me/:id/cancel`
- Lấy thông tin thanh toán + xử lý IPN MoMo.
- AI assistant có lịch sử phiên và gợi ý bác sĩ.
- Notifications (danh sách/đánh dấu đọc/đọc tất cả + SSE stream).
- Blog công khai + bình luận + reaction bình luận.
- Q&A công khai.
- Xem/tham gia livestream.

### 2.3 Cổng bác sĩ (Doctor Portal)

- Quản lý hồ sơ bác sĩ + chuyên khoa.
- Quản lý lịch trống (`/doctor/slots`).
- Duyệt/từ chối lịch hẹn.
- CRUD bài viết bác sĩ (`/doctor/posts`).
- Điều khiển livestream:
  - create, go-live, end, publisher-token, mine/list.
- Hộp thư Q&A và trả lời.
- Dashboard doanh thu/thanh toán.

### 2.4 Cổng admin

- Dashboard tổng quan.
- Quản lý user + quyền tính năng (`users.feature_permissions`).
- Duyệt hồ sơ bác sĩ.
- Duyệt bài viết và câu hỏi Q&A.
- CRUD chuyên khoa + quản lý trạng thái.

---

## 3. Danh sách API (đọc từ controller)

### 3.1 Core

- `GET /`

### 3.2 Auth

- `POST /auth/register`
- `POST /auth/register/patient/verify-email`
- `POST /auth/register/patient/resend-code`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/google`
- `GET /auth/google/callback`
- `GET /auth/specialties`

### 3.3 Users

- `GET /users/me`
- `POST /users/me/avatar`
- `PATCH /users/me`
- `PATCH /users/me/password`

### 3.4 Doctors (Public)

- `GET /doctors`
- `GET /doctors/:doctorUserId`
- `GET /doctors/:doctorUserId/slots`

### 3.5 Bookings

- `POST /bookings/guest`
- `POST /bookings`
- `GET /bookings/me`
- `GET /bookings/me/:id`
- `GET /bookings/me/:id/payment`
- `PATCH /bookings/me/:id/cancel`

### 3.6 Doctor Portal

- `GET /doctor/slots`
- `POST /doctor/slots`
- `PATCH /doctor/slots/:id/cancel`
- `GET /doctor/bookings`
- `GET /doctor/dashboard/payment-summary`
- `PATCH /doctor/bookings/:bookingId/approve`
- `PATCH /doctor/bookings/:bookingId/reject`
- `POST /doctor/posts`
- `GET /doctor/posts`
- `GET /doctor/posts/:id`
- `PATCH /doctor/posts/:id`
- `DELETE /doctor/posts/:id`

### 3.7 AI

- `POST /ai/chat`
- `GET /ai/sessions`
- `GET /ai/sessions/:id`

### 3.8 Posts & Community

- `GET /posts`
- `GET /posts/:slug`
- `GET /posts/:slug/comments`
- `POST /posts/:slug/comments`
- `POST /posts/comments/:id/react`

### 3.9 Livestreams

- Public:
  - `GET /livestreams`
  - `GET /livestreams/:id`
- Doctor:
  - `POST /doctor/livestreams`
  - `PATCH /doctor/livestreams/:id/go-live`
  - `PATCH /doctor/livestreams/:id/end`
  - `GET /doctor/livestreams/mine/list`
  - `GET /doctor/livestreams/:id/publisher-token`

### 3.10 Notifications

- `GET /notifications/me`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/me/read-all`

### 3.11 Q&A

- `GET /qa/questions`
- `GET /qa/questions/:id`
- `POST /qa/questions`
- `GET /qa/doctor/inbox`
- `PATCH /qa/doctor/questions/:id/answer`

### 3.12 Admin

- `GET /admin/dashboard/summary`
- `GET /admin/users`
- `GET /admin/users/:id`
- `POST /admin/users`
- `PATCH /admin/users/:id`
- `GET /admin/doctors/pending`
- `PATCH /admin/doctors/:userId/approve`
- `PATCH /admin/doctors/:userId/reject`
- `GET /admin/posts/pending`
- `GET /admin/posts/:id`
- `PATCH /admin/posts/:id/approve`
- `PATCH /admin/posts/:id/reject`
- `GET /admin/questions/pending`
- `PATCH /admin/questions/:id/approve`
- `PATCH /admin/questions/:id/reject`
- `GET /admin/specialties`
- `POST /admin/specialties`
- `PATCH /admin/specialties/:id`
- `PATCH /admin/specialties/:id/status`

### 3.13 Payments

- `POST /payments/momo/ipn`

---

## 4. Đặc tả Database (DB thực tế trong Docker)

DB được kiểm tra từ container `health-assistant-db`, database `health_assistant`.

### 4.1 Tổng số bảng: 24

1. `users`
2. `user_identities`
3. `patient_email_verifications`
4. `roles`
5. `user_roles`
6. `patient_profiles`
7. `doctor_profiles`
8. `specialties`
9. `doctor_specialties`
10. `medical_profiles`
11. `chronic_conditions`
12. `patient_chronic_conditions`
13. `doctor_available_slots`
14. `bookings`
15. `payments`
16. `booking_status_logs`
17. `posts`
18. `comments`
19. `comment_reactions`
20. `chat_sessions`
21. `chat_messages`
22. `live_streams`
23. `notifications`
24. `doctor_questions`

### 4.2 Chi tiết bảng (cột)

#### `users`
- `id (uuid, PK, default uuid_generate_v4())`
- `email (varchar, unique, not null)`
- `phone (varchar, unique, nullable)`
- `password_hash (text, not null)`
- `full_name (varchar, not null)`
- `avatar_url (text, nullable)`
- `avatar_public_id (varchar, nullable)`
- `date_of_birth (date, nullable)`
- `gender (varchar, nullable)`
- `status (varchar, default 'active')`
- `feature_permissions (jsonb, default '{}'::jsonb)`
- `email_verified_at, phone_verified_at, last_login_at, deleted_at`
- `created_at, updated_at`

#### `user_identities`
- `id (uuid, PK)`
- `user_id (uuid, FK -> users.id, not null)`
- `provider (varchar, not null)`
- `provider_sub (varchar, not null)`
- `provider_email (varchar, nullable)`
- `created_at, updated_at`
- Cột dư trong DB thực tế: `userId (uuid, nullable)` (dấu vết drift lịch sử)

#### `patient_email_verifications`
- `id (uuid, PK)`
- `user_id (uuid, unique FK -> users.id)`
- `email, code_hash`
- `expires_at`
- `attempts (int, default 0)`
- `created_at, updated_at`

#### `roles`
- `id (smallint, PK)`
- `code (unique)`
- `name`

#### `user_roles`
- `user_id (FK -> users.id)`
- `role_id (FK -> roles.id)`
- `created_at`
- Composite PK: `(user_id, role_id)`

#### `patient_profiles`
- `user_id (PK FK -> users.id)`
- `emergency_contact_name`
- `emergency_contact_phone`
- `address_line`
- `province_code, district_code, ward_code`
- `occupation`
- `blood_type`
- `created_at, updated_at`

#### `doctor_profiles`
- `user_id (PK FK -> users.id)`
- `professional_title`
- `license_number`
- `years_of_experience`
- `bio`
- `workplace_name`
- `workplace_address`
- `province_code, district_code, ward_code`
- `consultation_fee (numeric, default 0)`
- `priority_score (int, default 0)`
- `is_available_for_booking (bool, default true)`
- `is_verified (bool, default false)`
- `verification_status (varchar, default 'pending')`
- `created_at, updated_at`

#### `specialties`
- `id (bigint, PK)`
- `slug (unique)`
- `name`
- `description`
- `icon_url`
- `status (default 'active')`
- `created_at, updated_at`

#### `doctor_specialties`
- `doctor_user_id (FK -> doctor_profiles.user_id)`
- `specialty_id (FK -> specialties.id)`
- `is_primary (bool, default false)`
- `created_at`
- Composite PK: `(doctor_user_id, specialty_id)`

#### `medical_profiles`
- `patient_user_id (PK FK -> patient_profiles.user_id)`
- `height_cm, weight_kg, bmi`
- `allergies`
- `current_medications`
- `family_history`
- `note`
- `updated_at`

#### `chronic_conditions`
- `id (bigint, PK)`
- `code (unique, nullable)`
- `name`
- `description`
- `created_at`

#### `patient_chronic_conditions`
- `id (bigint, PK)`
- `patient_user_id (FK -> patient_profiles.user_id)`
- `condition_id (FK -> chronic_conditions.id)`
- `diagnosed_at`
- `severity_level`
- `note`
- `created_at`

#### `doctor_available_slots`
- `id (bigint, PK)`
- `doctor_user_id (FK -> doctor_profiles.user_id)`
- `specialty_id (FK -> specialties.id, nullable)`
- `slot_date`
- `start_at, end_at`
- `max_bookings (default 1)`
- `booked_count (default 0)`
- `status (default 'available')`
- `source (default 'manual')`
- `created_at, updated_at`

#### `bookings`
- `id (uuid, PK)`
- `booking_code (varchar, unique)`
- `patient_user_id (FK -> patient_profiles.user_id, nullable cho guest flow)`
- `doctor_user_id (FK -> doctor_profiles.user_id)`
- `specialty_id (FK -> specialties.id)`
- `available_slot_id (FK -> doctor_available_slots.id, nullable)`
- `patient_note, doctor_note, rejection_reason, cancel_reason`
- `status (varchar, default thực tế: 'pending')`
- `payment_method (default 'momo')`
- `payment_status (default 'unpaid')`
- `guest_full_name, guest_phone, guest_email, guest_lookup_token (unique)`
- `appointment_date`
- `appointment_start_at, appointment_end_at`
- `doctor_name_snapshot, specialty_name_snapshot`
- `consultation_fee, platform_fee, total_fee`
- `approved_at, approved_by`
- `created_at, updated_at`

#### `payments`
- `id (uuid, PK)`
- `booking_id (FK -> bookings.id)`
- `provider (default 'momo')`
- `amount`
- `currency (default 'VND')`
- `status (default 'pending')`
- `provider_order_id (unique)`
- `provider_trans_id`
- `raw_create_response, raw_ipn_body`
- `created_at, updated_at`

#### `booking_status_logs`
- `id (bigint, PK)`
- `booking_id (FK -> bookings.id)`
- `old_status`
- `new_status`
- `changed_by (FK -> users.id)`
- `note`
- `created_at`

#### `posts`
- `id (bigint, PK)`
- `author_user_id (FK -> doctor_profiles.user_id)`
- `title`
- `slug (unique)`
- `excerpt`
- `content`
- `thumbnail_url`
- `post_type (default 'medical_article')`
- `status (default 'draft')`
- `reviewed_by (FK -> users.id)`
- `reviewed_at, published_at`
- `rejection_reason`
- `view_count (default 0)`
- `created_at, updated_at`

#### `comments`
- `id (bigint, PK)`
- `post_id (FK -> posts.id)`
- `user_id (FK -> users.id)`
- `parent_comment_id (self FK, nullable)`
- `content`
- `status (default 'visible')`
- `created_at, updated_at`

#### `comment_reactions`
- `id (bigint, PK)`
- `comment_id (FK -> comments.id)`
- `user_id (FK -> users.id)`
- `type (default 'like')`
- `created_at`
- Unique constraint trên `(comment_id, user_id)`

#### `chat_sessions`
- `id (uuid, PK)`
- `user_id (FK -> users.id, nullable)`
- `title`
- `is_active (default true)`
- `total_tokens (default 0)`
- `metadata (jsonb, nullable)`
- `created_at, updated_at`

#### `chat_messages`
- `id (bigint, PK)`
- `session_id (FK -> chat_sessions.id)`
- `role`
- `content`
- `token_count`
- `created_at`

#### `live_streams`
- `id (uuid, PK)`
- `doctor_user_id (FK -> users.id)`
- `title`
- `description`
- `status (default 'scheduled')`
- `room_name (unique)`
- `started_at, ended_at`
- `created_at, updated_at`

#### `notifications`
- `id (uuid, PK)`
- `user_id (FK -> users.id)`
- `type`
- `priority (default 'normal')`
- `title`
- `message`
- `link`
- `is_read (default false)`
- `read_at`
- `metadata (jsonb, default '{}'::jsonb)`
- `created_at, updated_at`

#### `doctor_questions`
- `id (uuid, PK)`
- `patient_user_id (FK -> users.id)`
- `doctor_user_id (FK -> users.id, nullable)`
- `title`
- `question_content`
- `answer_content`
- `category`
- `status (default thực tế: 'pending_review')`
- `answered_at`
- `created_at, updated_at`

---

## 5. AI + Recomment Bác sĩ (hành vi hiện tại)

### 5.1 Chat AI có gắn user thật

1. Frontend (`chat.store.ts`) gọi backend `/api/ai/chat`, không gọi trực tiếp AI service.
2. Backend (`AiService.chat`) bổ sung:
   - `user_id = currentUser.id`
   - `patient_context` lấy từ:
     - `users` (tuổi, giới tính)
     - `medical_profiles` (chiều cao, cân nặng)
     - `patient_chronic_conditions` + `chronic_conditions` (bệnh mãn tính)
3. AI service lưu/cập nhật `chat_sessions.user_id`.

### 5.2 Enrich danh sách bác sĩ gợi ý

1. AI service trả về `final_result.top_diseases[*].suggested_specialty`.
2. Backend map chuyên khoa bằng tên (`ILIKE` trong `specialties`, trạng thái `active`).
3. Backend gọi `recommendDoctors` và trả `doctor_recommendations` cho frontend.

---

## 6. Các điểm lệch schema đã xác nhận (Schema Drift / Risks)

Các điểm dưới đây đã đối chiếu giữa file DDL và DB thực tế tại `2026-04-23`:

1. `comment_reactions` có trong DB thực tế và entity code, nhưng chưa có trong `backend/database/schema.sql`.
2. `users.feature_permissions` có trong DB thực tế và entity code, nhưng thiếu trong `schema.sql`.
3. `user_identities.userId` là cột dư trong DB thực tế (artifact lịch sử), không có trong `schema.sql`.
4. `bookings.status`:
   - `schema.sql`: default `pending_review`
   - DB thực tế + logic entity/service: `pending`
5. `doctor_questions.status` trong `schema.sql` đang default `'pending'`, nhưng check constraint và DB thực tế dùng `pending_review`.
6. Lệch kiểu thời gian:
   - nhiều `created_at/updated_at` trong DB thực tế là `timestamp without time zone`
   - trong DDL/entity thường định hướng `timestamptz`.
7. `TypeORM synchronize` đang bật khi `NODE_ENV !== 'production'`, có thể tiếp tục tạo drift schema.

---

## 7. Khuyến nghị tiếp theo để ổn định spec và DB

1. Chốt nguồn sự thật schema bằng migration, tắt `synchronize` ở môi trường dùng chung.
2. Tạo migration để đồng bộ:
   - thêm DDL còn thiếu vào `schema.sql` (`comment_reactions`, `feature_permissions`)
   - chuẩn hóa default/status (`bookings.status`, `doctor_questions.status`)
   - xóa cột dư `user_identities.userId` nếu đã xác nhận không còn phụ thuộc.
3. Sau mỗi lần pull/release lớn, cập nhật lại tài liệu này bằng introspection DB thực tế.

