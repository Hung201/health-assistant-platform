CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_doctor_profiles_workplace_search
ON doctor_profiles
USING gin (
  unaccent(lower(coalesce(workplace_name, '') || ' ' || coalesce(workplace_address, ''))) gin_trgm_ops
);
