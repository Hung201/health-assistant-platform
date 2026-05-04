CREATE TABLE IF NOT EXISTS doctor_reviews (
    id BIGSERIAL PRIMARY KEY,
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    doctor_user_id UUID NOT NULL REFERENCES doctor_profiles(user_id) ON DELETE CASCADE,
    patient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL,
    bedside_manner SMALLINT,
    clarity SMALLINT,
    wait_time SMALLINT,
    comment TEXT,
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_doctor_reviews_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT chk_doctor_reviews_bedside CHECK (bedside_manner IS NULL OR bedside_manner BETWEEN 1 AND 5),
    CONSTRAINT chk_doctor_reviews_clarity CHECK (clarity IS NULL OR clarity BETWEEN 1 AND 5),
    CONSTRAINT chk_doctor_reviews_wait CHECK (wait_time IS NULL OR wait_time BETWEEN 1 AND 5),
    CONSTRAINT chk_doctor_reviews_status CHECK (status IN ('published', 'hidden'))
);

CREATE INDEX IF NOT EXISTS idx_doctor_reviews_doctor_created ON doctor_reviews(doctor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_patient ON doctor_reviews(patient_user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_status ON doctor_reviews(status);
