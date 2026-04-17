'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { bookingsApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast';

function statusBadgeClass(status: string) {
  if (status === 'pending') return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
  if (status === 'approved') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';
  if (status === 'rejected') return 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300';
  if (status === 'cancelled') return 'bg-slate-100 text-slate-600 dark:bg-muted dark:text-muted-foreground';
  return 'bg-slate-100 text-slate-600 dark:bg-muted dark:text-muted-foreground';
}

export default function PatientBookingsPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['patient', 'bookings', 'me'],
    queryFn: bookingsApi.my,
    staleTime: 10_000,
  });

  const selectedRow = useMemo(() => (data ?? []).find((x) => x.id === selectedId) ?? null, [data, selectedId]);

  const { data: detail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['patient', 'booking', 'detail', selectedId],
    queryFn: () => bookingsApi.detail(selectedId as string),
    enabled: Boolean(selectedId),
    staleTime: 10_000,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.cancel(id, cancelReason),
    onSuccess: async () => {
      toast.show({ variant: 'success', title: 'Đã huỷ lịch', message: 'Lịch hẹn đã được huỷ.' });
      setCancelId(null);
      setCancelReason('');
      setSelectedId(null);
      await qc.invalidateQueries({ queryKey: ['patient', 'bookings', 'me'] });
    },
    onError: (e: unknown) => {
      toast.show({
        variant: 'error',
        title: 'Huỷ lịch thất bại',
        message: e instanceof Error ? e.message : 'Không thể huỷ lịch. Vui lòng thử lại.',
      });
    },
  });

  useEffect(() => {
    if (!selectedId && !cancelId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedId(null);
        setCancelId(null);
        setCancelReason('');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, cancelId]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-foreground">Lịch hẹn của tôi</h2>
        <p className="text-sm text-muted-foreground">Theo dõi lịch hẹn và trạng thái xử lý.</p>
      </header>

      {isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(error as Error).message}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-12 border-b border-border bg-muted px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          <div className="col-span-3">Mã</div>
          <div className="col-span-3">Bác sĩ</div>
          <div className="col-span-3">Chuyên khoa</div>
          <div className="col-span-2">Thời gian</div>
          <div className="col-span-1 text-right">Trạng thái</div>
        </div>

        {isLoading ? (
          <div className="p-5 text-sm text-muted-foreground">Đang tải…</div>
        ) : data && data.length > 0 ? (
          <div className="divide-y divide-border">
            {data.map((b) => (
              <button
                className="grid w-full grid-cols-12 gap-2 px-5 py-4 text-left text-sm transition-colors hover:bg-muted"
                key={b.id}
                type="button"
                onClick={() => setSelectedId(b.id)}
              >
                <div className="col-span-3">
                  <p className="font-bold text-foreground">{b.bookingCode}</p>
                  <p className="text-xs text-muted-foreground">
                    Tạo lúc {new Date(b.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="col-span-3">
                  <p className="font-semibold text-foreground">{b.doctorName}</p>
                </div>
                <div className="col-span-3">
                  <p className="font-semibold text-foreground">{b.specialtyName}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-semibold text-foreground">
                    {new Date(b.appointmentStartAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit' })}{' '}
                    {new Date(b.appointmentStartAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    đến {new Date(b.appointmentEndAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="col-span-1 flex items-start justify-end">
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-bold ${statusBadgeClass(b.status)}`}
                  >
                    {b.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-5 text-sm text-muted-foreground">Chưa có lịch hẹn nào.</div>
        )}
      </div>

      {/* Detail modal */}
      {selectedId && selectedRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
          <button
            className="absolute inset-0 bg-black/40"
            type="button"
            aria-label="Đóng"
            onClick={() => setSelectedId(null)}
          />
          <div className="relative w-full max-w-2xl rounded-xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Chi tiết lịch hẹn</p>
                <h3 className="mt-1 text-lg font-bold text-foreground">{selectedRow.bookingCode}</h3>
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
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bác sĩ</div>
                <div className="mt-1 font-semibold text-foreground">{selectedRow.doctorName}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Chuyên khoa</div>
                <div className="mt-1 font-semibold text-foreground">{selectedRow.specialtyName}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Thời gian</div>
                <div className="mt-1 font-semibold text-foreground">
                  {new Date(selectedRow.appointmentStartAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit' })}{' '}
                  {new Date(selectedRow.appointmentStartAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{' '}
                  - {new Date(selectedRow.appointmentEndAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Trạng thái</div>
                <div className="mt-1">
                  <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${statusBadgeClass(selectedRow.status)}`}>
                    {selectedRow.status}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Phí khám</div>
                <div className="mt-1 font-semibold text-foreground">{Number(selectedRow.consultationFee).toLocaleString()}₫</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tổng phí</div>
                <div className="mt-1 font-semibold text-foreground">{Number(selectedRow.totalFee).toLocaleString()}₫</div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {isLoadingDetail ? (
                <div className="text-sm text-muted-foreground">Đang tải chi tiết…</div>
              ) : detail ? (
                <>
                  {detail.patientNote ? (
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ghi chú của bạn</div>
                      <div className="mt-1 text-sm text-foreground">{detail.patientNote}</div>
                    </div>
                  ) : null}
                  {detail.doctorNote ? (
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ghi chú của bác sĩ</div>
                      <div className="mt-1 text-sm text-foreground">{detail.doctorNote}</div>
                    </div>
                  ) : null}
                  {detail.rejectionReason ? (
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lý do từ chối</div>
                      <div className="mt-1 text-sm text-destructive">{detail.rejectionReason}</div>
                    </div>
                  ) : null}
                  {detail.cancelReason ? (
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lý do huỷ</div>
                      <div className="mt-1 text-sm text-foreground">{detail.cancelReason}</div>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                type="button"
                onClick={() => setSelectedId(null)}
              >
                Đóng
              </button>
              {selectedRow.status === 'pending' ? (
                <button
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-muted"
                  type="button"
                  onClick={() => setCancelId(selectedRow.id)}
                >
                  Huỷ lịch hẹn
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Cancel confirm modal */}
      {cancelId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
          <button
            className="absolute inset-0 bg-black/40"
            type="button"
            aria-label="Đóng"
            onClick={() => {
              setCancelId(null);
              setCancelReason('');
            }}
          />
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Xác nhận</p>
                <h4 className="mt-1 text-lg font-bold text-foreground">Bạn có chắc muốn huỷ lịch hẹn?</h4>
                <p className="mt-1 text-sm text-muted-foreground">Bạn có thể nhập lý do (tuỳ chọn).</p>
              </div>
              <button
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                type="button"
                onClick={() => {
                  setCancelId(null);
                  setCancelReason('');
                }}
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-semibold text-foreground" htmlFor="cancelReason">
                Lý do huỷ (tuỳ chọn)
              </label>
              <textarea
                id="cancelReason"
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ví dụ: Bận đột xuất, muốn đổi giờ…"
              />
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                type="button"
                disabled={cancelMutation.isPending}
                onClick={() => {
                  setCancelId(null);
                  setCancelReason('');
                }}
              >
                Không huỷ
              </button>
              <button
                className="inline-flex items-center justify-center rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate(cancelId)}
              >
                {cancelMutation.isPending ? 'Đang huỷ…' : 'Xác nhận huỷ'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

