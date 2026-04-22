'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

import { bookingsApi, doctorsApi } from '@/lib/api';

function GuestBookingPage() {
  const searchParams = useSearchParams();
  const initialDoctor = searchParams.get('bacSi');

  const [doctorUserId, setDoctorUserId] = useState<string>(initialDoctor || '');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [guestFullName, setGuestFullName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [patientNote, setPatientNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'pay_at_clinic'>('momo');
  const [tokenShown, setTokenShown] = useState<string | null>(null);

  const { data: doctorsPage } = useQuery({
    queryKey: ['public', 'doctors', 'guest-booking', 1],
    queryFn: () => doctorsApi.list({ page: 1, limit: 50 }),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (doctorUserId || !doctorsPage?.items?.length) return;
    setDoctorUserId(doctorsPage.items[0].userId);
  }, [doctorsPage, doctorUserId]);

  const { data: doctor } = useQuery({
    queryKey: ['public', 'doctor', doctorUserId],
    queryFn: () => doctorsApi.detail(doctorUserId),
    enabled: Boolean(doctorUserId),
    staleTime: 30_000,
  });

  const doctorSpecialtyId = doctor?.specialties?.[0]?.id;

  const { data: slots } = useQuery({
    queryKey: ['public', 'doctorSlots', doctorUserId],
    queryFn: () => doctorsApi.slots(doctorUserId),
    enabled: Boolean(doctorUserId),
    staleTime: 10_000,
  });

  const slotsByDate = useMemo(() => {
    if (!slots) return {} as Record<string, typeof slots>;
    const grouped: Record<string, typeof slots> = {};
    for (const s of slots) {
      if (!grouped[s.slotDate]) grouped[s.slotDate] = [];
      grouped[s.slotDate].push(s);
    }
    return grouped;
  }, [slots]);

  const availableDates = Object.keys(slotsByDate).sort();

  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) setSelectedDate(availableDates[0]);
  }, [availableDates, selectedDate]);

  useEffect(() => {
    setSelectedSlotId(null);
  }, [selectedDate]);

  const activeSlots = selectedDate ? slotsByDate[selectedDate] ?? [] : [];

  const guestMutation = useMutation({
    mutationFn: () => {
      if (selectedSlotId == null) throw new Error('Chọn khung giờ');
      return bookingsApi.createGuest({
        availableSlotId: selectedSlotId,
        specialtyId: doctorSpecialtyId,
        patientNote: patientNote.trim() || undefined,
        guestFullName: guestFullName.trim(),
        guestPhone: guestPhone.trim(),
        guestEmail: guestEmail.trim(),
        paymentMethod,
      });
    },
    onSuccess: (res) => {
      setTokenShown(res.guestLookupToken);
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/" className="text-sm font-semibold text-[#003f87] hover:underline">
        ← Về trang chủ
      </Link>
      <h1 className="mt-6 text-3xl font-extrabold text-slate-900">Đặt lịch không cần đăng nhập</h1>
      <p className="mt-2 text-sm text-slate-600">
        Điền thông tin và chọn bác sĩ. Sau khi bác sĩ duyệt, bạn sẽ nhận email xác nhận và (nếu chọn MoMo) mã QR thanh toán.
      </p>

      {tokenShown ? (
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-900">
          <p className="font-bold">Đã gửi yêu cầu đặt lịch.</p>
          <p className="mt-2">
            Mã tra cứu (lưu lại): <code className="rounded bg-white px-2 py-1 text-xs">{tokenShown}</code>
          </p>
          <p className="mt-2 text-xs opacity-90">
            Khi bác sĩ duyệt, hệ thống gửi mail tới {guestEmail}. Vui lòng kiểm tra hộp thư / spam.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <label className="text-xs font-bold uppercase text-slate-500">Chọn bác sĩ</label>
            <select
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={doctorUserId}
              onChange={(e) => setDoctorUserId(e.target.value)}
            >
              <option value="">—</option>
              {(doctorsPage?.items ?? []).map((d) => (
                <option key={d.userId} value={d.userId}>
                  {d.fullName}
                </option>
              ))}
            </select>
          </div>

          {doctorUserId && doctor ? (
            <>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Ngày khám</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {availableDates.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDate(d)}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                        selectedDate === d ? 'bg-[#003f87] text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Giờ</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {activeSlots.map((s) => {
                    const full = s.bookedCount >= s.maxBookings;
                    const t = new Date(s.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                    return (
                      <button
                        key={s.id}
                        type="button"
                        disabled={full}
                        onClick={() => setSelectedSlotId(s.id)}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                          selectedSlotId === s.id ? 'bg-teal-600 text-white' : full ? 'bg-slate-100 text-slate-400' : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold uppercase text-slate-500">Họ tên</label>
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={guestFullName}
                onChange={(e) => setGuestFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-500">Điện thoại</label>
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-500">Email (nhận QR / xác nhận)</label>
              <input
                type="email"
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-500">Ghi chú (tuỳ chọn)</label>
            <textarea
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              rows={3}
              value={patientNote}
              onChange={(e) => setPatientNote(e.target.value)}
            />
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase text-slate-500">Thanh toán</p>
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input type="radio" checked={paymentMethod === 'momo'} onChange={() => setPaymentMethod('momo')} />
              MoMo (email kèm QR sau khi bác sĩ duyệt)
            </label>
            <label className="mt-1 flex items-center gap-2 text-sm">
              <input type="radio" checked={paymentMethod === 'pay_at_clinic'} onChange={() => setPaymentMethod('pay_at_clinic')} />
              Tại viện
            </label>
          </div>

          {guestMutation.isError ? (
            <p className="text-sm text-red-600">{(guestMutation.error as Error).message}</p>
          ) : null}

          <button
            type="button"
            disabled={guestMutation.isPending || !doctorUserId || selectedSlotId == null}
            onClick={() => guestMutation.mutate()}
            className="w-full rounded-2xl bg-[#003f87] py-3 text-sm font-bold text-white disabled:bg-slate-300"
          >
            {guestMutation.isPending ? 'Đang gửi…' : 'Gửi yêu cầu đặt lịch'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function DatLichPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-12 text-center text-slate-500">Đang tải…</div>
      }
    >
      <GuestBookingPage />
    </Suspense>
  );
}
