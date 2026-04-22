'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { doctorApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast';

function statusBadgeClass(status: string) {
  if (status === 'pending') return 'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-500/15 dark:text-amber-300';
  if (status === 'approved') return 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-500/15 dark:text-emerald-300';
  if (status === 'rejected') return 'border border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-500/15 dark:text-red-300';
  if (status === 'cancelled') return 'border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';
  return 'border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';
}

function statusLabel(status: string) {
  if (status === 'pending') return 'Chờ duyệt';
  if (status === 'approved') return 'Đã duyệt';
  if (status === 'rejected') return 'Đã từ chối';
  if (status === 'cancelled') return 'Đã huỷ';
  return status;
}

function paymentMethodLabel(method: string) {
  return method === 'pay_at_clinic' ? 'Tại viện' : 'MoMo';
}

function paymentStatusLabel(status: string) {
  if (status === 'paid') return 'Đã thanh toán';
  if (status === 'awaiting_gateway') return 'Chờ thanh toán';
  if (status === 'failed') return 'Thanh toán lỗi';
  if (status === 'pay_at_clinic') return 'Thu tại viện';
  return 'Chưa thanh toán';
}

function paymentFilterMatch(paymentStatus: string, filter: PaymentFilterValue) {
  if (filter === 'all') return true;
  if (filter === 'unpaid_group') return paymentStatus === 'unpaid' || paymentStatus === 'awaiting_gateway' || paymentStatus === 'failed';
  return paymentStatus === filter;
}

function paymentBadgeClass(status: string, method: string) {
  if (method === 'pay_at_clinic') return 'border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-500/15 dark:text-blue-300';
  if (status === 'paid') return 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-500/15 dark:text-emerald-300';
  if (status === 'awaiting_gateway') return 'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-500/15 dark:text-amber-300';
  if (status === 'failed') return 'border border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-500/15 dark:text-red-300';
  return 'border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';
}

type BookingStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
};

type PaymentFilterValue = 'all' | 'paid' | 'awaiting_gateway' | 'failed' | 'pay_at_clinic' | 'unpaid_group';

export default function DoctorBookingsPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'cancelled'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilterValue>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['doctor', 'bookings'],
    queryFn: doctorApi.myBookings,
    staleTime: 10_000,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => doctorApi.approveBooking(id),
    onSuccess: async () => {
      toast.show({ variant: 'success', title: 'Đã duyệt', message: 'Đã gửi email thanh toán / xác nhận cho bệnh nhân.' });
      await qc.invalidateQueries({ queryKey: ['doctor', 'bookings'] });
      setSelectedId(null);
    },
    onError: (e: unknown) => {
      toast.show({
        variant: 'error',
        title: 'Duyệt thất bại',
        message: e instanceof Error ? e.message : 'Không thể duyệt lịch.',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => doctorApi.rejectBooking(id, reason),
    onSuccess: async () => {
      toast.show({ variant: 'success', title: 'Đã từ chối', message: 'Lịch hẹn đã được cập nhật.' });
      await qc.invalidateQueries({ queryKey: ['doctor', 'bookings'] });
      setSelectedId(null);
    },
    onError: (e: unknown) => {
      toast.show({
        variant: 'error',
        title: 'Từ chối thất bại',
        message: e instanceof Error ? e.message : 'Không thể từ chối lịch.',
      });
    },
  });

  const [rejectReason, setRejectReason] = useState('');

  const selected = useMemo(() => (data ?? []).find((b) => b.id === selectedId) ?? null, [data, selectedId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter((b) => {
      if (status !== 'all' && b.status !== status) return false;
      if (!paymentFilterMatch(b.paymentStatus, paymentFilter)) return false;
      if (!q) return true;
      const guestHay = `${b.guestFullName ?? ''} ${b.guestEmail ?? ''} ${b.guestPhone ?? ''}`;
      const patientHay = `${b.patientFullName ?? ''} ${b.patientEmail ?? ''} ${b.patientPhone ?? ''} ${b.patientUserId ?? ''}`;
      const hay = `${b.bookingCode} ${b.specialtyName ?? ''} ${patientHay} ${guestHay}`.toLowerCase();
      return hay.includes(q);
    });
  }, [data, query, status, paymentFilter]);

  const stats = useMemo<BookingStats>(() => {
    const rows = data ?? [];
    const by: BookingStats = { total: rows.length, pending: 0, approved: 0, rejected: 0, cancelled: 0 };
    for (const r of rows) {
      if (r.status === 'pending' || r.status === 'approved' || r.status === 'rejected' || r.status === 'cancelled') {
        by[r.status] += 1;
      }
    }
    return by;
  }, [data]);

  const paymentStats = useMemo(() => {
    const rows = data ?? [];
    return {
      paid: rows.filter((r) => r.paymentStatus === 'paid').length,
      awaiting: rows.filter((r) => r.paymentStatus === 'awaiting_gateway').length,
      payAtClinic: rows.filter((r) => r.paymentStatus === 'pay_at_clinic').length,
      unpaidGroup: rows.filter((r) => r.paymentStatus === 'unpaid' || r.paymentStatus === 'awaiting_gateway' || r.paymentStatus === 'failed')
        .length,
    };
  }, [data]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId]);

  const patientDisplay = (b: (typeof filtered)[number] | NonNullable<typeof selected>) => {
    if (b.patientUserId) {
      return {
        name: b.patientFullName ?? 'Bệnh nhân đã đăng nhập',
        phone: b.patientPhone ?? null,
        email: b.patientEmail ?? null,
      };
    }
    return {
      name: b.guestFullName ?? 'Khách',
      phone: b.guestPhone ?? null,
      email: b.guestEmail ?? null,
    };
  };

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
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-700 dark:text-emerald-300">
              đã thanh toán: {paymentStats.paid}
            </span>
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-semibold text-amber-700 dark:text-amber-300">
              chờ thanh toán: {paymentStats.awaiting}
            </span>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-3">
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
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Đã từ chối</option>
            <option value="cancelled">Đã huỷ</option>
          </select>
          <select
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as PaymentFilterValue)}
          >
            <option value="all">Tất cả thanh toán</option>
            <option value="paid">Đã thanh toán</option>
            <option value="awaiting_gateway">Chờ thanh toán</option>
            <option value="pay_at_clinic">Thu tại viện</option>
            <option value="failed">Thanh toán lỗi</option>
            <option value="unpaid_group">Nhóm chưa thanh toán</option>
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
          <div className="col-span-1">Ghi chú</div>
          <div className="col-span-2 text-right">Trạng thái</div>
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
                  {(() => {
                    const p = patientDisplay(b);
                    return (
                      <p className="text-xs text-muted-foreground">
                        BN: {p.name}
                        {p.phone ? ` · ${p.phone}` : ''}
                      </p>
                    );
                  })()}
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
                <div className="col-span-1">
                  <p className="line-clamp-2 text-sm text-muted-foreground">{b.patientNote ?? '—'}</p>
                </div>
                <div className="col-span-2 flex items-start justify-end">
                  <div className="flex flex-col items-end gap-1">
                    <span className={`inline-flex whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-semibold ${statusBadgeClass(b.status)}`}>
                      {statusLabel(b.status)}
                    </span>
                    <span className={`inline-flex whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-semibold ${paymentBadgeClass(b.paymentStatus, b.paymentMethod)}`}>
                      {paymentMethodLabel(b.paymentMethod)} · {paymentStatusLabel(b.paymentStatus)}
                    </span>
                  </div>
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

      {isMounted && selected && selectedId
        ? createPortal(
            <div className="fixed inset-0 z-[1000]" aria-modal="true" role="dialog">
              <button
                className="absolute inset-0 h-full w-full bg-black/60 backdrop-blur-[1px]"
                type="button"
                aria-label="Đóng"
                onClick={() => setSelectedId(null)}
              />
              <div className="absolute left-1/2 top-1/2 w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-5 shadow-2xl">
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
                {(() => {
                  const p = patientDisplay(selected);
                  return (
                    <>
                      <div className="mt-1 font-semibold text-foreground">{p.name}</div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {p.phone ? `SĐT: ${p.phone}` : 'SĐT: —'}
                        {p.email ? ` · Email: ${p.email}` : ''}
                      </p>
                    </>
                  );
                })()}
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
                    {statusLabel(selected.status)}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Phí</div>
                <div className="mt-1 font-semibold text-foreground">{Number(selected.totalFee).toLocaleString()}₫</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Thanh toán</div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                    Phương thức: {paymentMethodLabel(selected.paymentMethod)}
                  </span>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${paymentBadgeClass(selected.paymentStatus, selected.paymentMethod)}`}>
                    {paymentStatusLabel(selected.paymentStatus)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {selected.paymentStatus === 'paid'
                      ? 'Bệnh nhân đã thanh toán thành công.'
                      : selected.paymentMethod === 'pay_at_clinic'
                        ? 'Bệnh nhân thanh toán trực tiếp tại viện.'
                        : 'Bệnh nhân chưa hoàn tất thanh toán.'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ghi chú bệnh nhân</div>
                <div className="mt-1 text-sm text-foreground">{selected.patientNote ?? '—'}</div>
              </div>
            </div>

            {selected.status === 'pending' ? (
              <div className="mt-4 space-y-2">
                <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Lý do từ chối (tuỳ chọn)
                </label>
                <textarea
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                  rows={2}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do nếu từ chối…"
                />
              </div>
            ) : null}

            <div className="mt-5 flex flex-col-reverse flex-wrap gap-2 sm:flex-row sm:justify-end">
              <button
                className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                type="button"
                onClick={() => {
                  setRejectReason('');
                  setSelectedId(null);
                }}
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
              {selected.status === 'pending' ? (
                <>
                  <button
                    className="inline-flex items-center justify-center rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 transition-colors hover:bg-red-100 disabled:opacity-50"
                    type="button"
                    disabled={rejectMutation.isPending}
                    onClick={() => rejectMutation.mutate({ id: selected.id, reason: rejectReason })}
                  >
                    Từ chối
                  </button>
                  <button
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                    type="button"
                    disabled={approveMutation.isPending}
                    onClick={() => approveMutation.mutate(selected.id)}
                  >
                    Duyệt & gửi thanh toán
                  </button>
                </>
              ) : null}
            </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

