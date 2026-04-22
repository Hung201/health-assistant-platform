# Current Project State

Ghi chu nay phan anh hien trang sau khi pull `origin/main` toi commit `9529133`.

Du an hien la MVP cho nen tang ho tro suc khoe gom 3 phan chinh:

- `frontend`: Next.js app cho marketing/public pages, patient, doctor va admin.
- `backend`: NestJS API, TypeORM, PostgreSQL, JWT/cookie auth.
- `ai service`: Python FastAPI, LangChain, Gemini, ChromaDB RAG cho AI symptom checker.

Docker hien co 1 service PostgreSQL:

- Container: `health-assistant-db`
- Image: `postgres:16-alpine`
- Port: `5432:5432`
- Database: `health_assistant`
- Init schema: `backend/database/schema.sql`

## Recent Pull Changes

Pull moi tu GitHub tich hop nhieu tinh nang lon (payment, livestream, hoi dap, map) va nang cap toan dien giao dien.

Cac tinh nang moi dang chu y:

- **Thanh toan MoMo (MoMo Payment)**: Tich hop MoMo IPN, version 1 va 2 cho viec thanh toan truc tuyen.
- **Livestream cho Bac si**: Bac si co the tao va quan ly phong live studio, admin co the quan ly quyen livestream.
- **Hoi Dap Mien Phi (Q&A)**: Nguoi dung dat cau hoi mien phi, bac si co giao dien tra loi, admin kiem duyet cau hoi.
- **Ban Do & Loc Dia Chi**: Tich hop ban do va tinh nang loc theo dia chi cho danh sach bac si.
- **Thong Bao (Notifications)**: He thong thong bao in-app cho cac su kien.
- **Thong ke & Cai dat (Stats & Settings)**: Them trang dashboard thong ke va cai dat rieng cho Admin va Doctor.
- **Responsive & UI**: Nang cap giao dien Responsive cho tat ca cac portal, kem theo Module Blog, Header.
- **AI Chat Service & Recommendation**: Tích hợp AI chat thông minh, tự động phân tích triệu chứng và **gợi ý bác sĩ nội bộ** dựa trên chuyên khoa và lịch trống. Hỗ trợ xem lại **Lịch sử phiên hỏi** và tạo **Phiên mới**.

File/Folder moi dang chu y:

- `backend/src/momo/`: Module thanh toan MoMo.
- `backend/src/lives/`: Module quan ly livestream.
- `backend/src/questions/`: Module hoi dap mien phi.
- `backend/src/notifications/`: Module thong bao.
- `backend/src/entities/chat-session.entity.ts`: Entity lưu phiên chat.
- `backend/src/entities/chat-message.entity.ts`: Entity lưu tin nhắn.
- `frontend/src/app/(patient)/patient/ai-assistant/`
- `frontend/src/app/(marketing)/dat-lich/`
- `frontend/src/app/(marketing)/hoi-bac-si-mien-phi/`
- `frontend/src/app/(marketing)/live/[streamId]/`
- `frontend/src/app/(doctor)/doctor/live/`
- `frontend/src/app/(doctor)/doctor/qa/`
- `frontend/src/app/(admin)/admin/lives/`
- `frontend/src/app/(admin)/admin/questions/`

## Frontend

Frontend nam trong `frontend`.

Cong nghe/dang dung:

- Next.js App Router.
- TanStack Query cho server state o nhieu page.
- Zustand cho auth/chat state.
- Tailwind/shadcn-style UI components.
- Next rewrite `/api/:path*` sang backend `http://localhost:4000/:path*`.
- Lucide icons va Material Symbols.

Public/marketing routes hien co:

- `/`: landing page.
- `/ai`: public AI marketing/demo page.
- `/doctors`: public doctor directory.
- `/doctors/[id]`: public doctor detail.
- `/blog`: public blog list.
- `/blog/[slug]`: public blog detail.
- `/hoi-bac-si-mien-phi`: public trang dat cau hoi va xem hoi dap.
- `/cam-nang-hoi-dap`: public trang cam nang.
- `/dat-lich`: public trang huong dan dat lich.
- `/live/[streamId]`: public trang xem livestream cua bac si.
- `/login`, `/register`, `/register/verify`, `/oauth/google`: auth pages.

Portal routes hien co:

- `/patient`: patient dashboard.
- `/patient/ai-assistant`: AI assistant trong patient app.
- `/patient/doctors`: danh sach bac si de dat lich.
- `/patient/doctors/[doctorUserId]`: chi tiet bac si + chon slot + tao booking.
- `/patient/bookings`: danh sach booking cua patient + detail/cancel modal.
- `/patient/profile`: patient profile.
- `/patient/security`: doi mat khau/security.
- `/doctor`: doctor dashboard (co them thong ke).
- `/doctor/slots`: quan ly slot.
- `/doctor/bookings`: quan ly booking cua doctor.
- `/doctor/profile`: doctor profile.
- `/doctor/posts`: quan ly post cua doctor.
- `/doctor/live`: quan ly livestream studio cua bac si.
- `/doctor/qa`: tra loi cau hoi cua benh nhan.
- `/doctor/settings`: cai dat rieng cua bac si.
- `/doctor/security`: bao mat.
- `/admin`: admin dashboard (co them thong ke).
- `/admin/users`: quan ly users.
- `/admin/doctors/pending`: duyet doctor.
- `/admin/posts/pending`: duyet posts.
- `/admin/specialties`: quan ly specialties.
- `/admin/questions/pending`: kiem duyet cau hoi cua benh nhan.
- `/admin/lives`: quan ly phien livestream.
- `/admin/settings`: cai dat rieng cua admin.

### Public Marketing Pages

Landing page `frontend/src/app/(marketing)/page.tsx`:

- Hien hero "Clinical Precision".
- Co CTA toi AI.
- Neu user da login, AI link tro toi `/patient/ai-assistant`; neu chua login, tro toi `/ai`.
- Fetch top doctors bang `doctorsApi.list({ limit: 4 })`.
- Fetch top blog posts bang `publicPostsApi.list(1, 3)`.
- Co section specialties dang la static UI list, khong phai data tu DB.

Public AI page `frontend/src/app/(marketing)/ai/page.tsx`:

- La landing/demo AI page cho user chua login.
- Neu co user trong auth store, page auto redirect ve `/patient/ai-assistant`.
- UI chat va ket qua tren page nay la mock/demo, chua goi AI service that.
- Co CTA dang nhap/dang ky de mo phan tich chi tiet.

Public doctors page `frontend/src/app/(marketing)/doctors/page.tsx`:

- Goi `authApi.specialties()` de lay specialties.
- Goi `doctorsApi.list({ specialtyId, limit: 100 })`.
- Filter client-side theo ten va khoang gia.
- Link card toi `/doctors/{doctor.userId}`.

Public doctor detail `frontend/src/app/(marketing)/doctors/[id]/page.tsx`:

- Goi `doctorsApi.detail(params.id)`.
- Hien profile bac si, chuyen khoa, workplace, experience, license, fee.
- Rating va thoi gian lam viec hien la UI static/mock.
- Nut "Dat lich kham" link toi `/patient` neu da login, hoac `/login` neu chua login.
- Page public detail chua hien slots va chua tao booking truc tiep.

Public blog:

- `/blog` fetch `publicPostsApi.list(page, limit)`.
- Co filter category client-side theo `postType`.
- `/blog/[slug]` fetch detail/comment theo API public posts.

### Patient App

Patient shell `frontend/src/app/(patient)/patient-shell.tsx`:

- Sidebar da doi label AI thanh "Tram AI".
- Nav chinh gom Tong quan, Tram AI, Dat lich, Lich hen, Ho so ca nhan, Blog, Bao mat.
- Header co search UI static, notification icon, avatar.

Patient AI assistant `frontend/src/app/(patient)/patient/ai-assistant/page.tsx`:

- Sử dụng `useChatStore` đã được nâng cấp.
- Chat input gọi `sendMessage(text, location)`.
- **Phiên mới**: Nút "Phiên mới" cho phép reset hội thoại và xóa sessionId.
- **Lịch sử phiên hỏi**: Sidebar bên phải hiển thị danh sách các phiên chat thực tế từ Database (lấy từ bảng `chat_sessions`).
- **Xem lại hội thoại**: Click vào phiên cũ sẽ tự động tải lại toàn bộ tin nhắn cũ lên khung chat.
- **Kết quả chẩn đoán**: Hiển thị biểu đồ bệnh lý (%) trả về từ AI.
- **Gợi ý bác sĩ**: Hiển thị danh sách bác sĩ chuyên khoa phù hợp (Real data) kèm nút "Đặt lịch" dẫn tới trang của bác sĩ.
- Page này hiện tại không render `hospitalSuggestion` nữa, ưu tiên gợi ý bác sĩ nội bộ.

Patient doctors list `frontend/src/app/(patient)/patient/doctors/page.tsx`:

- Goi `authApi.specialties()`.
- Goi `doctorsApi.list({ specialtyId, limit: 100 })`.
- Filter client-side theo ten va khoang gia.
- Link card toi `/patient/doctors/{doctor.userId}`.

Patient doctor detail `frontend/src/app/(patient)/patient/doctors/[doctorUserId]/page.tsx`:

- Goi `doctorsApi.detail(doctorUserId)`.
- Lay primary specialty tu detail.
- Goi `doctorsApi.slots(doctorUserId, { specialtyId: primarySpecId })`.
- Group slots theo ngay.
- Cho patient chon ngay, chon slot, nhap note.
- Tao booking bang `bookingsApi.create({ availableSlotId, specialtyId, patientNote })`.
- Sau khi tao booking thanh cong, redirect `/patient/bookings`.
- Co nhieu chi so UI static/mock nhu "2k+ benh nhan", rating `4.9`, fallback experience `15+`.

Patient bookings `frontend/src/app/(patient)/patient/bookings/page.tsx`:

- Goi `bookingsApi.my()`.
- Cho xem detail booking bang `bookingsApi.detail(id)` trong modal.
- Cho huy booking pending bang `bookingsApi.cancel(id, reason)`.
- UI da duoc lam lai thanh modal/detail richer.

### Frontend API Layer

File `frontend/src/lib/api.ts`:

- `API_BASE = '/api'`, di qua Next rewrites toi backend.
- Auth API: login/register/logout/specialties.
- Users API: me, upload avatar, update me, change password.
- Doctors API:
  - `list(params)`
  - `detail(doctorUserId)`
  - `slots(doctorUserId, params)`
- Bookings API:
  - `my()`
  - `detail(id)`
  - `create({ availableSlotId, specialtyId, patientNote })`
  - `cancel(id, reason)`
- Doctor portal API:
  - `mySlots()`
  - `createSlot(...)`
  - `cancelSlot(id)`
  - `myBookings()`
- Posts/comment/admin APIs.

### Chat Store

File `frontend/src/stores/chat.store.ts`:

- Gọi backend proxy `/api/ai/chat`.
- Lưu `messages`, `sessionId`, `sessions` (lịch sử) vào Zustand state.
- Persist `messages` và `sessionId` vào localStorage.
- Action `fetchSessions()`: Lấy danh sách phiên từ Backend.
- Action `loadSession(id)`: Tải tin nhắn của phiên cụ thể.
- Action `resetChat()`: Xóa sạch trạng thái để bắt đầu phiên mới.
- Không gửi `history` từ client; AI service đang quản lý history bằng DB.
- Request di qua backend nen duoc gan user that bang cookie/JWT.
- Backend truyen `user_id` da xac thuc va `patient_context` sang AI service.
- AI service luu `chat_sessions.user_id` va dung `patient_context` de ca nhan hoa hoi dap/chan doan.

Trang thai: Da xu ly.

Da lam:

- Them backend proxy `POST /ai/chat`.
- Frontend chat da doi tu goi thang `http://localhost:8000/api/v1/chat/` sang goi `/api/ai/chat`.
- Backend dung cookie/JWT hien co de lay `currentUser`.
- Backend enrich payload gui sang AI service bang `user_id` va `patient_context`.
- AI service nhan `user_id`, luu vao `chat_sessions.user_id`, va dua `patient_context` vao system message/diagnostic query.

Van de da duoc xu ly truoc do:

- AI chat chua gan user that.
- Frontend dang goi thang AI service thay vi di qua backend.
- AI service khong biet user dang dang nhap la ai va khong co co che tin cay de lay profile benh nhan.
- Neu goi thang AI service, viec truyen `user_id` tu client khong du an toan vi client co the fake user id.

Huong xu ly da ap dung:

- Nen them backend proxy endpoint, vi du `POST /ai/chat`.
- Frontend goi backend bang cookie/JWT hien co.
- Backend lay `currentUser`, patient profile, medical profile, chronic conditions.
- Backend goi AI service voi payload da enrich gom `user_id` va `patient_context`.
- AI service luu `chat_sessions.user_id` bang user id do backend da xac thuc.
- Sau khi AI tra `suggested_specialty`, backend co the tiep tuc goi doctor recommendation noi bo.

## Backend

Backend nam trong `backend`.

Cong nghe/dang dung:

- NestJS.
- TypeORM.
- PostgreSQL.
- JWT auth voi cookie `access_token`.
- Global `JwtAuthGuard`, route public dung decorator `@Public()`.

Module chinh:

- `AuthModule`: register/login/logout/google OAuth/specialties cho form register.
- `UsersModule`: `GET/PATCH /users/me`, avatar, password.
- `DoctorsModule`: public doctors, doctor detail, public slots.
- `BookingsModule`: patient booking, cancel booking, patient/doctor booking list.
- `DoctorPortalModule`: doctor slots/bookings/profile route.
- `PostsModule`: public posts/comments/reactions.
- `AdminModule`: dashboard, users, doctor approval, post approval, specialties.
- `AiModule`: backend proxy `POST /ai/chat`, gan user da xac thuc va enrich patient context truoc khi goi AI service.
- `MomoModule`: thanh toan IPN va API tich hop MoMo.
- `LivesModule`: quan ly livestream va quyen live cho bac si.
- `QuestionsModule`: quan ly hoi dap mien phi.
- `NotificationsModule`: gui va lay thong bao in-app.

Endpoint bac si hien co:

- `GET /doctors`
  - Public.
  - Co filter `specialtyId`.
  - Chi tra bac si `is_verified = true` va `verification_status = approved`.
  - Sort theo `priorityScore DESC`, `createdAt DESC`.
- `GET /doctors/:doctorUserId`
  - Public detail.
- `GET /doctors/:doctorUserId/slots`
  - Public slots.
  - Chi lay slot `available`, `booked_count < max_bookings`, `start_at >= NOW()`.

Booking hien co:

- Patient tao booking tu `availableSlotId`.
- Backend lock pessimistic slot khi tao booking de tranh oversell.
- Booking snapshot ten bac si, ten chuyen khoa, fee.
- Patient chi huy duoc booking `pending` va chua qua gio.

Chua co backend endpoint recommend bac si rieng.

## Database Schema

Schema chinh nam o `backend/database/schema.sql`.

Bang hien co:

- `users`
- `user_identities`
- `roles`
- `user_roles`
- `patient_profiles`
- `doctor_profiles`
- `specialties`
- `doctor_specialties`
- `medical_profiles`
- `chronic_conditions`
- `patient_chronic_conditions`
- `doctor_available_slots`
- `bookings`
- `booking_status_logs`
- `posts`
- `comments`

Bang chat cua AI service nam rieng o:

- `ai service/src/database/chat_schema.sql`

Bang chat gom:

- `chat_sessions`
- `chat_messages`

Trang thai: Da xu ly cho schema chinh va DB Docker hien tai.

Da lam:

- Them `chat_sessions` va `chat_messages` vao `backend/database/schema.sql`.
- Them index `idx_chat_sessions_user_id` va `idx_chat_messages_session_id`.
- Da apply cac bang/index nay vao PostgreSQL Docker dang chay bang `CREATE TABLE IF NOT EXISTS`.

Luu y lich su:

- Truoc do `backend/database/schema.sql` chua include `chat_sessions` va `chat_messages`.
- Neu volume cu da ton tai, Docker khong tu chay lai init script; can apply schema thu cong hoac rebuild volume.
- Docker compose hien chi mount `backend/database/schema.sql` vao `/docker-entrypoint-initdb.d/01-schema.sql`.
- File `ai service/src/database/chat_schema.sql` van ton tai nhu ban schema rieng, nhung schema chinh hien da co phan chat de DB moi khong bi thieu bang.

Huong xu ly da ap dung:

- Cach ngan han: copy/merge phan `chat_sessions` va `chat_messages` vao `backend/database/schema.sql`.
- Cach sach hon: tao folder init DB rieng, vi du `database/init/`, gom `01-schema.sql` va `02-chat-schema.sql`, sau do mount ca folder vao Docker.
- Neu ve sau dung migration, dua chat schema vao migration chinh thay vi SQL init thu cong.
- Can dam bao `chat_sessions.user_id` reference duoc `users(id)` va `uuid-ossp` da duoc enable truoc khi tao bang chat.

## Data Trong Docker DB

Lan kiem tra gan nhat truoc pull, DB co:

- `users`: 32
- `doctor_profiles`: 30
- `specialties`: 5
- `doctor_specialties`: 22
- `doctor_available_slots`: 44
- `bookings`: 1

Chuyen khoa hien co:

- `Noi tong quat`: 4 bac si
- `Tim mach`: 4 bac si
- `Nhi khoa`: 4 bac si
- `Ngoai khoa`: 4 bac si
- `Da lieu`: 6 bac si

Tinh trang doctor data:

- Co nhieu bac si demo da duyet.
- Co mot so bac si pending cho luong admin review.
- `priority_score` cua cac bac si dang la `0`.
- `doctor_profiles` co workplace name, fee, years of experience, verification status.
- Chua co dia chi phong kham chi tiet, tinh/thanh, quan/huyen, latitude/longitude.
- Chua co rating/review that, so luot kham thanh cong, ti le huy, response time.
- UI moi co hien rating/benh nhan/thoi gian lam viec, nhung mot phan dang la static/mock.

Tinh trang slots da kiem tra:

- Co 44 slot status `available`.
- Tat ca slot da nam trong qua khu so voi ngay hien tai cua moi truong.
- Slot range:
  - Min: `2026-04-15 02:00:00+00`
  - Max: `2026-04-17 03:00:00+00`
  - Future slot count: `0`

He qua:

- Co the list/recommend bac si theo chuyen khoa/profile.
- Chua the recommend "dat lich ngay" neu bat buoc co slot tuong lai.
- Patient doctor detail se hien "bac si hien chua co lich kham trong" neu khong co slot tuong lai.

## AI Service

AI service nam trong `ai service`.

Cong nghe/dang dung:

- FastAPI.
- LangChain.
- Gemini qua `langchain_google_genai`.
- ChromaDB local trong `ai service/models/chroma_db`.
- Embedding model config: `dangvantuan/vietnamese-embedding`.
- Optional Tavily web search fallback.

Endpoint chinh:

- `GET /api/v1/health`
- `POST /api/v1/diagnostic/analyze`
- `POST /api/v1/chat/`

Diagnostic flow:

- Input: symptoms va optional patient context.
- Lay context tu ChromaDB.
- Goi Gemini de phan tich.
- Tra `DiagnosticResult` gom:
  - `top_diseases`
  - `disease`
  - `match_score`
  - `reasoning`
  - `suggested_specialty`
  - `emergency_warning`
  - `general_advice`
  - web search metadata neu dung fallback.

Chat flow:

- Luu session/message vao `chat_sessions` va `chat_messages`.
- Dung LLM de hoi them 2-3 cau lam ro trieu chung.
- Neu LLM tra keyword `READY_TO_DIAGNOSE`, service goi `DiagnosticAgent.analyze(...)`.
- Neu co location va confidence du nguong, service dung `HospitalSearchTool` de goi Nominatim/Overpass tim benh vien/phong kham ben ngoai.

Hospital suggestion hien co trong API/store:

- La goi y co so y te tu OSM, khong phai bac si noi bo trong DB.
- Loc OSM theo `specialty_hint`.
- `chat.store.ts` van nhan `hospital_suggestion`.
- UI patient AI moi hien tai khong render sidebar hospital suggestion nua.

## Recommend Bac Si Noi Bo

Hien tai chua co doctor recommendation dung DB noi bo trong phan AI.

Da co nhung man hinh lien quan bac si:

- Public `/doctors`: directory bac si.
- Public `/doctors/[id]`: doctor profile public, CTA login/patient.
- Patient `/patient/doctors`: directory bac si trong app.
- Patient `/patient/doctors/[doctorUserId]`: doctor detail + slots + booking.
- Patient AI `/patient/ai-assistant`: co nut UI "Tim bac si chuyen khoa phu hop" nhung chua gan action.

Du lieu hien co co the dung cho recommend:

- `doctor_profiles`
- `users`
- `specialties`
- `doctor_specialties`
- `doctor_available_slots`
- `bookings`

Dieu kien nen dung cho bac si hop le:

- User active.
- Doctor da verify.
- `verification_status = approved`.
- `is_available_for_booking = true`.
- Chuyen khoa active.

Tieu chi recommend kha thi voi data hien tai:

- Khop chuyen khoa voi `suggested_specialty`.
- Bac si co slot tuong lai hay khong.
- So nam kinh nghiem.
- Phi tu van.
- `priority_score`.
- Do day du profile: bio, workplace, license, avatar.

Nhung thu chua du cho recommend tot:

- Mapping tu chuyen khoa AI sang `specialties.id`.
- Dia chi/toa do bac si.
- Rating/review that.
- Luot kham thanh cong that.
- Lich trong tuong lai.
- Chuyen khoa day du hon 5 specialty hien co.

## Huong Tich Hop Recommend Sau Khi Crawl Doctor Data

Khi data bac si crawl duoc import vao DB, nen de backend so huu logic recommend.

Flow de xuat:

1. Frontend gui chat/symptoms.
2. AI service phan tich va tra `suggested_specialty`.
3. Backend map `suggested_specialty` sang `specialties.id`.
4. Backend query DB de lay bac si noi bo phu hop.
5. Backend tinh score va sap xep.
6. Frontend hien thi doctor cards va CTA dat lich.

Ly do backend nen lam recommend:

- Backend la source of truth cua doctor/slot/booking.
- Tranh LLM hallucinate ten bac si.
- De filter verified/approved/available.
- De bao ve auth, patient data va booking rules.
- De unit test scoring ro rang.

Endpoint co the them:

- `POST /doctors/recommendations`
- Hoac backend proxy AI: `POST /ai/chat`, response gom ca diagnostic result va doctor recommendations.

Response nen co:

- Specialty da match.
- Danh sach bac si.
- Score.
- Ly do recommend.
- Slot gan nhat neu co.
- Fallback reason neu khong tim thay bac si.

## Viec Can Lam Gan

- Tao mapping specialty alias giua ket qua AI va DB specialties.
- Them endpoint backend recommend doctors.
- Gan nut "Tim bac si chuyen khoa phu hop" tren patient AI voi recommendation/search flow.
- Cap nhat seed slot de co slot tuong lai trong moi lan demo/dev.
- Tach ro UI static/mock voi data that trong public AI/patient AI/doctor detail.
- Khi import doctor crawl data, bo sung them cac field phuc vu recommend:
  - Dia chi lam viec.
  - Tinh/thanh, quan/huyen.
  - Latitude/longitude neu co.
  - Chuyen khoa chuan hoa.
  - Hoc ham/hoc vi/chuc danh.
  - Nam kinh nghiem.
  - Gia kham.
  - Link nguon crawl.
  - Co so lam viec.
  - Lich kham neu crawl duoc.
  - Rating/review neu co va hop le ve phap ly/nguon.
