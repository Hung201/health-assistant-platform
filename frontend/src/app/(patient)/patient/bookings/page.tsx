'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import {
  Calendar, User as UserIcon, Clock, CircleDollarSign, CheckCircle2,
  FileText, AlertCircle, Trash2, X, Wallet, ExternalLink, CalendarPlus,
} from 'lucide-react';

import { bookingsApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

function statusBadgeClass(status: string) {
  if (status === 'pending') return 'bg-amber-100 text-amber-700 border border-amber-200';
  if (status === 'approved') return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  if (status === 'rejected') return 'bg-red-100 text-red-700 border border-red-200';
  if (status === 'cancelled') return 'bg-slate-100 text-slate-600 border border-slate-200';
  return 'bg-slate-100 text-slate-600 border border-slate-200';
}
function statusBadgeText(status: string) {
  if (status === 'pending') return 'Đang xử lý';
  if (status === 'approved') return 'Đã xác nhận';
  if (status === 'rejected') return 'Bị từ chối';
  if (status === 'cancelled') return 'Đã huỷ';
  return status;
}
function paymentStatusText(row: { paymentStatus: string; paymentMethod: string }) {
  if (row.paymentMethod === 'pay_at_clinic') return 'Thanh toán tại viện';
  if (row.paymentStatus === 'paid') return 'Đã thanh toán MoMo';
  if (row.paymentStatus === 'awaiting_gateway') return 'Chờ thanh toán MoMo';
  if (row.paymentStatus === 'failed') return 'Thanh toán thất bại';
  return 'Chưa thanh toán';
}
function paymentBadgeClass(row: { paymentStatus: string; paymentMethod: string }) {
  if (row.paymentMethod === 'pay_at_clinic') return 'bg-blue-50 text-blue-700 border border-blue-200';
  if (row.paymentStatus === 'paid') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (row.paymentStatus === 'awaiting_gateway') return 'bg-amber-50 text-amber-700 border border-amber-200';
  if (row.paymentStatus === 'failed') return 'bg-red-50 text-red-700 border border-red-200';
  return 'bg-slate-100 text-slate-600 border border-slate-200';
}

type TabKey = 'all' | 'upcoming' | 'done' | 'cancelled';

const STATUS_COLOR: Record<string, string> = {
  pending: '#F59E0B', approved: '#0D9E75', completed: '#3B82F6',
  cancelled: '#EF4444', rejected: '#EF4444',
};

export default function PatientBookingsPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('all');

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

  const { data: paymentInfo, isLoading: isLoadingPaymentInfo } = useQuery({
    queryKey: ['patient', 'booking', 'payment', selectedId],
    queryFn: () => bookingsApi.paymentInfo(selectedId as string),
    enabled: Boolean(selectedId),
    staleTime: 5_000,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.cancel(id, cancelReason),
    onSuccess: async () => {
      toast.show({ variant: 'success', title: 'Đã huỷ lịch', message: 'Lịch hẹn đã được huỷ.' });
      setCancelId(null); setCancelReason(''); setSelectedId(null);
      await qc.invalidateQueries({ queryKey: ['patient', 'bookings', 'me'] });
    },
    onError: (e: unknown) => {
      toast.show({ variant: 'error', title: 'Huỷ lịch thất bại', message: e instanceof Error ? e.message : 'Không thể huỷ lịch.' });
    },
  });

  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => {
    if (!selectedId && !cancelId) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSelectedId(null); setCancelId(null); setCancelReason(''); } };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, cancelId]);

  const tabCounts = useMemo(() => {
    const all = data ?? [];
    return {
      all: all.length,
      upcoming: all.filter((b) => b.status === 'pending' || b.status === 'approved').length,
      done: all.filter((b) => b.status === 'completed').length,
      cancelled: all.filter((b) => b.status === 'cancelled' || b.status === 'rejected').length,
    };
  }, [data]);

  const filteredData = useMemo(() => {
    const all = data ?? [];
    if (activeTab === 'upcoming') return all.filter((b) => b.status === 'pending' || b.status === 'approved');
    if (activeTab === 'done') return all.filter((b) => b.status === 'completed');
    if (activeTab === 'cancelled') return all.filter((b) => b.status === 'cancelled' || b.status === 'rejected');
    return all;
  }, [data, activeTab]);

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'upcoming', label: 'Sắp tới' },
    { key: 'done', label: 'Đã khám' },
    { key: 'cancelled', label: 'Đã hủy' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-all',
              activeTab === tab.key
                ? 'bg-[#0D9E75] text-white shadow-sm'
                : 'border border-[#E8EDF2] bg-white text-[#64748B] hover:border-[#0D9E75] hover:text-[#0D9E75]',
            )}
          >
            {tab.label}
            <span className={cn('rounded-full px-1.5 py-0.5 text-[11px] font-bold', activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500')}>
              {tabCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {isError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="shrink-0 text-red-600" />
          <p className="text-sm font-medium text-red-800">{(error as Error).message}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-[20px] border border-[#E8EDF2] bg-white shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#0D9E75] border-r-transparent" />
            <p className="text-sm font-medium">Đang tải danh sách lịch hẹn...</p>
          </div>
        ) : filteredData.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredData.map((b) => (
              <button
                key={b.id}
                className="group flex w-full flex-col gap-4 p-5 text-left transition-colors hover:bg-[#0D9E75]/5 md:flex-row md:items-center md:justify-between"
                type="button"
                onClick={() => setSelectedId(b.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 h-10 w-1 shrink-0 rounded-full" style={{ background: STATUS_COLOR[b.status] ?? '#94A3B8' }} />
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors group-hover:bg-[#0D9E75]/10 group-hover:text-[#0D9E75]">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="font-bold text-[#1a3353] transition-colors group-hover:text-[#0D9E75]">{b.doctorName}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{b.specialtyName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[13px] text-slate-500">
                      <Clock size={13} />
                      {new Date(b.appointmentStartAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      {' — '}
                      {new Date(b.appointmentStartAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </div>
                    <p className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-slate-300">Mã: {b.bookingCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pl-[52px] md:flex-col md:items-end md:pl-0">
                  <span className={cn('rounded-full px-3 py-1 text-xs font-bold shadow-sm', statusBadgeClass(b.status))}>{statusBadgeText(b.status)}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{paymentStatusText(b)}</span>
                  <span className="text-sm font-semibold text-slate-300 transition-colors group-hover:text-[#0D9E75]">Chi tiết →</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* ── EMPTY STATE ── */
          <div className="flex flex-col items-center px-8 py-20 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#0D9E75]/10">
              <Calendar size={48} className="text-[#0D9E75]" />
            </div>
            <h3 className="mb-3 text-[18px] font-bold text-[#1a3353]">Chưa có lịch hẹn nào</h3>
            <p className="mb-8 max-w-[280px] text-[14px] leading-relaxed text-[#64748B]">
              Bạn chưa đặt lịch hẹn khám nào trên hệ thống. Đặt lịch ngay để được chăm sóc sức khoẻ tốt nhất.
            </p>
            <a
              href="/patient/doctors"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(13,158,117,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(13,158,117,0.35)] active:scale-[.97]"
              style={{ background: 'linear-gradient(135deg, #0D9E75, #0B8A65)' }}
            >
              <CalendarPlus size={18} />
              Đặt lịch ngay
            </a>
          </div>
        )}
      </div>

      {/* ── Detail modal ── */}
      {isMounted && selectedId && selectedRow
        ? createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6" aria-modal="true" role="dialog">
            <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px]" onClick={() => setSelectedId(null)} />
            <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/50 p-6 sm:p-8">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider', statusBadgeClass(selectedRow.status))}>
                      {statusBadgeText(selectedRow.status)}
                    </span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-[#1a3353]">Chi tiết lịch hẹn</h3>
                  <p className="mt-1 text-sm text-slate-400">Mã: {selectedRow.bookingCode}</p>
                </div>
                <button className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-100" onClick={() => setSelectedId(null)}>
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto p-6 sm:p-8">
                <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#0D9E75]/20 bg-[#0D9E75]/10 text-[#0D9E75]">
                    <UserIcon size={24} />
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Bác sĩ phụ trách</p>
                    <p className="text-lg font-extrabold text-[#1a3353]">{selectedRow.doctorName}</p>
                    <p className="text-sm font-medium text-[#0D9E75]">{selectedRow.specialtyName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <div className="mb-3 flex items-center gap-2 text-slate-500">
                      <Clock size={18} className="text-blue-500" />
                      <span className="text-[11px] font-bold uppercase tracking-widest">Thời gian khám</span>
                    </div>
                    <p className="mb-1 text-lg font-extrabold text-slate-800">
                      {new Date(selectedRow.appointmentStartAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(selectedRow.appointmentEndAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(selectedRow.appointmentStartAt).toLocaleString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <div className="mb-3 flex items-center gap-2 text-slate-500">
                      <CircleDollarSign size={18} className="text-emerald-500" />
                      <span className="text-[11px] font-bold uppercase tracking-widest">Chi phí</span>
                    </div>
                    <div className="mb-2 flex items-baseline justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs text-slate-500">Phí khám</span>
                      <span className="text-sm font-bold text-slate-700">{Number(selectedRow.consultationFee).toLocaleString()} ₫</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-bold text-slate-800">Tổng cộng</span>
                      <span className="text-lg font-extrabold text-emerald-600">{Number(selectedRow.totalFee).toLocaleString()} ₫</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                        <Wallet size={14} /> Thanh toán
                      </h4>
                      <p className="mt-2 text-sm text-slate-600">
                        {isLoadingPaymentInfo ? 'Đang kiểm tra…' : paymentInfo?.message ?? '—'}
                      </p>
                    </div>
                    <span className={cn('rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider', paymentBadgeClass(selectedRow))}>
                      {paymentStatusText(selectedRow)}
                    </span>
                  </div>
                  {paymentInfo?.payUrl && (
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <a
                        href={paymentInfo.payUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={cn('inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors', paymentInfo.canPayNow ? 'bg-[#ae2070] hover:bg-[#961b61]' : 'pointer-events-none bg-slate-400')}
                      >
                        Mở MoMo để thanh toán <ExternalLink size={16} />
                      </a>
                      <button
                        type="button"
                        onClick={() => { navigator.clipboard?.writeText(paymentInfo.payUrl ?? ''); toast.show({ variant: 'info', title: 'Đã copy', message: 'Đã sao chép liên kết thanh toán.' }); }}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Sao chép link thanh toán
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {isLoadingDetail ? (
                    <div className="flex items-center justify-center p-6 text-sm text-slate-400">
                      <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-[#0D9E75] border-r-transparent" />
                      Đang tải thông tin chi tiết…
                    </div>
                  ) : detail ? (
                    <>
                      {detail.patientNote && (
                        <div>
                          <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400"><FileText size={14} /> Ghi chú của bạn</h4>
                          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700 shadow-sm">{detail.patientNote}</div>
                        </div>
                      )}
                      {detail.doctorNote && (
                        <div>
                          <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#0D9E75]"><CheckCircle2 size={14} /> Phản hồi từ Bác sĩ</h4>
                          <div className="rounded-xl border border-[#0D9E75]/20 bg-[#0D9E75]/5 p-4 text-sm font-semibold leading-relaxed text-[#065F46] shadow-sm">{detail.doctorNote}</div>
                        </div>
                      )}
                      {detail.rejectionReason && (
                        <div>
                          <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-500"><AlertCircle size={14} /> Lý do từ chối</h4>
                          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold leading-relaxed text-red-700 shadow-sm">{detail.rejectionReason}</div>
                        </div>
                      )}
                      {detail.cancelReason && (
                        <div>
                          <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400"><AlertCircle size={14} /> Lý do huỷ</h4>
                          <div className="rounded-xl border border-slate-200 bg-slate-100 p-4 text-sm leading-relaxed text-slate-600 shadow-sm">{detail.cancelReason}</div>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-white p-6 sm:flex-row sm:justify-end sm:p-8">
                <button className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 sm:w-auto" type="button" onClick={() => setSelectedId(null)}>Đóng</button>
                {selectedRow.status === 'pending' && (
                  <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-6 py-3 text-sm font-bold text-red-600 shadow-sm transition-all hover:bg-red-100 sm:w-auto" type="button" onClick={() => setCancelId(selectedRow.id)}>
                    <Trash2 size={16} /> Huỷ lịch hẹn
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
        : null}

      {/* ── Cancel confirm modal ── */}
      {isMounted && cancelId
        ? createPortal(
          <div className="fixed inset-0 z-[1010] flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px]" onClick={() => { setCancelId(null); setCancelReason(''); }} />
            <div className="relative w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertCircle size={32} />
              </div>
              <h4 className="mb-2 text-center text-2xl font-extrabold text-slate-900">Bạn chắc chắn muốn huỷ?</h4>
              <p className="mb-8 text-center text-sm text-slate-500">Lịch hẹn sẽ bị huỷ bỏ và không thể khôi phục.</p>
              <div className="mb-8">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="cancelReason">Lý do huỷ (Tuỳ chọn)</label>
                <textarea
                  id="cancelReason"
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ví dụ: Bận việc đột xuất, muốn đổi lịch..."
                />
              </div>
              <div className="flex flex-col gap-3">
                <button className="flex w-full items-center justify-center rounded-xl bg-red-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700 disabled:opacity-60" type="button" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate(cancelId)}>
                  {cancelMutation.isPending ? 'Đang xử lý…' : 'Xác nhận huỷ lịch'}
                </button>
                <button className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-60" type="button" disabled={cancelMutation.isPending} onClick={() => { setCancelId(null); setCancelReason(''); }}>
                  Quay lại
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
        : null}
    </div>
  );
}
