# Health Assistant Platform

MVP Sàng lọc Thông minh & Đặt lịch khám bác sĩ: **Next.js** (frontend) + **NestJS** (backend) + **Python/FastAPI/LangChain** (AI Service) + **PostgreSQL** + **JWT**.

## Cấu trúc thư mục

```
health-assistant-platform/
├── ai service/       # Python FastAPI + LangChain AI Agent
├── backend/          # NestJS API
├── docker-compose.yml # PostgreSQL (dev) — tùy chọn
├── docs/             # Tài liệu (changelog, …)
├── frontend/         # Next.js app
└── backend/database/ # SQL schema PostgreSQL
```

## 1. Database (PostgreSQL)

### Cách nhanh: Docker (khuyến nghị cho dev)

Yêu cầu: [Docker](https://docs.docker.com/get-docker/) + Docker Compose.

Từ **thư mục gốc** repo:

```bash
docker compose up -d
```

- Container: `health-assistant-db`, port **5432**, user/password/database khớp mặc định trong `backend/.env.example`.
- Lần **đầu** tạo volume, file `backend/database/schema.sql` được chạy tự động (bảng + dữ liệu seed trong schema).

Dừng / xoá (giữ dữ liệu trong volume):

```bash
docker compose down
```

Nếu port 5432 đã bị chiếm (PostgreSQL cài sẵn trên máy), sửa trong `docker-compose.yml` thành `"5433:5432"` và trong `backend/.env` đặt `DB_PORT=5433`.

### Cài PostgreSQL trên máy (không dùng Docker)

- Tạo database: `createdb health_assistant`
- Chạy schema (đúng thứ tự bảng):

```bash
cd backend
psql -U postgres -d health_assistant -f database/schema.sql
```

Hoặc dùng GUI (pgAdmin, DBeaver) mở file `backend/database/schema.sql` và chạy toàn bộ.

## 2. Backend (NestJS)

```bash
cd backend
cp .env.example .env
# Sửa .env: DB_*, JWT_SECRET, FRONTEND_URL
npm install
npm run start:dev
```

- API chạy tại: **http://localhost:4000**
- Auth: `POST /auth/register`, `POST /auth/login` (trả về JWT)
- Cần token: `GET /users/me` (header: `Authorization: Bearer <token>`)

## 3. Frontend (Next.js)

```bash
cd frontend
cp .env.example .env.local
# Sửa .env.local: NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev
```

- App chạy tại: **http://localhost:3001**

## 4. AI Service (Python / FastAPI / LangChain)

Dịch vụ lõi AI chịu trách nhiệm sàng lọc bệnh lý sơ bộ, giao tiếp tự nhiên với bệnh nhân và gợi ý chuyên khoa cần khám.

```bash
cd "ai service"
# Cài đặt thư viện (nếu dùng uv thì uv add ...)
pip install fastapi uvicorn langchain ...
# Khởi chạy server
uvicorn src.main:app --reload
```

- API AI dự kiến chạy tại: **http://localhost:8000**
- Module: Diagnotic Agent, RAG. (Xem chi tiết thêm ở file `ai service/README.md`)

## Bảng database (MVP)

| # | Bảng | Mô tả |
|---|------|--------|
| 1 | users | Tài khoản gốc |
| 2 | roles | patient, doctor, admin |
| 3 | user_roles | Gán role cho user |
| 4 | patient_profiles | Hồ sơ bệnh nhân |
| 5 | doctor_profiles | Hồ sơ bác sĩ |
| 6 | specialties | Chuyên khoa |
| 7 | doctor_specialties | Bác sĩ – chuyên khoa |
| 8 | medical_profiles | Hồ sơ y tế bệnh nhân |
| 9 | chronic_conditions | Bệnh nền |
| 10 | patient_chronic_conditions | Bệnh nhân – bệnh nền |
| 11 | doctor_available_slots | Slot trống bác sĩ |
| 12 | bookings | Đặt lịch |
| 13 | booking_status_logs | Lịch sử trạng thái booking |
| 14 | posts | Bài viết blog |
| 15 | comments | Bình luận |

## JWT

- Đăng ký: `POST /auth/register` body `{ "email", "password", "fullName", "role": "patient" | "doctor" }`
- Đăng nhập: `POST /auth/login` body `{ "email", "password" }`
- Response có `access_token`; gửi kèm header: `Authorization: Bearer <access_token>` cho các route cần đăng nhập.