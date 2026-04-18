'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';

import { doctorApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast';

function statusBadgeClass(status: string) {
  if (status === 'pending') return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
  if (status === 'approved') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';
  if (status === 'rejected') return 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300';
  if (status === 'cancelled') return 'bg-muted text-muted-foreground';
  return 'bg-muted text-muted-foreground';
}

export default function DoctorBookingsPage() {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'cancelled'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['doctor', 'bookings'],
    queryFn: doctorApi.myBookings,
    staleTime: 10_000,
  });

  const selected = useMemo(() => (data ?? []).find((b) => b.id === selectedId) ?? null, [data, selectedId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter((b) => {
      if (status !== 'all' && b.status !== status) return false;
      if (!q) return true;
      const hay = `${b.bookingCode} ${b.specialtyName ?? ''} ${b.patientUserId ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [data, query, status]);

  const stats = useMemo(() => {
    const rows = data ?? [];
    const by = { pending: 0, approved: 0, rejected: 0, cancelled: 0 } as Record<string, number>;
    for (const r of rows) by[r.status] = (by[r.status] ?? 0) + 1;
    return { total: rows.length, ...by };
  }, [data]);

  useEffect(() => {
    if (!selectedId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Lịch hẹn</h2>
          <p className="text-sm text-muted-foreground">Danh sách lịch hẹn bệnh nhân đã đặt.</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-muted px-2 py-0.5 font-semibold text-muted-foreground">Tổng: {stats.total}</span>
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-semibold text-amber-700 dark:text-amber-300">
              pending: {stats.pending ?? 0}
            </span>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-700 dark:text-emerald-300">
              approved: {stats.approved ?? 0}
            </span>
            <span className="rounded-full bg-red-500/15 px-2 py-0.5 font-semibold text-red-700 dark:text-red-300">
              rejected: {stats.rejected ?? 0}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 font-semibold text-muted-foreground">
              cancelled: {stats.cancelled ?? 0}
            </span>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-2">
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-muted-foreground">
              search
            </span>
            <input
              className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-10 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary"
              placeholder="Tìm theo mã / chuyên khoa / BN…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query.trim() ? (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                type="button"
                onClick={() => setQuery('')}
                aria-label="Xoá tìm kiếm"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            ) : null}
          </div>

          <select
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">pending</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
            <option value="cancelled">cancelled</option>
          </select>
        </div>
      </header>

      {isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(error as Error).message}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-12 border-b border-border bg-muted px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          <div className="col-span-3">Mã</div>
          <div className="col-span-3">Chuyên khoa</div>
          <div className="col-span-3">Thời gian</div>
          <div className="col-span-2">Ghi chú</div>
          <div className="col-span-1 text-right">Trạng thái</div>
        </div>

        {isLoading ? (
          <div className="p-5 text-sm text-muted-foreground">Đang tải…</div>
        ) : filtered.length > 0 ? (
          <div className="divide-y divide-border">
            {filtered.map((b) => (
              <button
                className="grid w-full grid-cols-12 gap-2 px-5 py-4 text-left text-sm transition-colors hover:bg-muted"
                key={b.id}
                type="button"
                onClick={() => setSelectedId(b.id)}
              >
                <div className="col-span-3">
                  <p className="font-bold text-foreground">{b.bookingCode}</p>
                  <p className="text-xs text-muted-foreground">BN: {b.patientUserId}</p>
                </div>
                <div className="col-span-3">
                  <p className="font-semibold text-foreground">{b.specialtyName}</p>
                </div>
                <div className="col-span-3">
                  <p className="font-semibold text-foreground">
                    {new Date(b.appointmentStartAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit' })}{' '}
                    {new Date(b.appointmentStartAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    đến {new Date(b.appointmentEndAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="line-clamp-2 text-sm text-muted-foreground">{b.patientNote ?? '—'}</p>
                </div>
                <div className="col-span-1 flex items-start justify-end">
                  <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${statusBadgeClass(b.status)}`}>
                    {b.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-5 text-sm text-muted-foreground">
            {data && data.length > 0 ? 'Không có lịch hẹn phù hợp bộ lọc.' : 'Chưa có lịch hẹn nào.'}
          </div>
        )}
      </div>

      {selected && selectedId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
          <button className="absolute inset-0 bg-black/40" type="button" aria-label="Đóng" onClick={() => setSelectedId(null)} />
          <div className="relative w-full max-w-2xl rounded-xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Chi tiết lịch hẹn</p>
                <h3 className="mt-1 text-lg font-bold text-foreground">{selected.bookingCode}</h3>
              </div>
              <button
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted p-4 sm:grid-cols-2">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bệnh nhân</div>
                <div className="mt-1 font-semibold text-foreground">{selected.patientUserId}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Chuyên khoa</div>
                <div className="mt-1 font-semibold text-foreground">{selected.specialtyName}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Thời gian</div>
                <div className="mt-1 font-semibold text-foreground">
                  {new Date(selected.appointmentStartAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit' })}{' '}
                  {new Date(selected.appointmentStartAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{' '}
                  - {new Date(selected.appointmentEndAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Trạng thái</div>
                <div className="mt-1">
                  <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${statusBadgeClass(selected.status)}`}>
                    {selected.status}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Phí</div>
                <div className="mt-1 font-semibold text-foreground">{Number(selected.totalFee).toLocaleString()}₫</div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ghi chú bệnh nhân</div>
                <div className="mt-1 text-sm text-foreground">{selected.patientNote ?? '—'}</div>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                type="button"
                onClick={() => setSelectedId(null)}
              >
                Đóng
              </button>
              <button
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(selected.bookingCode);
                  toast.show({ variant: 'info', title: 'Đã sao chép', message: 'Đã sao chép mã lịch hẹn.' });
                }}
              >
                Copy mã
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

