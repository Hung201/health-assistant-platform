# Đặc tả hệ thống chi tiết (đối chiếu code + DB thực tế)

Cập nhật: `2026-05-02` (Asia/Saigon)

## 1) Kiến trúc và runtime

## 1.1 Thành phần

1. `frontend` (Next.js)
2. `backend` (NestJS + TypeORM)
3. `ai service` (FastAPI)
4. `PostgreSQL` (Docker container `health-assistant-db`)

## 1.2 Luồng request chính

1. Frontend gọi `/api/*`.
2. Next rewrite sang backend `http://localhost:4000/*`.
3. Backend xử lý nghiệp vụ, truy cập PostgreSQL.
4. Riêng AI chat: backend gọi `ai service /api/v1/chat/`, sau đó enrich thêm doctor recommendations.

## 2) API backend theo controller

## 2.1 Core

- `GET /`

## 2.2 Auth (`/auth`)

- `POST /auth/register`
- `POST /auth/register/patient/verify-email`
- `POST /auth/register/patient/resend-code`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/google`
- `GET /auth/google/callback`
- `GET /auth/specialties`

## 2.3 Users (`/users`)

- `GET /users/me`
- `POST /users/me/avatar`
- `PATCH /users/me`
- `PATCH /users/me/password`

## 2.4 Doctors public (`/doctors`)

- `GET /doctors`
- `GET /doctors/:doctorUserId`
- `GET /doctors/:doctorUserId/slots`

`GET /doctors` hiện hỗ trợ:

- `specialtyId`
- `provinceCode`
- `districtCode`
- `workplaceQuery`
- `page`
- `limit`

## 2.5 Bookings (`/bookings`)

- `POST /bookings/guest`
- `POST /bookings`
- `GET /bookings/me`
- `GET /bookings/me/:id`
- `GET /bookings/me/:id/payment`
- `PATCH /bookings/me/:id/cancel`

## 2.6 Doctor portal (`/doctor`)

- `GET /doctor/slots`
- `POST /doctor/slots`
- `PATCH /doctor/slots/:id/cancel`
- `GET /doctor/bookings`
- `GET /doctor/dashboard/payment-summary`
- `PATCH /doctor/bookings/:bookingId/approve`
- `PATCH /doctor/bookings/:bookingId/reject`

### Doctor posts (`/doctor/posts`)

- `POST /doctor/posts`
- `GET /doctor/posts`
- `GET /doctor/posts/:id`
- `PATCH /doctor/posts/:id`
- `DELETE /doctor/posts/:id`

### Doctor livestreams (`/doctor/livestreams`)

- `POST /doctor/livestreams`
- `PATCH /doctor/livestreams/:id/go-live`
- `PATCH /doctor/livestreams/:id/end`
- `GET /doctor/livestreams/mine/list`
- `GET /doctor/livestreams/:id/publisher-token`

## 2.7 Livestream public (`/livestreams`)

- `GET /livestreams`
- `GET /livestreams/:id`

## 2.8 AI (`/ai`)

- `POST /ai/chat`
- `GET /ai/sessions`
- `GET /ai/sessions/:id`

## 2.9 Posts (`/posts`)

- `GET /posts`
- `GET /posts/:slug`
- `GET /posts/:slug/comments`
- `POST /posts/:slug/comments`
- `POST /posts/comments/:id/react`

## 2.10 Q&A (`/qa`)

- `GET /qa/questions`
- `GET /qa/questions/:id`
- `POST /qa/questions`
- `GET /qa/doctor/inbox`
- `PATCH /qa/doctor/questions/:id/answer`

## 2.11 Notifications (`/notifications`)

- `GET /notifications/me`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/me/read-all`

## 2.12 Admin (`/admin`)

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

## 2.13 Payments (`/payments`)

- `POST /payments/momo/ipn`

## 3) AI flow hiện tại

## 3.1 Backend AI proxy

`backend/src/ai/ai.service.ts`:

1. Nhận request từ frontend qua `/ai/chat` với user đã xác thực.
2. Build `patient_context` từ:
   - `users` (DOB/gender)
   - `medical_profiles` (height/weight)
   - `patient_chronic_conditions` + `chronic_conditions`
3. Gọi AI service `/api/v1/chat/` với `user_id` + `patient_context`.
4. Dựa vào `suggested_specialty`, map specialty trong DB và gọi recommendDoctors.
5. Trả về:
   - `final_result`
   - `doctor_recommendations`
   - `hospital_suggestion` (nếu có)
   - `recommendation_options` (2 lựa chọn click trên UI)

## 3.2 Recommendation options UI

Frontend patient AI page:

- Render options từ `message.recommendationOptions`.
- Có fallback hiển thị 2 lựa chọn nếu đã có `final_result` nhưng message chưa có options.

## 3.3 Logic gợi ý bác sĩ theo khu vực

`DoctorsService.recommendDoctors` hiện chạy 3 stage:

1. Lọc cứng theo quận/huyện (nếu trích được district từ location hint).
2. Thiếu kết quả thì lọc cứng theo tỉnh/thành.
3. Vẫn thiếu thì fallback liên tỉnh.

Xếp hạng trong từng stage:

1. `workplace_score DESC`
2. `has_available_slot DESC`
3. `priority_score DESC`
4. `years_of_experience DESC`
5. `next_available_slot ASC`

`workplace_score` gồm:

- district match
- province match
- full phrase match
- keyword match

Tìm kiếm dùng `unaccent + lower`, có index trigram.

## 4) Database schema chính (theo `backend/database/schema.sql`)

Tổng số bảng nghiệp vụ chính: 24

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
19. `chat_sessions`
20. `chat_messages`
21. `live_streams`
22. `notifications`
23. `doctor_questions`
24. `comment_reactions` (entity có dùng trong code; dữ liệu lưu reaction comment)

## 4.1 Extension và index quan trọng

- Extension:
  - `uuid-ossp`
  - `unaccent`
  - `pg_trgm`
- Index mới:
  - `idx_doctor_profiles_workplace_search` (GIN trigram trên workplace normalized text)
  - `idx_doctor_specialties_one_primary_per_doctor` (unique partial, đảm bảo tối đa 1 primary)

## 4.2 Migrations hiện có

Trong `backend/database/migrations`:

- `20260422_add_doctor_profile_location_fields.sql`
- `20260422_add_doctor_questions.sql`
- `20260422_add_notifications.sql`
- `20260422_expand_doctor_profile_location_lengths.sql`
- `20260422_update_doctor_questions_moderation_status.sql`
- `20260423_add_users_password_reset.sql`
- `20260426_add_workplace_search_extensions_and_index.sql`
- `20260427_normalize_doctor_specialties_primary.sql`

## 5) Trạng thái dữ liệu thực tế (DB Docker)

Số lượng bản ghi hiện tại:

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

Chất lượng dữ liệu:

- Bác sĩ có nhiều hơn 1 `is_primary=true`: `0`

## 6) Frontend routes (App Router)

## 6.1 Marketing/Public

- `/`
- `/ai`
- `/doctors`
- `/doctors/[id]`
- `/blog`
- `/blog/[slug]`
- `/dat-lich`
- `/cam-nang-hoi-dap`
- `/hoi-bac-si-mien-phi`
- `/hoi-bac-si-mien-phi/[id]`
- `/live/[streamId]`

## 6.2 Auth

- `/login`
- `/register`
- `/register/verify`
- `/forgot-password`
- `/reset-password`
- `/oauth/google`

## 6.3 Patient

- `/patient`
- `/patient/ai-assistant`
- `/patient/doctors`
- `/patient/doctors/[doctorUserId]`
- `/patient/bookings`
- `/patient/profile`
- `/patient/security`

## 6.4 Doctor

- `/doctor`
- `/doctor/slots`
- `/doctor/bookings`
- `/doctor/posts`
- `/doctor/posts/create`
- `/doctor/profile`
- `/doctor/live`
- `/doctor/qa`
- `/doctor/settings`
- `/doctor/security`

## 6.5 Admin

- `/admin`
- `/admin/users`
- `/admin/doctors/pending`
- `/admin/posts/pending`
- `/admin/questions/pending`
- `/admin/specialties`
- `/admin/settings`

## 7) Seed data thực tế

`backend/src/seed.ts` hiện đã có:

- 13 specialties (bao gồm `rang-ham-mat`)
- demo doctors/pending doctors
- địa chỉ fake tại 3 thành phố:
  - Hà Nội
  - TP Hồ Chí Minh
  - Đà Nẵng
- lịch khám tương lai theo khung giờ seed
- normalize lại `doctor_specialties` để còn đúng 1 primary mỗi bác sĩ

## 8) Rủi ro/khoảng trống còn lại

1. `next build` trên môi trường local có thể bị EPERM/timeout do lock file `.next` (không phải lỗi nghiệp vụ).
2. AI service vẫn phụ thuộc external APIs (Gemini, geocoding/overpass) nên cần retry/observability tốt ở production.
3. Một số chỉ số UI marketing/doctor detail vẫn có phần mock (rating, social proof) nếu không có nguồn dữ liệu chuẩn hóa.
