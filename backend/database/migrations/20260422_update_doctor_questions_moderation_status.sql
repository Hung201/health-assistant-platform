ALTER TABLE doctor_questions
  ALTER COLUMN status SET DEFAULT 'pending_review';

UPDATE doctor_questions
SET status = 'approved'
WHERE status = 'pending';

ALTER TABLE doctor_questions
  DROP CONSTRAINT IF EXISTS chk_doctor_questions_status;

ALTER TABLE doctor_questions
  ADD CONSTRAINT chk_doctor_questions_status
  CHECK (status IN ('pending_review', 'approved', 'answered', 'rejected'));
