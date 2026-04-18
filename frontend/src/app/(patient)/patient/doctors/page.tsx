'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { authApi, bookingsApi, doctorsApi, type PublicDoctorCard } from '@/lib/api';
import { useToast } from '@/components/ui/toast';

export default function PatientFindDoctorsPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const [specialtyId, setSpecialtyId] = useState<number | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<PublicDoctorCard | null>(null);
  const [patientNote, setPatientNote] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [confirmSlot, setConfirmSlot] = useState<{
    id: number;
    startAt: string;
    endAt: string;
    remaining: number;
    max: number;
  } | null>(null);
  const limit = 10;

  const { data: specialties, isLoading: isLoadingSpecialties } = useQuery({
    queryKey: ['public', 'specialties'],
    queryFn: authApi.specialties,
    staleTime: 60_000,
  });

  const { data: doctors, isLoading: isLoadingDoctors, isError: isDoctorsError, error: doctorsError } = useQuery({
    queryKey: ['public', 'doctors', { specialtyId, page, limit }],
    queryFn: () => doctorsApi.list({ specialtyId: specialtyId ?? undefined, page, limit }),
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
    onSuccess: async () => {
      toast.show({
        variant: 'success',
        title: 'Đặt lịch thành công',
        message: 'Bạn có thể xem chi tiết trong mục "Lịch hẹn của tôi".',
      });
      await qc.invalidateQueries({ queryKey: ['public', 'doctorSlots'] });
      await qc.invalidateQueries({ queryKey: ['patient', 'bookings', 'me'] });
    },
    onError: (err) => {
      toast.show({
        variant: 'error',
        title: 'Đặt lịch thất bại',
        message: err instanceof Error ? err.message : 'Không thể đặt lịch. Vui lòng thử lại.',
      });
    },
  });

  useEffect(() => {
    if (!confirmSlot) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmSlot(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmSlot]);

  const activeSpecialtyName = useMemo(() => {
    if (!specialties || specialtyId == null) return null;
    return specialties.find((s) => s.id === specialtyId)?.name ?? null;
  }, [specialties, specialtyId]);

  const filteredDoctors = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = doctors?.items ?? [];
    if (!q) return items;
    return items.filter((d) => {
      const hay = `${d.fullName ?? ''} ${d.professionalTitle ?? ''} ${d.workplaceName ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [doctors?.items, query]);

  const totalPages = Math.max(1, Math.ceil((doctors?.total ?? 0) / limit));

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-foreground">Tìm bác sĩ</h2>
        <p className="text-sm text-muted-foreground">Chọn chuyên khoa, xem bác sĩ và đặt lịch theo slot trống.</p>
      </header>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <label className="mb-2 block text-sm font-semibold text-foreground" htmlFor="specialty">
              Chuyên khoa
            </label>
            <select
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
              id="specialty"
              onChange={(e) => {
                const v = e.target.value ? Number(e.target.value) : null;
                setSpecialtyId(v && !Number.isNaN(v) ? v : null);
                setSelectedDoctor(null);
                setQuery('');
                setPage(1);
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

          <div className="lg:col-span-1">
            <label className="mb-2 block text-sm font-semibold text-foreground" htmlFor="doctorQuery">
              Tìm theo tên / cơ sở
            </label>
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-muted-foreground">
                search
              </span>
              <input
                className="w-full rounded-lg border border-border bg-card py-3 pl-10 pr-10 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary"
                id="doctorQuery"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ví dụ: Trần, tim mạch, Precision…"
              />
              {query.trim() ? (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => setQuery('')}
                  type="button"
                  aria-label="Xoá tìm kiếm"
                  title="Xoá"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex items-end lg:col-span-1">
            <div className="w-full text-sm text-muted-foreground">
              {activeSpecialtyName ? (
                <span>
                  Đang lọc theo: <span className="font-semibold text-foreground">{activeSpecialtyName}</span>
                </span>
              ) : (
                <span>Hiển thị tất cả bác sĩ đã duyệt</span>
              )}
              <div className="mt-1 text-xs text-muted-foreground">
                {isLoadingDoctors ? 'Đang tải danh sách…' : `${doctors?.total ?? 0} bác sĩ`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isDoctorsError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(doctorsError as Error).message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-foreground">Bác sĩ</h3>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                Trang {doctors?.page ?? page}/{totalPages}
              </span>
              {query.trim() ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  Lọc: {filteredDoctors.length}/{doctors?.items?.length ?? 0}
                </span>
              ) : null}
            </div>
            <div className="flex gap-2">
              <button
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-50"
                disabled={page <= 1 || isLoadingDoctors}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                Trước
              </button>
              <button
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-50"
                disabled={page >= totalPages || isLoadingDoctors}
                onClick={() => setPage((p) => p + 1)}
                type="button"
              >
                Sau
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {isLoadingDoctors ? (
              <>
                <div className="h-[92px] animate-pulse rounded-xl border border-border bg-card p-4" />
                <div className="h-[92px] animate-pulse rounded-xl border border-border bg-card p-4" />
                <div className="h-[92px] animate-pulse rounded-xl border border-border bg-card p-4" />
              </>
            ) : filteredDoctors.length > 0 ? (
              filteredDoctors.map((d) => {
                const active = selectedDoctor?.userId === d.userId;
                return (
                  <button
                    className={`w-full rounded-xl border p-4 text-left transition-colors ${
                      active ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted'
                    }`}
                    key={d.userId}
                    type="button"
                    onClick={() => setSelectedDoctor(d)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <span className="material-symbols-outlined">stethoscope</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-foreground">{d.fullName}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {d.professionalTitle ?? 'Bác sĩ'}
                          {d.workplaceName ? ` • ${d.workplaceName}` : ''}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(d.specialties ?? []).slice(0, 3).map((s: PublicDoctorCard['specialties'][number]) => (
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                s.isPrimary ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                              }`}
                              key={`${d.userId}-${s.id}`}
                            >
                              {s.name}
                            </span>
                          ))}
                          {d.specialties.length > 3 ? (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                              +{d.specialties.length - 3}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Phí khám</p>
                          <p className="mt-1 font-bold text-foreground">{Number(d.consultationFee).toLocaleString()}₫</p>
                        </div>
                        <Link
                          className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                          href={`/patient/doctors/${encodeURIComponent(d.userId)}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Chi tiết
                        </Link>
                      </div>
                    </div>
                    {active ? (
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="material-symbols-outlined text-[16px] text-primary">calendar_month</span>
                        Đã chọn — xem danh sách slot bên phải để đặt lịch.
                      </div>
                    ) : null}
                  </button>
                );
              })
            ) : (
              <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-sm">
                Không có bác sĩ phù hợp{query.trim() ? ' với từ khoá hiện tại.' : '.'}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground">Slot trống</h3>
            {selectedDoctor ? (
              <button
                className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                type="button"
                onClick={() => {
                  setSelectedDoctor(null);
                  setPatientNote('');
                }}
              >
                Bỏ chọn
              </button>
            ) : null}
          </div>

          {!selectedDoctor ? (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <span className="material-symbols-outlined">event_available</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Chưa chọn bác sĩ</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Chọn một bác sĩ ở danh sách bên trái để xem slot trống và đặt lịch.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bác sĩ</p>
                <p className="mt-1 font-bold text-foreground">{selectedDoctor.fullName}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedDoctor.professionalTitle ?? 'Bác sĩ'}
                  {selectedDoctor.workplaceName ? ` • ${selectedDoctor.workplaceName}` : ''}
                </p>
              </div>

              <label className="mb-2 block text-sm font-semibold text-foreground" htmlFor="note">
                Ghi chú cho bác sĩ (tuỳ chọn)
              </label>
              <textarea
                className="mb-4 w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
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
                    <div className="h-16 animate-pulse rounded-lg bg-muted" />
                    <div className="h-16 animate-pulse rounded-lg bg-muted" />
                  </>
                ) : slots && slots.length > 0 ? (
                  slots.slice(0, 10).map((s) => (
                    <button
                      className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={createBooking.isPending}
                      key={s.id}
                      onClick={() =>
                        setConfirmSlot({
                          id: s.id,
                          startAt: s.startAt,
                          endAt: s.endAt,
                          remaining: Math.max(0, s.maxBookings - s.bookedCount),
                          max: s.maxBookings,
                        })
                      }
                      type="button"
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {new Date(s.startAt).toLocaleString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}{' '}
                          • {new Date(s.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(s.endAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Còn {Math.max(0, s.maxBookings - s.bookedCount)} / {s.maxBookings} lượt
                        </p>
                      </div>
                      <span className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">
                        {createBooking.isPending ? 'Đang đặt…' : 'Đặt lịch'}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
                    Không có slot trống phù hợp.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {confirmSlot && selectedDoctor ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          aria-modal="true"
          role="dialog"
        >
          <button
            className="absolute inset-0 bg-black/40"
            type="button"
            aria-label="Đóng"
            onClick={() => setConfirmSlot(null)}
          />
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Xác nhận đặt lịch</p>
                <h4 className="mt-1 text-lg font-bold text-foreground">Bạn có chắc muốn đặt lịch?</h4>
              </div>
              <button
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                type="button"
                onClick={() => setConfirmSlot(null)}
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-3 rounded-lg border border-border bg-muted p-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary">stethoscope</span>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{selectedDoctor.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDoctor.professionalTitle ?? 'Bác sĩ'}
                    {selectedDoctor.workplaceName ? ` • ${selectedDoctor.workplaceName}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary">schedule</span>
                <div>
                  <p className="font-semibold text-foreground">
                    {new Date(confirmSlot.startAt).toLocaleString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}{' '}
                    • {new Date(confirmSlot.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} -{' '}
                    {new Date(confirmSlot.endAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Còn {confirmSlot.remaining} / {confirmSlot.max} lượt
                  </p>
                </div>
              </div>
              {patientNote.trim() ? (
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary">notes</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Ghi chú</p>
                    <p className="text-sm text-muted-foreground">{patientNote.trim()}</p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                type="button"
                disabled={createBooking.isPending}
                onClick={() => setConfirmSlot(null)}
              >
                Huỷ
              </button>
              <button
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={createBooking.isPending}
                onClick={() => {
                  const slotId = confirmSlot.id;
                  setConfirmSlot(null);
                  createBooking.mutate(slotId);
                }}
              >
                {createBooking.isPending ? 'Đang đặt…' : 'Xác nhận đặt lịch'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

