# Detailed System Specs (Code + Live DB Snapshot)

Project: `health-assistant-platform`  
Updated at: `2026-04-23` (timezone: Asia/Saigon)  
Scope: backend, frontend, AI service, and live PostgreSQL in Docker (`health-assistant-db`)

---

## 1. System Overview

### 1.1 Runtime Components

1. `frontend` (Next.js): UI for marketing, patient, doctor, admin.
2. `backend` (NestJS + TypeORM): main API, auth, booking, content, moderation, notifications, AI proxy.
3. `ai service` (FastAPI): multi-turn chat + diagnostic pipeline + hospital suggestion.
4. `postgres` (Docker): primary relational database.

### 1.2 Integration Flow

1. Frontend calls backend via Next rewrite: `/api/* -> http://localhost:4000/*`.
2. Backend AI module calls AI service (`/api/v1/chat/`) and forwards authenticated user context.
3. AI service stores sessions/messages in PostgreSQL (`chat_sessions`, `chat_messages`).
4. Backend enriches AI output with internal doctor recommendations by specialty.

---

## 2. Functional Modules (Current Code State)

### 2.1 Authentication & Identity

- Register/login/logout via email/password.
- Google OAuth supported (`/auth/google`, `/auth/google/callback`).
- Patient email verification OTP:
  - `POST /auth/register/patient/verify-email`
  - `POST /auth/register/patient/resend-code`
- RBAC by `roles` + `user_roles` (`patient`, `doctor`, `admin`).
- User status used in code: `pending_email_verification`, `active`, `disabled`.

### 2.2 Patient Portal

- Manage profile and medical context:
  - `users`, `patient_profiles`, `medical_profiles`, `patient_chronic_conditions`.
- Browse doctors by specialty/location (`provinceCode`, `districtCode`).
- Booking (authenticated and guest):
  - `POST /bookings`
  - `POST /bookings/guest`
  - `PATCH /bookings/me/:id/cancel`
- Booking payment info + MoMo IPN handling.
- AI assistant with chat history and doctor recommendation.
- Notifications (list/read/read-all + SSE stream).
- Public blog + comments + comment reactions.
- Public Q&A.
- Livestream viewing/join.

### 2.3 Doctor Portal

- Manage doctor profile + specialties.
- Manage available slots (`/doctor/slots`).
- Review/approve/reject bookings.
- Doctor posts CRUD (`/doctor/posts`).
- Livestream control:
  - create, go-live, end, publisher-token, mine/list.
- Q&A inbox and answer.
- Payment/revenue dashboard summary.

### 2.4 Admin Portal

- Dashboard summary.
- User management + feature permissions (`users.feature_permissions`).
- Doctor verification approve/reject.
- Moderation for posts and Q&A questions.
- Specialty CRUD + status management.

---

## 3. API Surface (Observed from Controllers)

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

## 4. Database Spec (Live DB in Docker)

Live DB inspected from container `health-assistant-db`, database `health_assistant`.

### 4.1 Total tables: 24

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

### 4.2 Table details (columns)

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
- Extra live column detected: `userId (uuid, nullable)` (schema drift artifact)

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
- `patient_user_id (FK -> patient_profiles.user_id, nullable for guest flow)`
- `doctor_user_id (FK -> doctor_profiles.user_id)`
- `specialty_id (FK -> specialties.id)`
- `available_slot_id (FK -> doctor_available_slots.id, nullable)`
- `patient_note, doctor_note, rejection_reason, cancel_reason`
- `status (varchar, live default 'pending')`
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
- Unique constraint on `(comment_id, user_id)`

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
- `status (live default 'pending_review')`
- `answered_at`
- `created_at, updated_at`

---

## 5. AI + Doctor Recommendation (Current Real Behavior)

### 5.1 Authenticated AI Chat

1. Frontend (`chat.store.ts`) posts to backend endpoint `/api/ai/chat`, not directly to AI service.
2. Backend (`AiService.chat`) injects:
   - `user_id = currentUser.id`
   - `patient_context` built from:
     - `users` (age, gender)
     - `medical_profiles` (height_cm, weight_kg)
     - `patient_chronic_conditions` + `chronic_conditions` (chronic condition names)
3. AI service stores/updates `chat_sessions.user_id`.

### 5.2 Doctor Recommendation Enrichment

1. AI service returns `final_result.top_diseases[*].suggested_specialty`.
2. Backend maps specialty by name (`ILIKE` in `specialties` where `status='active'`).
3. Backend fetches top doctors (`recommendDoctors`) and returns `doctor_recommendations`.

---

## 6. Confirmed Schema Drift / Risks

These are verified mismatches between files and live DB as of `2026-04-23`:

1. `comment_reactions` exists in live DB and code entities, but not present in `backend/database/schema.sql`.
2. `users.feature_permissions` exists in live DB and entity, but missing from `schema.sql`.
3. `user_identities.userId` extra column exists in live DB (legacy artifact), not in `schema.sql`.
4. `bookings.status` default:
   - `schema.sql`: `pending_review`
   - live DB + entity/service logic: `pending`
5. `doctor_questions.status` in `schema.sql` currently shows default `'pending'` but check allows `pending_review/approved/answered/rejected`; live DB default is `pending_review`.
6. Timestamp type drift:
   - many `created_at/updated_at` in live DB are `timestamp without time zone`
   - while DDL/entity intent often uses `timestamptz`.
7. `TypeORM synchronize` is enabled when `NODE_ENV !== 'production'`, so schema can continue drifting unless migrations are enforced.

---

## 7. Recommended Follow-up (to keep specs and DB stable)

1. Freeze schema source of truth: move to migrations only, disable `synchronize` in shared environments.
2. Create a migration to align:
   - add missing DDL to `schema.sql` (`comment_reactions`, `feature_permissions`)
   - unify defaults/status enums (`bookings.status`, `doctor_questions.status`)
   - remove legacy `user_identities.userId` if no code depends on it.
3. Keep this doc updated using live DB introspection after each major pull/release.

