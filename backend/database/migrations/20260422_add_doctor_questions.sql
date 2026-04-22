CREATE TABLE IF NOT EXISTS doctor_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(300) NOT NULL,
    question_content TEXT NOT NULL,
    answer_content TEXT,
    category VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    answered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_doctor_questions_status CHECK (status IN ('pending', 'answered'))
);

CREATE INDEX IF NOT EXISTS idx_doctor_questions_created
  ON doctor_questions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_doctor_questions_status
  ON doctor_questions(status);

CREATE INDEX IF NOT EXISTS idx_doctor_questions_patient
  ON doctor_questions(patient_user_id);
