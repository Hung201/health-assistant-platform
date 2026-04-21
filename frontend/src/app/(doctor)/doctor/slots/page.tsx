'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { doctorApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useAuthStore } from '@/stores/auth.store';

function statusBadgeClass(status: string) {
  if (status === 'available') return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
  if (status === 'cancelled') return 'bg-muted text-muted-foreground';
  if (status === 'expired') return 'bg-slate-500/10 text-slate-700 dark:text-slate-300';
  return 'bg-muted text-muted-foreground';
}

function statusLabel(status: string) {
  if (status === 'available') return 'Sẵn sàng';
  if (status === 'cancelled') return 'Đã huỷ';
  if (status === 'expired') return 'Đã qua';
  return status;
}

function formatTimeRange(startAt: string, endAt: string) {
  return `${new Date(startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(
    endAt,
  ).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
}

function formatDateLabel(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function DoctorSlotsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');
  const [maxBookings, setMaxBookings] = useState(5);
  const [filter, setFilter] = useState<'upcoming' | 'all'>('upcoming');
  const [cancelSlotId, setCancelSlotId] = useState<number | null>(null);
  const [detailSlotId, setDetailSlotId] = useState<number | null>(null);

  const doctorPrimarySpecialty = user?.doctorSpecialty ?? null;

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
    if (!doctorPrimarySpecialty) return 'Bạn chưa được gán chuyên khoa chính. Vui lòng liên hệ quản trị viên.';
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
  }, [doctorPrimarySpecialty, date, startAtMs, endAtMs, maxBookings, startTime, endTime]);

  const applyDurationFromStart = (minutes: number) => {
    const [h, m] = startTime.split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return;
    const base = h * 60 + m;
    const total = Math.min(24 * 60 - 1, base + minutes);
    const hh = String(Math.floor(total / 60)).padStart(2, '0');
    const mm = String(total % 60).padStart(2, '0');
    setEndTime(`${hh}:${mm}`);
  };

  const createSlot = useMutation({
    mutationFn: () => {
      return doctorApi.createSlot({
        startAt: startAtIso,
        endAt: endAtIso,
        maxBookings,
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

  useEffect(() => {
    if (detailSlotId == null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDetailSlotId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [detailSlotId]);

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

  const specialtyMap = useMemo(() => {
    const map = new Map<number, string>();
    if (doctorPrimarySpecialty) map.set(doctorPrimarySpecialty.id, doctorPrimarySpecialty.name);
    return map;
  }, [doctorPrimarySpecialty]);

  const summary = useMemo(() => {
    const all = slots ?? [];
    const now = Date.now();
    const upcoming = all.filter((s) => new Date(s.endAt).getTime() >= now && s.status !== 'cancelled');
    const full = all.filter((s) => s.bookedCount >= s.maxBookings && s.status === 'available');
    const cancelled = all.filter((s) => s.status === 'cancelled');
    return {
      total: all.length,
      upcoming: upcoming.length,
      full: full.length,
      cancelled: cancelled.length,
    };
  }, [slots]);

  const detailSlot = useMemo(() => (slots ?? []).find((s) => s.id === detailSlotId) ?? null, [slots, detailSlotId]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Lịch trống</h2>
          <p className="text-sm text-muted-foreground">Quản lý toàn bộ slot khám, theo dõi tình trạng và thao tác nhanh.</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Tổng slot</p>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{summary.total}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Sắp tới</p>
          <p className="mt-2 text-2xl font-extrabold text-emerald-700 dark:text-emerald-200">{summary.upcoming}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">Đã đầy</p>
          <p className="mt-2 text-2xl font-extrabold text-amber-700 dark:text-amber-200">{summary.full}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">Đã huỷ</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-700 dark:text-slate-200">{summary.cancelled}</p>
        </div>
      </section>

      {isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(error as Error).message}
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">Tạo slot mới</h3>
            <p className="text-sm text-muted-foreground">Thiết lập khung giờ khám để bệnh nhân có thể đặt lịch.</p>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
            Preview:{' '}
            <span className="font-semibold text-foreground">
              {new Date(startAtIso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit' })} ·{' '}
              {formatTimeRange(startAtIso, endAtIso)}
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
            <label className="mb-1 block text-sm font-semibold">Chuyên khoa của bác sĩ</label>
            <div className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-sm font-semibold text-foreground">
              {doctorPrimarySpecialty?.name ?? 'Chưa gán chuyên khoa'}
            </div>
          </div>
        </div>

        {validationError ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
            {validationError}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Nhập nhanh thời lượng:</span>
          {[15, 30, 45, 60].map((minute) => (
            <button
              key={minute}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
              onClick={() => applyDurationFromStart(minute)}
              type="button"
            >
              +{minute} phút
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">Mẹo: nên chia slot 20-30 phút để giảm trùng lịch và dễ quản lý.</p>
          <button
            className="rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={createSlot.isPending || Boolean(validationError)}
            onClick={() => createSlot.mutate()}
            type="button"
          >
            {createSlot.isPending ? 'Đang tạo…' : 'Tạo slot'}
          </button>
        </div>
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
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-foreground">{formatDateLabel(day)}</p>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                    {rows.length} slot
                  </span>
                </div>
                <div className="space-y-2">
                  {rows.map((s) => (
                    <div
                      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                      key={s.id}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{formatTimeRange(s.startAt, s.endAt)}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className={`rounded-full px-2 py-0.5 font-semibold ${statusBadgeClass(s.status)}`}>
                            {statusLabel(s.status)}
                          </span>
                          <span>
                            {s.bookedCount}/{s.maxBookings} đã đặt
                          </span>
                          <span>
                            Chuyên khoa: <b>{s.specialtyId ? specialtyMap.get(s.specialtyId) ?? `#${s.specialtyId}` : 'Mặc định'}</b>
                          </span>
                          {new Date(s.endAt).getTime() < Date.now() && s.status !== 'cancelled' ? (
                            <span className="rounded-full bg-slate-500/10 px-2 py-0.5 font-semibold text-slate-700 dark:text-slate-300">
                              đã qua
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.min(100, Math.round((s.bookedCount / Math.max(1, s.maxBookings)) * 100))}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted"
                          type="button"
                          onClick={() => setDetailSlotId(s.id)}
                        >
                          Chi tiết
                        </button>
                        <button
                          className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-muted"
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(
                              `${day} ${formatTimeRange(s.startAt, s.endAt)}`,
                            );
                            toast.show({ variant: 'info', title: 'Đã sao chép', message: 'Đã sao chép thời gian slot.' });
                          }}
                        >
                          Copy
                        </button>
                        <button
                          className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-destructive transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={
                            cancelSlot.isPending || s.status !== 'available' || s.bookedCount > 0 || new Date(s.endAt).getTime() < Date.now()
                          }
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

      {detailSlot ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
          <button className="absolute inset-0 bg-black/40" type="button" aria-label="Đóng" onClick={() => setDetailSlotId(null)} />
          <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Chi tiết slot</p>
                <h4 className="mt-1 text-lg font-bold text-foreground">{formatDateLabel(detailSlot.slotDate)}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{formatTimeRange(detailSlot.startAt, detailSlot.endAt)}</p>
              </div>
              <button
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                type="button"
                onClick={() => setDetailSlotId(null)}
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-muted/40 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Trạng thái</p>
                <p className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(detailSlot.status)}`}>
                  {statusLabel(detailSlot.status)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Chuyên khoa</p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {detailSlot.specialtyId
                    ? specialtyMap.get(detailSlot.specialtyId) ?? `#${detailSlot.specialtyId}`
                    : 'Mặc định'}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Đã đặt</p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {detailSlot.bookedCount}/{detailSlot.maxBookings}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Mức lấp đầy</p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {Math.min(100, Math.round((detailSlot.bookedCount / Math.max(1, detailSlot.maxBookings)) * 100))}%
                </p>
              </div>
            </div>

            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(100, Math.round((detailSlot.bookedCount / Math.max(1, detailSlot.maxBookings)) * 100))}%` }}
              />
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                type="button"
                onClick={() => setDetailSlotId(null)}
              >
                Đóng
              </button>
              <button
                className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(`${detailSlot.slotDate} ${formatTimeRange(detailSlot.startAt, detailSlot.endAt)}`);
                  toast.show({ variant: 'info', title: 'Đã sao chép', message: 'Đã sao chép thời gian slot.' });
                }}
              >
                Copy thời gian
              </button>
              <button
                className="inline-flex items-center justify-center rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={
                  cancelSlot.isPending ||
                  detailSlot.status !== 'available' ||
                  detailSlot.bookedCount > 0 ||
                  new Date(detailSlot.endAt).getTime() < Date.now()
                }
                onClick={() => {
                  setDetailSlotId(null);
                  setCancelSlotId(detailSlot.id);
                }}
              >
                Huỷ slot này
              </button>
            </div>
          </div>
        </div>
      ) : null}

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

