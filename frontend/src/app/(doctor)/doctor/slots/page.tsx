'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Calendar, Clock, CheckCircle2, AlertCircle, Users } from 'lucide-react';

import { doctorApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useAuthStore } from '@/stores/auth.store';

/* ── helpers ── */
function fmtTime(h: number, m: number) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function fmtTimeRange(startAt: string, endAt: string) {
  return `${new Date(startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} – ${new Date(endAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
}
function fmtDateLabel(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
  });
}
function statusBadge(status: string) {
  if (status === 'available') return 'bg-emerald-100 text-emerald-700';
  if (status === 'cancelled') return 'bg-slate-100 text-slate-500';
  return 'bg-slate-100 text-slate-400';
}
function statusLabel(status: string) {
  if (status === 'available') return 'Sẵn sàng';
  if (status === 'cancelled') return 'Đã huỷ';
  return 'Đã qua';
}

/* Generate 30-min slots from 06:00 → 22:00 */
const ALL_SLOTS: { label: string; h: number; m: number }[] = [];
for (let h = 6; h < 22; h++) {
  for (const m of [0, 30]) {
    ALL_SLOTS.push({ label: fmtTime(h, m), h, m });
  }
}

/* ── component ── */
export default function DoctorSlotsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [maxBookings, setMaxBookings] = useState(5);
  const [filter, setFilter] = useState<'upcoming' | 'all'>('upcoming');
  const [cancelSlotId, setCancelSlotId] = useState<number | null>(null);

  const specialty = user?.doctorSpecialty ?? null;

  const { data: slots, isLoading } = useQuery({
    queryKey: ['doctor', 'slots'],
    queryFn: doctorApi.mySlots,
    staleTime: 10_000,
  });

  /* slots already created on selected date */
  const existingTimesOnDate = useMemo(() => {
    const set = new Set<string>();
    (slots ?? [])
      .filter((s) => s.slotDate === date && s.status !== 'cancelled')
      .forEach((s) => {
        const h = new Date(s.startAt).getHours();
        const m = new Date(s.startAt).getMinutes();
        set.add(fmtTime(h, m));
      });
    return set;
  }, [slots, date]);

  const nowMs = Date.now();
  const isPast = (h: number, m: number) => {
    if (date > today) return false;
    if (date < today) return true;
    const slotMs = new Date(`${date}T${fmtTime(h, m)}:00`).getTime();
    return slotMs <= nowMs;
  };

  const toggleSlot = (label: string, h: number, m: number) => {
    if (isPast(h, m) || existingTimesOnDate.has(label)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const createSlot = useMutation({
    mutationFn: async () => {
      const sorted = ALL_SLOTS.filter((s) => selected.has(s.label));
      await Promise.all(
        sorted.map(({ h, m }) => {
          const startAt = new Date(`${date}T${fmtTime(h, m)}:00`).toISOString();
          const endDate = new Date(`${date}T${fmtTime(h, m)}:00`);
          endDate.setMinutes(endDate.getMinutes() + 30);
          return doctorApi.createSlot({ startAt, endAt: endDate.toISOString(), maxBookings });
        }),
      );
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['doctor', 'slots'] });
      setSelected(new Set());
      toast.show({ variant: 'success', title: 'Đã tạo slot', message: `Tạo thành công ${selected.size} slot.` });
    },
    onError: (e: unknown) => {
      toast.show({ variant: 'error', title: 'Lỗi', message: e instanceof Error ? e.message : 'Không thể tạo slot.' });
    },
  });

  const cancelSlot = useMutation({
    mutationFn: (id: number) => doctorApi.cancelSlot(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['doctor', 'slots'] });
      toast.show({
        variant: 'success',
        title: 'Đã huỷ slot',
        message: 'Slot đã được huỷ thành công.',
      });
      setCancelSlotId(null);
    },
    onError: (e: unknown) => {
      toast.show({ variant: 'error', title: 'Lỗi', message: e instanceof Error ? e.message : 'Không thể huỷ slot.' });
    },
  });

  const grouped = useMemo(() => {
    const arr = (slots ?? []).slice().sort((a, b) => a.startAt.localeCompare(b.startAt));
    const filtered = filter === 'all'
      ? arr
      : arr.filter((s) => new Date(s.endAt).getTime() >= nowMs && s.status !== 'cancelled');
    const map = new Map<string, typeof arr>();
    for (const s of filtered) {
      const k = s.slotDate;
      const list = map.get(k) ?? [];
      list.push(s);
      map.set(k, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [slots, filter, nowMs]);

  const summary = useMemo(() => {
    const all = slots ?? [];
    const upcoming = all.filter((s) => new Date(s.endAt).getTime() >= nowMs && s.status !== 'cancelled');
    const full = all.filter((s) => s.bookedCount >= s.maxBookings && s.status === 'available');
    const cancelled = all.filter((s) => s.status === 'cancelled');
    return { total: all.length, upcoming: upcoming.length, full: full.length, cancelled: cancelled.length };
  }, [slots, nowMs]);

  const specialtyMap = useMemo(() => {
    const m = new Map<number, string>();
    if (specialty) m.set(specialty.id, specialty.name);
    return m;
  }, [specialty]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Lịch trống</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Quản lý toàn bộ slot khám, theo dõi tình trạng và thao tác nhanh.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Tổng slot', value: summary.total, color: '#1a3353', bg: '#F7FAFB', darkBg: 'rgba(255,255,255,0.03)' },
          { label: 'Sắp tới', value: summary.upcoming, color: '#0D9E75', bg: '#E8F8F2', darkBg: 'rgba(13,158,117,0.12)' },
          { label: 'Đã đầy', value: summary.full, color: '#F59E0B', bg: '#FFFBEB', darkBg: 'rgba(245,158,11,0.12)' },
          { label: 'Đã huỷ', value: summary.cancelled, color: '#94A3B8', bg: '#F8FAFC', darkBg: 'rgba(148,163,184,0.08)' },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-border p-4 shadow-sm bg-card">
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: c.color, opacity: 0.7 }}>{c.label}</p>
            <p className="mt-1 text-2xl font-extrabold" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* ── NEW SLOT CREATOR ── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Section header */}
        <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0D9E75]/10">
            <Calendar size={18} className="text-[#0D9E75]" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-foreground">Tạo lịch trống</h3>
            <p className="text-xs text-muted-foreground">Chọn ngày, bấm vào các ô giờ bạn muốn mở, rồi bấm Tạo slot.</p>
          </div>
          {specialty && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#0D9E75]/20 bg-[#E8F8F2] px-3 py-1 text-xs font-semibold text-[#0D9E75]">
              {specialty.name}
            </span>
          )}
        </div>

        <div className="p-5 space-y-5">
          {/* Date + maxBookings row */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Ngày khám</label>
              <input
                type="date"
                value={date}
                min={today}
                onChange={(e) => { setDate(e.target.value); setSelected(new Set()); }}
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground outline-none focus:border-[#0D9E75] focus:ring-2 focus:ring-[#0D9E75]/20 transition-all"
              />
            </div>
            <div className="w-36">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                <Users size={12} /> Số lượt / slot
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={maxBookings}
                onChange={(e) => setMaxBookings(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground outline-none focus:border-[#0D9E75] focus:ring-2 focus:ring-[#0D9E75]/20 transition-all"
              />
            </div>
            {selected.size > 0 && (
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted transition-all"
              >
                Bỏ chọn tất cả
              </button>
            )}
          </div>

          {/* No specialty warning */}
          {!specialty && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <AlertCircle size={16} className="shrink-0" />
              Bạn chưa được gán chuyên khoa. Vui lòng liên hệ quản trị viên.
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm border-2 border-[#0D9E75] bg-[#0D9E75]" />
              Đã chọn
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm border-2 border-border bg-card" />
              Trống
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm border-2 border-slate-200 bg-slate-100" />
              Đã có slot
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm border-2 border-slate-100 bg-slate-50 opacity-40" />
              Đã qua
            </span>
          </div>

          {/* Time grid */}
          <div className="slot-time-grid">
            {ALL_SLOTS.map(({ label, h, m }) => {
              const past = isPast(h, m);
              const existing = existingTimesOnDate.has(label);
              const sel = selected.has(label);

              let cellClass = 'slot-cell';
              if (past) cellClass += ' slot-cell--past';
              else if (existing) cellClass += ' slot-cell--existing';
              else if (sel) cellClass += ' slot-cell--selected';

              const endH = m === 30 ? h + 1 : h;
              const endM = m === 30 ? 0 : 30;
              const endLabel = fmtTime(endH, endM);

              return (
                <button
                  key={label}
                  type="button"
                  className={cellClass}
                  onClick={() => toggleSlot(label, h, m)}
                  disabled={past || existing || !specialty}
                  title={existing ? 'Đã có slot trong giờ này' : past ? 'Đã qua' : `${label} – ${endLabel}`}
                >
                  {sel && (
                    <div className="slot-check">
                      <CheckCircle2 size={10} className="text-white" />
                    </div>
                  )}
                  <span className="text-[12px] font-bold">{label}</span>
                  <span className="text-[10px] opacity-60">–{endLabel}</span>
                  {existing && (
                    <span className="mt-0.5 text-[9px] font-semibold opacity-70">Đã có</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock size={15} className="text-[#0D9E75]" />
              {selected.size === 0
                ? 'Bấm vào các ô giờ để chọn khung giờ rảnh'
                : (
                  <span>
                    Đã chọn{' '}
                    <span className="font-bold text-[#0D9E75]">{selected.size} slot</span>
                    {' '}cho ngày{' '}
                    <span className="font-semibold">{new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                  </span>
                )}
            </div>
            <button
              type="button"
              disabled={selected.size === 0 || createSlot.isPending || !specialty}
              onClick={() => createSlot.mutate()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0D9E75] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#0D9E75]/25 transition-all hover:bg-[#0B8A65] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createSlot.isPending ? (
                <span className="animate-spin inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              {createSlot.isPending ? 'Đang tạo…' : `Tạo ${selected.size > 0 ? selected.size + ' ' : ''}slot`}
            </button>
          </div>
        </div>
      </div>

      {/* ── Slot list ── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-border bg-muted/50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Slot của tôi</p>
          <div className="doctor-tab-bar">
            <button type="button" className={`doctor-tab${filter === 'upcoming' ? ' active' : ''}`} onClick={() => setFilter('upcoming')}>Sắp tới</button>
            <button type="button" className={`doctor-tab${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>Tất cả</button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 text-sm text-slate-400">Đang tải…</div>
        ) : grouped.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            Chưa có slot nào{filter === 'upcoming' ? ' sắp tới' : ''}. Hãy tạo slot ở trên.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {grouped.map(([day, rows]) => (
              <div key={day} className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground">{fmtDateLabel(day)}</p>
                  <span className="rounded-full bg-[#E8F8F2] px-2.5 py-0.5 text-xs font-semibold text-[#0D9E75]">
                    {rows.length} slot
                  </span>
                </div>
                <div className="space-y-2">
                  {rows.map((s) => {
                    const pct = Math.min(100, Math.round((s.bookedCount / Math.max(1, s.maxBookings)) * 100));
                    const expired = new Date(s.endAt).getTime() < Date.now();
                    return (
                      <div key={s.id} className="slot-list-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-foreground">{fmtTimeRange(s.startAt, s.endAt)}</p>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadge(s.status)}`}>
                              {statusLabel(s.status)}
                            </span>
                            {expired && s.status !== 'cancelled' && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">Đã qua</span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-400">
                            {s.bookedCount}/{s.maxBookings} đã đặt
                            {s.specialtyId ? ` · ${specialtyMap.get(s.specialtyId) ?? `#${s.specialtyId}`}` : ''}
                          </p>
                          <div className="mt-2 h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: pct >= 100 ? '#F59E0B' : '#0D9E75' }}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={cancelSlot.isPending || s.status !== 'available' || s.bookedCount > 0 || expired}
                          onClick={() => setCancelSlotId(s.id)}
                          className="shrink-0 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-red-500 transition-colors hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Huỷ slot
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel confirm modal */}
      {cancelSlotId != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
          <button className="absolute inset-0 bg-black/40 backdrop-blur-sm" type="button" onClick={() => setCancelSlotId(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 mb-4">
              <AlertCircle size={24} className="text-red-500" />
            </div>
            <h4 className="text-lg font-bold text-foreground">Huỷ slot này?</h4>
            <p className="mt-1 text-sm text-muted-foreground">Chỉ huỷ được khi slot đang sẵn sàng và chưa có ai đặt.</p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setCancelSlotId(null)}
                className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-all"
              >
                Không huỷ
              </button>
              <button
                type="button"
                disabled={cancelSlot.isPending}
                onClick={() => cancelSlot.mutate(cancelSlotId)}
                className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60 transition-all"
              >
                {cancelSlot.isPending ? 'Đang huỷ…' : 'Xác nhận huỷ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
