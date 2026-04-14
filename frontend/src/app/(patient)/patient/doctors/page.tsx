'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import Link from 'next/link';

import { authApi, bookingsApi, doctorsApi, type PublicDoctorCard } from '@/lib/api';

export default function PatientFindDoctorsPage() {
  const [specialtyId, setSpecialtyId] = useState<number | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<PublicDoctorCard | null>(null);
  const [patientNote, setPatientNote] = useState('');

  const { data: specialties, isLoading: isLoadingSpecialties } = useQuery({
    queryKey: ['public', 'specialties'],
    queryFn: authApi.specialties,
    staleTime: 60_000,
  });

  const { data: doctors, isLoading: isLoadingDoctors, isError: isDoctorsError, error: doctorsError } = useQuery({
    queryKey: ['public', 'doctors', { specialtyId }],
    queryFn: () => doctorsApi.list({ specialtyId: specialtyId ?? undefined }),
    staleTime: 30_000,
  });

  const { data: slots, isLoading: isLoadingSlots } = useQuery({
    queryKey: ['public', 'doctorSlots', selectedDoctor?.userId, { specialtyId }],
    queryFn: () =>
      selectedDoctor
        ? doctorsApi.slots(selectedDoctor.userId, { specialtyId: specialtyId ?? undefined })
        : Promise.resolve([]),
    enabled: Boolean(selectedDoctor),
    staleTime: 10_000,
  });

  const createBooking = useMutation({
    mutationFn: (availableSlotId: number) =>
      bookingsApi.create({
        availableSlotId,
        specialtyId: specialtyId ?? undefined,
        patientNote: patientNote.trim() || undefined,
      }),
  });

  const activeSpecialtyName = useMemo(() => {
    if (!specialties || specialtyId == null) return null;
    return specialties.find((s) => s.id === specialtyId)?.name ?? null;
  }, [specialties, specialtyId]);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Tìm bác sĩ</h2>
        <p className="text-sm text-slate-500">Chọn chuyên khoa, xem bác sĩ và đặt lịch theo slot trống.</p>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-semibold text-slate-800" htmlFor="specialty">
              Chuyên khoa
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
              id="specialty"
              onChange={(e) => {
                const v = e.target.value ? Number(e.target.value) : null;
                setSpecialtyId(v && !Number.isNaN(v) ? v : null);
                setSelectedDoctor(null);
              }}
              value={specialtyId ?? ''}
            >
              <option value="">Tất cả chuyên khoa</option>
              {isLoadingSpecialties ? <option>Đang tải…</option> : null}
              {specialties?.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-slate-500">
            {activeSpecialtyName ? (
              <span>
                Đang lọc theo: <span className="font-semibold text-slate-700">{activeSpecialtyName}</span>
              </span>
            ) : (
              <span>Hiển thị tất cả bác sĩ đã duyệt</span>
            )}
          </div>
        </div>
      </div>

      {isDoctorsError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(doctorsError as Error).message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Bác sĩ</h3>
            <p className="text-sm text-slate-500">{isLoadingDoctors ? 'Đang tải…' : `${doctors?.length ?? 0} kết quả`}</p>
          </div>

          <div className="space-y-3">
            {isLoadingDoctors ? (
              <>
                <div className="h-[92px] animate-pulse rounded-xl border border-slate-200 bg-white p-4" />
                <div className="h-[92px] animate-pulse rounded-xl border border-slate-200 bg-white p-4" />
                <div className="h-[92px] animate-pulse rounded-xl border border-slate-200 bg-white p-4" />
              </>
            ) : (doctors ?? []).length > 0 ? (
              (doctors ?? []).map((d) => {
                const active = selectedDoctor?.userId === d.userId;
                return (
                  <div
                    className={`w-full rounded-xl border p-4 transition-colors ${
                      active ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                    key={d.userId}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <span className="material-symbols-outlined">stethoscope</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-slate-900">{d.fullName}</p>
                        <p className="mt-0.5 text-sm text-slate-500">
                          {d.professionalTitle ?? 'Bác sĩ'}
                          {d.workplaceName ? ` • ${d.workplaceName}` : ''}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(d.specialties ?? []).slice(0, 3).map((s: PublicDoctorCard['specialties'][number]) => (
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                s.isPrimary ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'
                              }`}
                              key={`${d.userId}-${s.id}`}
                            >
                              {s.name}
                            </span>
                          ))}
                          {d.specialties.length > 3 ? (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                              +{d.specialties.length - 3}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Phí khám</p>
                          <p className="mt-1 font-bold text-slate-900">{Number(d.consultationFee).toLocaleString()}₫</p>
                        </div>
                        <button
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
                          onClick={() => setSelectedDoctor(d)}
                          type="button"
                        >
                          Xem slot
                        </button>
                        <Link
                          className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-primary/90"
                          href={`/patient/doctors/${encodeURIComponent(d.userId)}`}
                        >
                          Chi tiết
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
                Không có bác sĩ phù hợp.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Slot trống</h3>

          {!selectedDoctor ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-600">Chọn 1 bác sĩ để xem slot.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <p className="text-sm text-slate-500">Bác sĩ</p>
                <p className="font-bold text-slate-900">{selectedDoctor.fullName}</p>
              </div>

              <label className="mb-2 block text-sm font-semibold text-slate-800" htmlFor="note">
                Ghi chú cho bác sĩ (tuỳ chọn)
              </label>
              <textarea
                className="mb-4 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
                id="note"
                onChange={(e) => setPatientNote(e.target.value)}
                placeholder="Triệu chứng, mong muốn tư vấn…"
                rows={3}
                value={patientNote}
              />

              {createBooking.isError ? (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {(createBooking.error as Error).message}
                </div>
              ) : null}

              <div className="space-y-3">
                {isLoadingSlots ? (
                  <>
                    <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
                    <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
                  </>
                ) : slots && slots.length > 0 ? (
                  slots.slice(0, 10).map((s) => (
                    <button
                      className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={createBooking.isPending}
                      key={s.id}
                      onClick={() => createBooking.mutate(s.id)}
                      type="button"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {new Date(s.startAt).toLocaleString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}{' '}
                          • {new Date(s.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(s.endAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-slate-500">
                          Còn {Math.max(0, s.maxBookings - s.bookedCount)} / {s.maxBookings} lượt
                        </p>
                      </div>
                      <span className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">
                        {createBooking.isPending ? 'Đang đặt…' : 'Đặt lịch'}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Không có slot trống phù hợp.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

