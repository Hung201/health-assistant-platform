-- Normalize doctor_specialties so each doctor has exactly one primary specialty,
-- then enforce uniqueness to prevent future data drift.

WITH ranked AS (
  SELECT
    doctor_user_id,
    specialty_id,
    ROW_NUMBER() OVER (
      PARTITION BY doctor_user_id
      ORDER BY
        CASE WHEN is_primary THEN 0 ELSE 1 END,
        created_at ASC,
        specialty_id ASC
    ) AS rn
  FROM doctor_specialties
)
UPDATE doctor_specialties ds
SET is_primary = (ranked.rn = 1)
FROM ranked
WHERE ds.doctor_user_id = ranked.doctor_user_id
  AND ds.specialty_id = ranked.specialty_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_doctor_specialties_one_primary_per_doctor
  ON doctor_specialties(doctor_user_id)
  WHERE is_primary = TRUE;
