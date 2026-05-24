-- Ngày thanh toán thành công (dùng cho thống kê doanh thu).
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

UPDATE bookings
SET paid_at = updated_at
WHERE payment_status = 'paid' AND paid_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_paid_at ON bookings (paid_at)
  WHERE paid_at IS NOT NULL;
