# Đặc tả Yêu cầu và Hệ thống Chi tiết (Detailed System Specifications)

Dự án: **Health Assistant Platform**
Mô tả: Nền tảng hỗ trợ y tế toàn diện với AI, cho phép đăng ký khám bệnh, livestream, hỏi đáp và blog y khoa.

## 1. Phân hệ và Chức năng chi tiết (Functional Specifications)

### 1.1. Module Xác thực & Định danh (Authentication & Authorization)
- **Đăng ký (Register)**:
  - Bệnh nhân (Patient) đăng ký tài khoản qua Email hoặc Số điện thoại.
  - Gửi mã OTP xác thực email (`patient_email_verifications`).
  - Bác sĩ (Doctor) đăng ký tài khoản (cần cung cấp thêm chứng chỉ, chuyên khoa).
- **Đăng nhập (Login)**:
  - Hỗ trợ đăng nhập bằng Email/Password.
  - Đăng nhập bằng Google OAuth (Single Sign-On).
- **Phân quyền (RBAC)**:
  - 3 Roles chính: Bệnh nhân (Patient), Bác sĩ (Doctor), Quản trị viên (Admin).
  - Quản lý phiên bằng JWT lưu trong HTTP-only Cookie.

### 1.2. Phân hệ Bệnh nhân (Patient Portal)
- **Quản lý Hồ sơ cá nhân**:
  - Cập nhật thông tin liên hệ khẩn cấp, địa chỉ.
  - Cập nhật Hồ sơ y tế (Medical Profile): Chiều cao, cân nặng, BMI, dị ứng, thuốc đang dùng, tiền sử gia đình.
  - Quản lý Bệnh mãn tính (Chronic Conditions): Ghi nhận thời gian chẩn đoán, mức độ nghiêm trọng.
  - Nhập triệu chứng bệnh. AI (Gemini) sẽ liên tục hỏi đáp (Chat) để thu thập đủ dữ kiện.
  - AI truy vấn CSDL Y khoa (ChromaDB - RAG) để đưa ra chẩn đoán: danh sách các bệnh có thể mắc, tỷ lệ %, mức độ khẩn cấp, và gợi ý Chuyên khoa cần khám.
  - **Quản lý phiên (Session Management)**: Hỗ trợ tạo phiên mới hoặc xem lại lịch sử các phiên tư vấn cũ từ Database.
  - **Gợi ý Bác sĩ nội bộ**: Dựa trên chuyên khoa do AI gợi ý, hệ thống tự động tìm và hiển thị các bác sĩ phù hợp trong hệ thống (đang rảnh và có điểm ưu tiên cao).
- **Đặt lịch khám (Booking)**:
  - Tìm kiếm Bác sĩ theo: Chuyên khoa, tên, khoảng giá, và địa chỉ (Tỉnh/Thành, Quận/Huyện, Bản đồ).
  - Xem khung giờ trống (Available Slots) của Bác sĩ.
  - Đặt lịch (tùy chọn ghi chú cho bác sĩ).
- **Thanh toán trực tuyến (MoMo Payment)**:
  - Tích hợp thanh toán MoMo (ver 1, ver 2). Thanh toán qua mã QR/App MoMo. Trạng thái thanh toán cập nhật qua IPN Webhook.
- **Quản lý Lịch hẹn (My Bookings)**:
  - Xem danh sách lịch hẹn sắp tới, lịch sử khám.
  - Có thể hủy lịch (nếu đang ở trạng thái chờ/chưa thanh toán).
- **Hỏi đáp Miễn phí (Q&A)**:
  - Gửi câu hỏi y khoa lên nền tảng để các bác sĩ vào trả lời.
- **Tiện ích khác**:
  - Nhận thông báo (Notifications) theo thời gian thực (real-time/SSE).
  - Đọc Blog / Cẩm nang y tế.
  - Xem Livestream tư vấn của các bác sĩ.

### 1.3. Phân hệ Bác sĩ (Doctor Portal)
- **Quản lý Hồ sơ Chuyên môn**:
  - Cập nhật Bio, nơi làm việc, địa chỉ làm việc, giá khám (Consultation fee), kinh nghiệm.
  - Đăng ký Chuyên khoa (có chuyên khoa chính/phụ).
- **Quản lý Lịch trống (Availability Management)**:
  - Thiết lập các khung giờ có thể nhận khám (`start_at`, `end_at`, `max_bookings`).
- **Quản lý Lịch khám (Appointments)**:
  - Xem danh sách lịch hẹn bệnh nhân đặt. Cập nhật trạng thái khám. Xem trước hồ sơ y tế, ghi chú của bệnh nhân.
- **Module Blog**:
  - Soạn thảo và đăng tải bài viết y khoa (Title, Excerpt, Content, Thumbnail). Trạng thái chờ Admin duyệt.
- **Hỏi đáp (Q&A)**:
  - Chọn và trả lời các câu hỏi miễn phí từ bệnh nhân.
- **Live Studio (Livestream)**:
  - Tạo phòng Livestream tư vấn sức khỏe. Quản lý trạng thái (scheduled, live, ended).
- **Thống kê & Cài đặt (Dashboard & Settings)**:
  - Xem báo cáo thống kê lượt khám, doanh thu.
  - Tùy chỉnh thông báo, bảo mật.

### 1.4. Phân hệ Quản trị viên (Admin Portal)
- **Quản lý User & Bác sĩ**:
  - Xem danh sách User. Duyệt hồ sơ bác sĩ (Kiểm tra giấy phép, kinh nghiệm -> chuyển status sang `approved`).
- **Quản lý Chuyên khoa (Specialties)**:
  - Thêm, sửa, xóa danh mục chuyên khoa.
- **Kiểm duyệt Nội dung (Moderation)**:
  - Kiểm duyệt Bài viết (Blog posts) của bác sĩ.
  - Kiểm duyệt Câu hỏi Q&A của bệnh nhân.
- **Quản lý Livestream**:
  - Giám sát các luồng Livestream, có quyền can thiệp/khóa luồng nếu vi phạm.
- **Thống kê Báo cáo**:
  - Dashboard tổng quan: số lượng user, số lượng đặt lịch, doanh thu thanh toán MoMo.

---

## 2. Đặc tả Chi tiết Cơ sở Dữ liệu (Database Schema)

Dưới đây là chi tiết tất cả các bảng và các trường (Fields) trong cơ sở dữ liệu PostgreSQL.

### Nhóm 1: Xác thực & Người dùng (Identity & Users)

**Bảng `users`**: Bảng trung tâm lưu trữ người dùng.
- `id` (UUID): Khóa chính
- `email` (VARCHAR 255): Unique
- `phone` (VARCHAR 20): Unique
- `password_hash` (TEXT)
- `full_name` (VARCHAR 255)
- `avatar_url` (TEXT)
- `avatar_public_id` (VARCHAR 255)
- `date_of_birth` (DATE)
- `gender` (VARCHAR 20)
- `status` (VARCHAR 40): 'active', 'inactive', v.v.
- `email_verified_at` (TIMESTAMPTZ)
- `phone_verified_at` (TIMESTAMPTZ)
- `last_login_at` (TIMESTAMPTZ)
- `created_at`, `updated_at`, `deleted_at` (TIMESTAMPTZ)

**Bảng `user_identities`**: Liên kết tài khoản OAuth (Google SSO).
- `id` (UUID)
- `user_id` (UUID): FK -> users(id)
- `provider` (VARCHAR 50): 'google'
- `provider_sub` (VARCHAR 255): ID từ provider
- `provider_email` (VARCHAR 255)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Bảng `patient_email_verifications`**: Mã OTP xác thực.
- `id` (UUID)
- `user_id` (UUID): FK -> users(id)
- `email` (VARCHAR 255)
- `code_hash` (VARCHAR 255)
- `expires_at` (TIMESTAMPTZ)
- `attempts` (INTEGER)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Bảng `roles`**: Phân quyền hệ thống.
- `id` (SMALLSERIAL)
- `code` (VARCHAR 50): 'patient', 'doctor', 'admin'
- `name` (VARCHAR 100)

**Bảng `user_roles`**: Mapping User - Role.
- `user_id` (UUID): FK -> users(id)
- `role_id` (SMALLINT): FK -> roles(id)
- `created_at` (TIMESTAMPTZ)

### Nhóm 2: Hồ sơ (Profiles & Medical Records)

**Bảng `patient_profiles`**: Hồ sơ bệnh nhân.
- `user_id` (UUID): FK -> users(id)
- `emergency_contact_name` (VARCHAR 255)
- `emergency_contact_phone` (VARCHAR 20)
- `address_line` (TEXT)
- `province_code`, `district_code`, `ward_code` (VARCHAR 120)
- `occupation` (VARCHAR 255)
- `blood_type` (VARCHAR 10)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Bảng `doctor_profiles`**: Hồ sơ bác sĩ.
- `user_id` (UUID): FK -> users(id)
- `professional_title` (VARCHAR 255)
- `license_number` (VARCHAR 100): Giấy phép hành nghề
- `years_of_experience` (INTEGER)
- `bio` (TEXT)
- `workplace_name` (VARCHAR 255)
- `workplace_address` (TEXT)
- `province_code`, `district_code`, `ward_code` (VARCHAR 20)
- `consultation_fee` (NUMERIC 12,2): Giá khám
- `verification_status` (VARCHAR 20): 'pending', 'approved'
- `priority_score` (INTEGER): Điểm ưu tiên để sắp xếp trong danh sách recommend (Tính dựa trên Rating, Bài viết, Kinh nghiệm).
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Bảng `specialties`**: Danh mục chuyên khoa.
- `id` (BIGSERIAL)
- `slug` (VARCHAR 150)
- `name` (VARCHAR 255)
- `description` (TEXT)
- `icon_url` (TEXT)
- `status` (VARCHAR 20)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Bảng `doctor_specialties`**: Mapping Bác sĩ - Chuyên khoa.
- `doctor_user_id` (UUID): FK -> doctor_profiles(user_id)
- `specialty_id` (BIGINT): FK -> specialties(id)
- `is_primary` (BOOLEAN): Là chuyên khoa chính hay không
- `created_at` (TIMESTAMPTZ)

**Bảng `medical_profiles`**: Bệnh án cá nhân của bệnh nhân.
- `patient_user_id` (UUID): FK -> patient_profiles(user_id)
- `height_cm`, `weight_kg`, `bmi` (NUMERIC 5,2)
- `allergies` (TEXT)
- `current_medications` (TEXT)
- `family_history` (TEXT)
- `note` (TEXT)
- `updated_at` (TIMESTAMPTZ)

**Bảng `chronic_conditions`**: Danh mục bệnh mãn tính.
- `id` (BIGSERIAL)
- `code` (VARCHAR 100)
- `name` (VARCHAR 255)
- `description` (TEXT)
- `created_at` (TIMESTAMPTZ)

**Bảng `patient_chronic_conditions`**: Bệnh mãn tính của bệnh nhân.
- `id` (BIGSERIAL)
- `patient_user_id` (UUID): FK -> patient_profiles(user_id)
- `condition_id` (BIGINT): FK -> chronic_conditions(id)
- `diagnosed_at` (DATE)
- `severity_level` (VARCHAR 20)
- `note` (TEXT)
- `created_at` (TIMESTAMPTZ)

### Nhóm 3: Đặt lịch & Thanh toán (Booking & Payments)

**Bảng `doctor_available_slots`**: Khung giờ trống của bác sĩ.
- `id` (BIGSERIAL)
- `doctor_user_id` (UUID): FK -> doctor_profiles(user_id)
- `specialty_id` (BIGINT): FK -> specialties(id)
- `slot_date` (DATE)
- `start_at` (TIMESTAMPTZ)
- `end_at` (TIMESTAMPTZ)
- `max_bookings` (INTEGER)
- `booked_count` (INTEGER)
- `status` (VARCHAR 20): 'available', 'full', 'cancelled'
- `source` (VARCHAR 20)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Bảng `bookings`**: Lịch hẹn khám.
- `id` (UUID)
- `booking_code` (VARCHAR 30): Mã đặt lịch duy nhất
- `patient_user_id` (UUID): FK -> patient_profiles(user_id)
- `doctor_user_id` (UUID): FK -> doctor_profiles(user_id)
- `specialty_id` (BIGINT): FK -> specialties(id)
- `available_slot_id` (BIGINT): FK -> doctor_available_slots(id)
- `patient_note`, `doctor_note`, `rejection_reason`, `cancel_reason` (TEXT)
- `status` (VARCHAR 20): 'pending_review', 'confirmed', 'cancelled', 'completed'
- `payment_method` (VARCHAR 30): 'momo'
- `payment_status` (VARCHAR 30): 'unpaid', 'paid'
- `guest_full_name`, `guest_phone`, `guest_email` (VARCHAR): Thông tin khách ngoài
- `guest_lookup_token` (VARCHAR 64)
- `appointment_date` (DATE)
- `appointment_start_at`, `appointment_end_at` (TIMESTAMPTZ)
- `doctor_name_snapshot`, `specialty_name_snapshot` (VARCHAR 255): Lưu log tên tại thời điểm đặt
- `consultation_fee`, `platform_fee`, `total_fee` (NUMERIC 12,2)
- `approved_at` (TIMESTAMPTZ)
- `approved_by` (UUID)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Bảng `booking_status_logs`**: Lịch sử đổi trạng thái lịch khám.
- `id` (BIGSERIAL)
- `booking_id` (UUID): FK -> bookings(id)
- `old_status`, `new_status` (VARCHAR 20)
- `changed_by` (UUID)
- `note` (TEXT)
- `created_at` (TIMESTAMPTZ)

**Bảng `payments`**: Giao dịch thanh toán.
- `id` (UUID)
- `booking_id` (UUID): FK -> bookings(id)
- `provider` (VARCHAR 30): 'momo'
- `amount` (NUMERIC 12,2)
- `currency` (VARCHAR 10): 'VND'
- `status` (VARCHAR 30): 'pending', 'success', 'failed'
- `provider_order_id` (VARCHAR 100): Order ID gửi sang cổng thanh toán
- `provider_trans_id` (VARCHAR 100): Mã giao dịch nhận từ cổng
- `raw_create_response`, `raw_ipn_body` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### Nhóm 4: Module AI, Nội dung & Tương tác (AI, Content, Interact)

**Bảng `chat_sessions`**: Phiên làm việc với AI.
- `id` (UUID)
- `user_id` (UUID): FK -> users(id)
- `title` (VARCHAR 255)
- `is_active` (BOOLEAN)
- `total_tokens` (INTEGER)
- `metadata` (JSONB)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Bảng `chat_messages`**: Lịch sử tin nhắn chat AI.
- `id` (BIGSERIAL)
- `session_id` (UUID): FK -> chat_sessions(id)
- `role` (VARCHAR 20): 'user', 'assistant', 'system'
- `content` (TEXT)
- `token_count` (INTEGER)
- `created_at` (TIMESTAMPTZ)

**Bảng `posts`**: Bài viết Blog / Cẩm nang.
- `id` (BIGSERIAL)
- `author_user_id` (UUID): FK -> doctor_profiles(user_id)
- `title` (VARCHAR 500)
- `slug` (VARCHAR 255)
- `excerpt` (TEXT)
- `content` (TEXT)
- `thumbnail_url` (TEXT)
- `post_type` (VARCHAR 30): 'medical_article'
- `status` (VARCHAR 20): 'draft', 'pending', 'published', 'rejected'
- `reviewed_by` (UUID)
- `reviewed_at`, `published_at` (TIMESTAMPTZ)
- `rejection_reason` (TEXT)
- `view_count` (BIGINT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Bảng `comments`**: Bình luận bài viết.
- `id` (BIGSERIAL)
- `post_id` (BIGINT): FK -> posts(id)
- `user_id` (UUID): FK -> users(id)
- `parent_comment_id` (BIGINT): FK -> comments(id)
- `content` (TEXT)
- `status` (VARCHAR 20)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Bảng `live_streams`**: Phòng Livestream tư vấn.
- `id` (UUID)
- `doctor_user_id` (UUID): FK -> users(id)
- `title` (VARCHAR 500)
- `description` (TEXT)
- `status` (VARCHAR 20): 'scheduled', 'live', 'ended', 'cancelled'
- `room_name` (VARCHAR 128)
- `started_at`, `ended_at` (TIMESTAMPTZ)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Bảng `notifications`**: Thông báo hệ thống.
- `id` (UUID)
- `user_id` (UUID): FK -> users(id)
- `type` (VARCHAR 50)
- `priority` (VARCHAR 20): 'low', 'normal', 'high'
- `title` (VARCHAR 255)
- `message` (TEXT)
- `link` (VARCHAR 255)
- `is_read` (BOOLEAN)
- `read_at` (TIMESTAMPTZ)
- `metadata` (JSONB)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Bảng `doctor_questions`**: Hỏi đáp y khoa (Q&A).
- `id` (UUID)
- `patient_user_id` (UUID): FK -> users(id)
- `doctor_user_id` (UUID): FK -> users(id)
- `title` (VARCHAR 300)
- `question_content` (TEXT)
- `answer_content` (TEXT)
- `category` (VARCHAR 100)
- `status` (VARCHAR 20): 'pending_review', 'approved', 'answered', 'rejected'
- `answered_at` (TIMESTAMPTZ)
- `created_at`, `updated_at` (TIMESTAMPTZ)
