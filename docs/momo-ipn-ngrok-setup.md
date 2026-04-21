# Huong dan setup MoMo IPN tren may moi (ngrok)

Tai lieu nay huong dan chi tiet cach cau hinh `MOMO_IPN_URL` de webhook MoMo goi duoc vao backend local khi chay tren may khac.

## 1) Muc tieu

Sau khi setup xong:
- Backend local nhan duoc callback `POST /payments/momo/ipn` tu MoMo UAT.
- Trang thai thanh toan duoc cap nhat trong DB/UI (vi du: `awaiting_gateway -> paid`).
- Team co the lap lai nhanh tren bat ky may nao.

## 2) Dieu kien tien quyet

- Da clone project va chay duoc backend NestJS.
- Co thong tin MoMo UAT:
  - `MOMO_PARTNER_CODE`
  - `MOMO_ACCESS_KEY`
  - `MOMO_SECRET_KEY`
- Co tai khoan ngrok.
- May duoc phep truy cap internet.

## 3) Cai dat ngrok tren Windows

### Cach 1: dung winget

```powershell
winget install --id Ngrok.Ngrok -e
```

### Cach 2: tai tay

1. Truy cap https://ngrok.com/download
2. Tai ban Windows.
3. Giai nen va mo terminal tai thu muc chua `ngrok.exe`.

## 4) Dang nhap ngrok va add authtoken

1. Dang ky/dang nhap: https://dashboard.ngrok.com
2. Copy token tai muc **Your Authtoken**.
3. Chay lenh (chi can 1 lan cho moi may):

```powershell
ngrok config add-authtoken YOUR_AUTHTOKEN
```

Neu thanh cong, ngrok se luu token vao cau hinh local.

## 5) Chay backend local

Trong thu muc `backend`:

```powershell
npm install
npm run start:dev
```

Mac dinh backend chay o port `3000` (kiem tra log de xac nhan).

## 6) Tao public URL cho backend bang ngrok

Mo terminal moi va chay:

```powershell
ngrok http 3000
```

Ban se thay URL public HTTPS, vi du:
- `https://abc-123.ngrok-free.app`
- hoac `https://abc-123.ngrok-free.dev`

Lay URL nay de tao IPN:

```env
MOMO_IPN_URL=https://abc-123.ngrok-free.app/payments/momo/ipn
```

## 7) Cau hinh `.env` backend

Trong `backend/.env`, dam bao toi thieu co:

```env
MOMO_PARTNER_CODE=...
MOMO_ACCESS_KEY=...
MOMO_SECRET_KEY=...
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_REDIRECT_URL=http://localhost:3001/patient/bookings
MOMO_IPN_URL=https://abc-123.ngrok-free.app/payments/momo/ipn
```

Sau khi doi `.env`, **restart backend**.

## 8) Quy trinh test dung (quan trong)

De IPN chay dung URL moi, luon test theo thu tu:

1. Benh nhan tao booking.
2. Bac si duyet booking.
3. He thong tao payment request voi `MOMO_IPN_URL` hien tai.
4. MoMo goi callback vao `/payments/momo/ipn`.

> Luu y: booking/payment tao truoc khi doi `MOMO_IPN_URL` co the van gan URL cu.

## 9) Kiem tra nhanh IPN da vao backend chua

- Xem log backend co hit endpoint `/payments/momo/ipn`.
- Kiem tra DB:
  - `bookings.payment_status`
  - ban ghi trong bang `payments`
- Kiem tra UI benh nhan/bac si co doi trang thai thanh toan.

## 10) Cac loi thuong gap va cach xu ly

### Loi: thanh toan thanh cong nhung DB van `awaiting_gateway`

Nguyen nhan thuong gap:
- `MOMO_IPN_URL` dang tro sai URL/ngrok da het han.
- Backend chua restart sau khi sua env.
- Firewall/proxy chan ket noi.

Cach xu ly:
1. Chay lai `ngrok http 3000`.
2. Cap nhat lai `MOMO_IPN_URL`.
3. Restart backend.
4. Tao giao dich moi de test lai.

### Loi: ngrok URL bi doi lien tuc

Voi goi free, URL co the doi khi restart ngrok.
Giai phap:
- Moi lan doi URL thi cap nhat `MOMO_IPN_URL` + restart backend.
- Can URL on dinh thi dung goi co custom/static domain hoac deploy backend public.

### Loi: endpoint IPN tra 4xx/5xx

Kiem tra:
- Route dung: `/payments/momo/ipn`
- Chu ky signature dung theo payload
- Body callback co day du truong
- Logger trong `payments` service

## 11) Checklist cho teammate (copy nhanh)

- [ ] Clone code, cai dependencies backend
- [ ] Co bo key MoMo UAT
- [ ] Cai ngrok + add authtoken
- [ ] Chay backend local (port 3000)
- [ ] Chay `ngrok http 3000`
- [ ] Doi `MOMO_IPN_URL` trong `backend/.env`
- [ ] Restart backend
- [ ] Tao booking moi -> duyet -> thanh toan -> kiem tra trang thai

## 12) Bao mat

- Khong commit file `.env` len git.
- Khong chia se `MOMO_SECRET_KEY` qua kenh public.
- Neu nghi lo key, tao key moi tren MoMo UAT.

