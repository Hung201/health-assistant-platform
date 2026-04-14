'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { bookingsApi, doctorsApi } from '@/lib/api';

export default function PatientDoctorDetailPage() {
  const router = useRouter();
  const params = useParams<{ doctorUserId: string }>();
  const doctorUserId = params.doctorUserId;

  const [patientNote, setPatientNote] = useState('');

  const { data: doctor, isLoading: isLoadingDoctor, isError: isDoctorError, error: doctorError } = useQuery({
    queryKey: ['public', 'doctor', doctorUserId],
    queryFn: () => doctorsApi.detail(doctorUserId),
    staleTime: 30_000,
  });

  const primarySpecId = useMemo(() => {
    const s = doctor?.specialties?.find((x) => x.isPrimary) ?? doctor?.specialties?.[0];
    return s?.id;
  }, [doctor]);

  const { data: slots, isLoading: isLoadingSlots } = useQuery({
    queryKey: ['public', 'doctorSlots', doctorUserId],
    queryFn: () => doctorsApi.slots(doctorUserId, { specialtyId: primarySpecId }),
    enabled: Boolean(primarySpecId),
    staleTime: 10_000,
  });

  const createBooking = useMutation({
    mutationFn: (availableSlotId: number) =>
      bookingsApi.create({
        availableSlotId,
        specialtyId: primarySpecId,
        patientNote: patientNote.trim() || undefined,
      }),
    onSuccess: () => {
      router.push('/patient/bookings');
      router.refresh();
    },
  });

  if (isDoctorError) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(doctorError as Error).message}
        </div>
        <Link className="text-sm font-semibold text-primary hover:underline" href="/patient/doctors">
          ← Quay lại danh sách bác sĩ
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isLoadingDoctor ? '…' : doctor?.fullName ?? 'Bác sĩ'}
          </h2>
          <p className="text-sm text-slate-500">
            {doctor?.professionalTitle ?? 'Bác sĩ'}
            {doctor?.workplaceName ? ` • ${doctor.workplaceName}` : ''}
          </p>
        </div>
        <Link className="text-sm font-semibold text-primary hover:underline" href="/patient/doctors">
          ← Danh sách bác sĩ
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Chuyên khoa</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(doctor?.specialties ?? []).map((s) => (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  s.isPrimary ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'
                }`}
                key={s.id}
              >
                {s.name}
              </span>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Kinh nghiệm</p>
              <p className="mt-1 font-semibold text-slate-900">
                {doctor?.yearsOfExperience != null ? `${doctor.yearsOfExperience} năm` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">CCHN</p>
              <p className="mt-1 font-semibold text-slate-900">{doctor?.licenseNumber ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Phí khám</p>
              <p className="mt-1 font-semibold text-slate-900">
                {doctor?.consultationFee ? `${Number(doctor.consultationFee).toLocaleString()}₫` : '—'}
              </p>
            </div>
          </div>

          {doctor?.bio ? (
            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Giới thiệu</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{doctor.bio}</p>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Đặt lịch</h3>
          <p className="mt-1 text-sm text-slate-500">Chọn 1 slot trống để đặt lịch.</p>

          <label className="mt-4 mb-2 block text-sm font-semibold text-slate-800" htmlFor="note">
            Ghi chú (tuỳ chọn)
          </label>
          <textarea
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
            id="note"
            onChange={(e) => setPatientNote(e.target.value)}
            placeholder="Triệu chứng, mong muốn tư vấn…"
            rows={3}
            value={patientNote}
          />

          {createBooking.isError ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {(createBooking.error as Error).message}
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            {isLoadingSlots ? (
              <>
                <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
              </>
            ) : slots && slots.length > 0 ? (
              slots.slice(0, 8).map((s) => (
                <button
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={createBooking.isPending}
                  key={s.id}
                  onClick={() => createBooking.mutate(s.id)}
                  type="button"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {new Date(s.startAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit' })}{' '}
                      {new Date(s.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-slate-500">
                      Còn {Math.max(0, s.maxBookings - s.bookedCount)} / {s.maxBookings} lượt
                    </p>
                  </div>
                  <span className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">
                    {createBooking.isPending ? 'Đang đặt…' : 'Đặt'}
                  </span>
                </button>
              ))
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Không có slot trống.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

