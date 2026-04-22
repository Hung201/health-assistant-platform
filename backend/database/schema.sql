-- ============================================================
-- Health Assistant Platform - PostgreSQL Schema (MVP)
-- Chạy theo thứ tự để tránh lỗi khóa ngoại
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    avatar_public_id VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(20),
    status VARCHAR(40) NOT NULL DEFAULT 'active',
    email_verified_at TIMESTAMPTZ,
    phone_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 1.1) user_identities (OAuth / SSO)
-- Liên kết user nội bộ với tài khoản provider (Google, Facebook, ...)
CREATE TABLE user_identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,          -- e.g. 'google'
    provider_sub VARCHAR(255) NOT NULL,     -- subject/id của provider
    provider_email VARCHAR(255),            -- email provider (nếu có)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_sub)
);

-- 1.2) patient_email_verifications (OTP xác thực email lúc đăng ký bệnh nhân)
CREATE TABLE patient_email_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) roles
CREATE TABLE roles (
    id SMALLSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL
);

INSERT INTO roles (code, name) VALUES
('patient', 'Bệnh nhân'),
('doctor', 'Bác sĩ'),
('admin', 'Quản trị viên');

-- 3) user_roles
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id SMALLINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- 4) patient_profiles
CREATE TABLE patient_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    address_line TEXT,
    province_code VARCHAR(20),
    district_code VARCHAR(20),
    ward_code VARCHAR(20),
    occupation VARCHAR(255),
    blood_type VARCHAR(10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5) doctor_profiles
CREATE TABLE doctor_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    professional_title VARCHAR(255),
    license_number VARCHAR(100),
    years_of_experience INTEGER,
    bio TEXT,
    workplace_name VARCHAR(255),
    consultation_fee NUMERIC(12,2) DEFAULT 0,
    priority_score INTEGER NOT NULL DEFAULT 0,
    is_available_for_booking BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6) specialties
CREATE TABLE specialties (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(150) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7) doctor_specialties
CREATE TABLE doctor_specialties (
    doctor_user_id UUID NOT NULL REFERENCES doctor_profiles(user_id) ON DELETE CASCADE,
    specialty_id BIGINT NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (doctor_user_id, specialty_id)
);

-- 8) medical_profiles
CREATE TABLE medical_profiles (
    patient_user_id UUID PRIMARY KEY REFERENCES patient_profiles(user_id) ON DELETE CASCADE,
    height_cm NUMERIC(5,2),
    weight_kg NUMERIC(5,2),
    bmi NUMERIC(5,2),
    allergies TEXT,
    current_medications TEXT,
    family_history TEXT,
    note TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9) chronic_conditions
CREATE TABLE chronic_conditions (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10) patient_chronic_conditions
CREATE TABLE patient_chronic_conditions (
    id BIGSERIAL PRIMARY KEY,
    patient_user_id UUID NOT NULL REFERENCES patient_profiles(user_id) ON DELETE CASCADE,
    condition_id BIGINT NOT NULL REFERENCES chronic_conditions(id) ON DELETE CASCADE,
    diagnosed_at DATE,
    severity_level VARCHAR(20),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (patient_user_id, condition_id)
);

-- 11) doctor_available_slots
CREATE TABLE doctor_available_slots (
    id BIGSERIAL PRIMARY KEY,
    doctor_user_id UUID NOT NULL REFERENCES doctor_profiles(user_id) ON DELETE CASCADE,
    specialty_id BIGINT REFERENCES specialties(id) ON DELETE SET NULL,
    slot_date DATE NOT NULL,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    max_bookings INTEGER NOT NULL DEFAULT 1,
    booked_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    source VARCHAR(20) NOT NULL DEFAULT 'manual',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12) bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_code VARCHAR(30) UNIQUE NOT NULL,
    patient_user_id UUID REFERENCES patient_profiles(user_id) ON DELETE CASCADE,
    doctor_user_id UUID NOT NULL REFERENCES doctor_profiles(user_id) ON DELETE CASCADE,
    specialty_id BIGINT NOT NULL REFERENCES specialties(id),
    available_slot_id BIGINT REFERENCES doctor_available_slots(id) ON DELETE SET NULL,

    patient_note TEXT,
    doctor_note TEXT,
    rejection_reason TEXT,
    cancel_reason TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(30) NOT NULL DEFAULT 'momo',
    payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid',
    guest_full_name VARCHAR(255),
    guest_phone VARCHAR(30),
    guest_email VARCHAR(255),
    guest_lookup_token VARCHAR(64) UNIQUE,

    appointment_date DATE NOT NULL,
    appointment_start_at TIMESTAMPTZ NOT NULL,
    appointment_end_at TIMESTAMPTZ NOT NULL,

    doctor_name_snapshot VARCHAR(255) NOT NULL,
    specialty_name_snapshot VARCHAR(255) NOT NULL,

    consultation_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
    platform_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_fee NUMERIC(12,2) NOT NULL DEFAULT 0,

    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT bookings_patient_or_guest CHECK (
        patient_user_id IS NOT NULL
        OR (guest_full_name IS NOT NULL AND guest_phone IS NOT NULL AND guest_email IS NOT NULL)
    )
);

-- 12b) payments (MoMo / cổng khác)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    provider VARCHAR(30) NOT NULL DEFAULT 'momo',
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    provider_order_id VARCHAR(100) UNIQUE NOT NULL,
    provider_trans_id VARCHAR(100),
    raw_create_response TEXT,
    raw_ipn_body TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_booking_id ON payments(booking_id);

-- 13) booking_status_logs
CREATE TABLE booking_status_logs (
    id BIGSERIAL PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by UUID REFERENCES users(id),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14) posts
CREATE TABLE posts (
    id BIGSERIAL PRIMARY KEY,
    author_user_id UUID NOT NULL REFERENCES doctor_profiles(user_id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    thumbnail_url TEXT,
    post_type VARCHAR(30) NOT NULL DEFAULT 'medical_article',
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    published_at TIMESTAMPTZ,
    view_count BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15) comments
CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'visible',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16) chat_sessions
-- Luu phien chat cua AI Service. Dat trong schema chinh de Docker init DB moi
-- khong bi thieu bang khi frontend/backend goi AI chat.
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    total_tokens INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17) chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18) live_streams (bác sĩ phát, khách xem qua LiveKit)
CREATE TABLE IF NOT EXISTS live_streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    room_name VARCHAR(128) NOT NULL UNIQUE,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_live_streams_status CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_live_streams_doctor ON live_streams(doctor_user_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_status ON live_streams(status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_one_live_per_doctor
    ON live_streams(doctor_user_id)
    WHERE status = 'live';

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_doctor_specialties_specialty_id ON doctor_specialties(specialty_id);
CREATE INDEX idx_slots_doctor_date_status ON doctor_available_slots(doctor_user_id, slot_date, status);
CREATE INDEX idx_bookings_patient ON bookings(patient_user_id);
CREATE INDEX idx_bookings_doctor ON bookings(doctor_user_id);
CREATE INDEX idx_bookings_status_date ON bookings(status, appointment_date);
CREATE INDEX idx_booking_status_logs_booking_id ON booking_status_logs(booking_id);
CREATE INDEX idx_posts_status_published_at ON posts(status, published_at DESC);
CREATE INDEX idx_posts_author ON posts(author_user_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
