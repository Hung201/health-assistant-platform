'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { authApi, doctorApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast';

function statusBadgeClass(status: string) {
  if (status === 'available') return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
  if (status === 'cancelled') return 'bg-muted text-muted-foreground';
  if (status === 'expired') return 'bg-slate-500/10 text-slate-700 dark:text-slate-300';
  return 'bg-muted text-muted-foreground';
}

export default function DoctorSlotsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [specialtyId, setSpecialtyId] = useState<number | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');
  const [maxBookings, setMaxBookings] = useState(5);
  const [filter, setFilter] = useState<'upcoming' | 'all'>('upcoming');
  const [cancelSlotId, setCancelSlotId] = useState<number | null>(null);

  const { data: specialties } = useQuery({
    queryKey: ['public', 'specialties'],
    queryFn: authApi.specialties,
    staleTime: 60_000,
  });

  const { data: slots, isLoading, isError, error } = useQuery({
    queryKey: ['doctor', 'slots'],
    queryFn: doctorApi.mySlots,
    staleTime: 10_000,
  });

  const startAtIso = useMemo(() => new Date(`${date}T${startTime}:00`).toISOString(), [date, startTime]);
  const endAtIso = useMemo(() => new Date(`${date}T${endTime}:00`).toISOString(), [date, endTime]);
  const startAtMs = useMemo(() => new Date(startAtIso).getTime(), [startAtIso]);
  const endAtMs = useMemo(() => new Date(endAtIso).getTime(), [endAtIso]);

  const validationError = useMemo(() => {
    if (!date) return 'Vui lòng chọn ngày.';
    if (!startTime || !endTime) return 'Vui lòng chọn giờ bắt đầu/kết thúc.';
    if (Number.isNaN(startAtMs) || Number.isNaN(endAtMs)) return 'Thời gian không hợp lệ.';
    if (endAtMs <= startAtMs) return 'Giờ kết thúc phải sau giờ bắt đầu.';
    const durationMin = Math.round((endAtMs - startAtMs) / 60000);
    if (durationMin < 10) return 'Slot tối thiểu 10 phút.';
    if (durationMin > 240) return 'Slot tối đa 4 giờ (hãy chia nhỏ).';
    if (!Number.isFinite(maxBookings) || maxBookings < 1) return 'Số lượt tối thiểu là 1.';
    if (maxBookings > 50) return 'Số lượt tối đa là 50.';
    if (startAtMs < Date.now() - 60_000) return 'Không thể tạo slot ở quá khứ.';
    return null;
  }, [date, startAtMs, endAtMs, maxBookings, startTime, endTime]);

  const createSlot = useMutation({
    mutationFn: () => {
      return doctorApi.createSlot({
        startAt: startAtIso,
        endAt: endAtIso,
        maxBookings,
        specialtyId: specialtyId ?? undefined,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['doctor', 'slots'] });
      toast.show({ variant: 'success', title: 'Đã tạo slot', message: 'Slot đã được thêm vào danh sách.' });
    },
    onError: (e: unknown) => {
      toast.show({
        variant: 'error',
        title: 'Tạo slot thất bại',
        message: e instanceof Error ? e.message : 'Không thể tạo slot. Vui lòng thử lại.',
      });
    },
  });

  const cancelSlot = useMutation({
    mutationFn: (id: number) => doctorApi.cancelSlot(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['doctor', 'slots'] });
      toast.show({ variant: 'success', title: 'Đã huỷ slot', message: 'Slot đã được chuyển sang trạng thái cancelled.' });
      setCancelSlotId(null);
    },
    onError: (e: unknown) => {
      toast.show({
        variant: 'error',
        title: 'Huỷ slot thất bại',
        message: e instanceof Error ? e.message : 'Không thể huỷ slot. Vui lòng thử lại.',
      });
    },
  });

  useEffect(() => {
    if (cancelSlotId == null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCancelSlotId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cancelSlotId]);

  const grouped = useMemo(() => {
    const arr = (slots ?? []).slice().sort((a, b) => a.startAt.localeCompare(b.startAt));
    const now = Date.now();
    const filtered =
      filter === 'all'
        ? arr
        : arr.filter((s) => new Date(s.endAt).getTime() >= now && s.status !== 'cancelled');
    const map = new Map<string, typeof arr>();
    for (const s of filtered) {
      const k = s.slotDate;
      const list = map.get(k) ?? [];
      list.push(s);
      map.set(k, list);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [slots, filter]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Lịch trống</h2>
          <p className="text-sm text-muted-foreground">Tạo slot khám để bệnh nhân đặt lịch.</p>
        </div>
      </header>

      {isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(error as Error).message}
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">Tạo slot</h3>
            <p className="text-sm text-muted-foreground">Thiết lập thời gian và số lượt bệnh nhân có thể đặt.</p>
          </div>
          <div className="text-xs text-muted-foreground">
            Preview:{' '}
            <span className="font-semibold text-foreground">
              {new Date(startAtIso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit' })}{' '}
              {new Date(startAtIso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} -{' '}
              {new Date(endAtIso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-1 block text-sm font-semibold" htmlFor="date">
              Ngày
            </label>
            <input
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
              id="date"
              onChange={(e) => setDate(e.target.value)}
              type="date"
              value={date}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold" htmlFor="start">
              Bắt đầu
            </label>
            <input
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
              id="start"
              onChange={(e) => setStartTime(e.target.value)}
              type="time"
              value={startTime}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold" htmlFor="end">
              Kết thúc
            </label>
            <input
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
              id="end"
              onChange={(e) => setEndTime(e.target.value)}
              type="time"
              value={endTime}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold" htmlFor="max">
              Số lượt
            </label>
            <input
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
              id="max"
              max={50}
              min={1}
              onChange={(e) => setMaxBookings(Number(e.target.value))}
              type="number"
              value={maxBookings}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold" htmlFor="spec">
              Chuyên khoa
            </label>
            <select
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
              id="spec"
              onChange={(e) => setSpecialtyId(e.target.value ? Number(e.target.value) : null)}
              value={specialtyId ?? ''}
            >
              <option value="">(Tuỳ chọn)</option>
              {specialties?.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {validationError ? (
          <div className="mt-4 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
            {validationError}
          </div>
        ) : null}

        <button
          className="mt-4 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={createSlot.isPending || Boolean(validationError)}
          onClick={() => createSlot.mutate()}
          type="button"
        >
          {createSlot.isPending ? 'Đang tạo…' : 'Tạo slot'}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-2 border-b border-border bg-muted px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Slot của tôi</div>
          <div className="flex items-center gap-2 text-xs">
            <button
              className={`rounded-lg border px-2 py-1 font-semibold transition-colors ${
                filter === 'upcoming'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              type="button"
              onClick={() => setFilter('upcoming')}
            >
              Sắp tới
            </button>
            <button
              className={`rounded-lg border px-2 py-1 font-semibold transition-colors ${
                filter === 'all'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              type="button"
              onClick={() => setFilter('all')}
            >
              Tất cả
            </button>
          </div>
        </div>
        {isLoading ? (
          <div className="p-5 text-sm text-muted-foreground">Đang tải…</div>
        ) : grouped.length > 0 ? (
          <div className="divide-y divide-border">
            {grouped.map(([day, rows]) => (
              <div className="p-5" key={day}>
                <p className="mb-3 text-sm font-bold text-foreground">{day}</p>
                <div className="space-y-2">
                  {rows.map((s) => (
                    <div
                      className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                      key={s.id}
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {new Date(s.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(s.endAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className={`rounded-full px-2 py-0.5 font-semibold ${statusBadgeClass(s.status)}`}>
                            {s.status}
                          </span>
                          <span>
                            {s.bookedCount}/{s.maxBookings} đã đặt
                          </span>
                          {new Date(s.endAt).getTime() < Date.now() && s.status !== 'cancelled' ? (
                            <span className="rounded-full bg-slate-500/10 px-2 py-0.5 font-semibold text-slate-700 dark:text-slate-300">
                              đã qua
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted"
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(
                              `${day} ${new Date(s.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}-${new Date(s.endAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
                            );
                            toast.show({ variant: 'info', title: 'Đã sao chép', message: 'Đã sao chép thời gian slot.' });
                          }}
                        >
                          Copy
                        </button>
                        <button
                          className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-destructive transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={cancelSlot.isPending || s.status !== 'available' || s.bookedCount > 0}
                          onClick={() => setCancelSlotId(s.id)}
                          type="button"
                        >
                          Huỷ slot
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5 text-sm text-muted-foreground">
            Chưa có slot nào{filter === 'upcoming' ? ' sắp tới' : ''}. Hãy tạo slot ở phần trên.
          </div>
        )}
      </div>

      {cancelSlotId != null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
          <button className="absolute inset-0 bg-black/40" type="button" aria-label="Đóng" onClick={() => setCancelSlotId(null)} />
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Xác nhận</p>
                <h4 className="mt-1 text-lg font-bold text-foreground">Huỷ slot này?</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Chỉ huỷ được khi slot đang <b>available</b> và chưa có ai đặt.
                </p>
              </div>
              <button
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                type="button"
                onClick={() => setCancelSlotId(null)}
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                type="button"
                disabled={cancelSlot.isPending}
                onClick={() => setCancelSlotId(null)}
              >
                Không huỷ
              </button>
              <button
                className="inline-flex items-center justify-center rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={cancelSlot.isPending}
                onClick={() => cancelSlot.mutate(cancelSlotId)}
              >
                {cancelSlot.isPending ? 'Đang huỷ…' : 'Xác nhận huỷ'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

