# Changelog

## 2026-04-06

- Thêm `docker-compose.yml` ở root: PostgreSQL 16, volume dữ liệu, tự chạy `backend/database/schema.sql` khi khởi tạo volume lần đầu. Cập nhật `README.md` hướng dẫn chạy DB bằng Docker.

## 2026-04-17

- Thêm đăng nhập Google (OAuth) theo hướng mở rộng: bảng `user_identities` lưu `provider` + `provider_sub`, backend thêm `/auth/google` + `/auth/google/callback` set cookie JWT, frontend thêm trang callback `/oauth/google` để hydrate session.
- Sửa cấu hình JWT: `JwtModule.registerAsync` + `JwtStrategy` dùng `ConfigService` để ký và verify dùng cùng `JWT_SECRET` (tránh 401 sau OAuth khi cookie đã có).
- Thêm upload avatar user qua Cloudinary: `POST /users/me/avatar`, lưu `avatar_url` + `avatar_public_id`, UI trang hồ sơ bệnh nhân cho phép đổi ảnh.
- Nâng cấp trang hồ sơ bệnh nhân: chia mục (cơ bản/liên hệ/khẩn cấp/y tế) và `PATCH /users/me` để cập nhật dữ liệu + trả user mới.
- Thêm mục Bảo mật: `PATCH /users/me/password` đổi mật khẩu; UI đổi mật khẩu trên trang hồ sơ (toast báo thành công/thất bại).
- Thêm menu + trang `Bảo mật` cho bệnh nhân: `/patient/security`.
