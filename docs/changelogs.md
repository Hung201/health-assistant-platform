# Changelog

## 2026-04-06

- Thêm `docker-compose.yml` ở root: PostgreSQL 16, volume dữ liệu, tự chạy `backend/database/schema.sql` khi khởi tạo volume lần đầu. Cập nhật `README.md` hướng dẫn chạy DB bằng Docker.

## 2026-04-17

- Thêm đăng nhập Google (OAuth) theo hướng mở rộng: bảng `user_identities` lưu `provider` + `provider_sub`, backend thêm `/auth/google` + `/auth/google/callback` set cookie JWT, frontend thêm trang callback `/oauth/google` để hydrate session.
- Sửa cấu hình JWT: `JwtModule.registerAsync` + `JwtStrategy` dùng `ConfigService` để ký và verify dùng cùng `JWT_SECRET` (tránh 401 sau OAuth khi cookie đã có).
