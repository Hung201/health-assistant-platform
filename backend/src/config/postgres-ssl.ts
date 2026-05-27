/** Neon và Postgres managed thường bắt buộc SSL. */
export function shouldUsePostgresSsl(): boolean {
  return (
    process.env.DB_SSL === 'true' ||
    (process.env.DB_HOST ?? '').includes('neon.tech')
  );
}

export function getPostgresSslOption():
  | { rejectUnauthorized: false }
  | undefined {
  return shouldUsePostgresSsl() ? { rejectUnauthorized: false } : undefined;
}
