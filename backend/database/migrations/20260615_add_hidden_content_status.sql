-- Cho phép ẩn bài viết và câu hỏi khỏi trang công khai
ALTER TABLE doctor_questions
  DROP CONSTRAINT IF EXISTS chk_doctor_questions_status;

ALTER TABLE doctor_questions
  ADD CONSTRAINT chk_doctor_questions_status
  CHECK (status IN ('pending_review', 'approved', 'answered', 'rejected', 'hidden'));
