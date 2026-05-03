'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import {
  Calendar,
  User as UserIcon,
  Clock,
  CircleDollarSign,
  CheckCircle2,
  FileText,
  AlertCircle,
  Trash2,
  X,
  Wallet,
  ExternalLink,
  Star,
} from 'lucide-react';

import { bookingsApi, doctorsApi } from '@/lib/api';
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
  const { paymentStatus, paymentMethod } = row;
  if (paymentMethod === 'pay_at_clinic') {
    if (paymentStatus === 'pay_at_clinic') return 'Thanh toán tại viện';
    return paymentStatus;
  }
  if (paymentStatus === 'paid') return 'Đã thanh toán MoMo';
  if (paymentStatus === 'awaiting_gateway') return 'Chờ thanh toán MoMo';
  if (paymentStatus === 'failed') return 'Thanh toán thất bại';
  return 'Chưa thanh toán';
}

function paymentBadgeClass(row: { paymentStatus: string; paymentMethod: string }) {
  if (row.paymentMethod === 'pay_at_clinic') {
    return 'bg-blue-50 text-blue-700 border border-blue-200';
  }
  if (row.paymentStatus === 'paid') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (row.paymentStatus === 'awaiting_gateway') return 'bg-amber-50 text-amber-700 border border-amber-200';
  if (row.paymentStatus === 'failed') return 'bg-red-50 text-red-700 border border-red-200';
  return 'bg-slate-100 text-slate-600 border border-slate-200';
}

export default function PatientBookingsPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewAnonymous, setReviewAnonymous] = useState(false);
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Record<string, true>>({});

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
  const reviewMutation = useMutation({
    mutationFn: (payload: { doctorUserId: string; bookingId: string; rating: number; comment?: string; isAnonymous?: boolean }) =>
      doctorsApi.createReview(payload.doctorUserId, {
        bookingId: payload.bookingId,
        rating: payload.rating,
        comment: payload.comment,
        isAnonymous: payload.isAnonymous,
      }),
    onSuccess: async (_, payload) => {
      toast.show({ variant: 'success', title: 'Đã gửi đánh giá', message: 'Cảm ơn bạn đã phản hồi về bác sĩ.' });
      setReviewedBookingIds((prev) => ({ ...prev, [payload.bookingId]: true }));
      setReviewBookingId(null);
      setReviewRating(5);
      setReviewComment('');
      setReviewAnonymous(false);
      await qc.invalidateQueries({ queryKey: ['patient', 'bookings', 'me'] });
      await qc.invalidateQueries({ queryKey: ['public', 'doctor', payload.doctorUserId] });
      await qc.invalidateQueries({ queryKey: ['patient', 'doctor-reviews', payload.doctorUserId] });
      await qc.invalidateQueries({ queryKey: ['public-doctor-reviews', payload.doctorUserId] });
      await qc.invalidateQueries({ queryKey: ['public-doctor', payload.doctorUserId] });
      await qc.invalidateQueries({ queryKey: ['public-doctors'] });
    },
    onError: (e: unknown) => {
      const message = e instanceof Error ? e.message : 'Không thể gửi đánh giá. Vui lòng thử lại.';
      if (message.toLowerCase().includes('đã được đánh giá') || message.toLowerCase().includes('da duoc danh gia')) {
        if (selectedRow) {
          setReviewedBookingIds((prev) => ({ ...prev, [selectedRow.id]: true }));
        }
        setReviewBookingId(null);
      }
      toast.show({
        variant: 'error',
        title: 'Gửi đánh giá thất bại',
        message,
      });
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!selectedId && !cancelId && !reviewBookingId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedId(null);
        setCancelId(null);
        setReviewBookingId(null);
        setCancelReason('');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, cancelId, reviewBookingId]);

  const canReviewSelected =
    selectedRow &&
    !reviewedBookingIds[selectedRow.id] &&
    (selectedRow.status === 'completed' ||
      (selectedRow.status === 'approved' && new Date(selectedRow.appointmentEndAt).getTime() <= Date.now()));

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-[#003f87]">Lịch hẹn của tôi</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Quản lý và theo dõi trạng thái các lịch khám bệnh.</p>
        </div>
      </header>

      {isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600" />
          <div className="text-sm font-medium text-red-800">
            {(error as Error).message}
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
             <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#003f87] border-r-transparent mb-4"></div>
             <p className="font-medium">Đang tải danh sách lịch hẹn...</p>
          </div>
        ) : data && data.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {data.map((b) => (
              <button
                className="group flex flex-col md:flex-row w-full text-left gap-4 md:items-center justify-between p-6 hover:bg-teal-50/50 transition-colors"
                key={b.id}
                type="button"
                onClick={() => setSelectedId(b.id)}
              >
                 <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-teal-100 group-hover:text-teal-700 transition-colors">
                       <Calendar size={20} />
                    </div>
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                         <span className="font-extrabold text-slate-900 group-hover:text-[#003f87] transition-colors">{b.doctorName}</span>
                         <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">{b.specialtyName}</span>
                       </div>
                       <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                          <span className="flex items-center gap-1.5"><Clock size={14}/> 
                            {new Date(b.appointmentStartAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} 
                            {' - '}
                            {new Date(b.appointmentStartAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                       </div>
                       <div className="mt-1 text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                          Mã: {b.bookingCode}
                       </div>
                    </div>
                 </div>
                 
                 <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 pl-16 md:pl-0">
                    <div className="flex flex-col items-end gap-1">
                      <span className={cn('px-3 py-1 text-xs font-bold rounded-full shadow-sm', statusBadgeClass(b.status))}>
                        {statusBadgeText(b.status)}
                      </span>
                      <span className="max-w-[200px] text-right text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        {paymentStatusText(b)}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-400 group-hover:text-teal-600 transition-colors flex items-center gap-1">
                       Chi tiết <span className="font-sans">→</span>
                    </span>
                 </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center bg-slate-50">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100 text-slate-300">
               <Calendar size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">Chưa có lịch hẹn nào</h3>
            <p className="text-sm text-slate-500 mb-6">Bạn chưa đặt lịch hẹn khám nào trên hệ thống.</p>
            <a href="/patient/doctors" className="inline-flex items-center justify-center rounded-xl bg-[#003f87] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#003f87]/20 transition-all hover:-translate-y-0.5 hover:bg-[#002b5e]">
              Đặt lịch ngay
            </a>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {isMounted && selectedId && selectedRow
        ? createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6" aria-modal="true" role="dialog">
            <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px] transition-opacity" onClick={() => setSelectedId(null)} />
            <div className="relative w-full max-w-2xl rounded-[2rem] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 sm:p-8 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div>
                <div className="inline-flex items-center gap-2 mb-2">
                   <span className={cn('px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider', statusBadgeClass(selectedRow.status))}>
                     {statusBadgeText(selectedRow.status)}
                   </span>
                </div>
                <h3 className="text-2xl font-extrabold text-[#003f87]">Chi tiết lịch hẹn</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">Mã: {selectedRow.bookingCode}</p>
              </div>
              <button
                className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm"
                onClick={() => setSelectedId(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
               {/* Doctor Info Card */}
               <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                     <UserIcon size={24} />
                  </div>
                  <div>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Bác sĩ phụ trách</p>
                     <p className="font-extrabold text-slate-900 text-lg">{selectedRow.doctorName}</p>
                     <p className="text-sm font-medium text-teal-600">{selectedRow.specialtyName}</p>
                  </div>
               </div>

               {/* Time & Price Grid */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                     <div className="flex items-center gap-2 text-slate-500 mb-3">
                        <Clock size={18} className="text-blue-500"/>
                        <span className="text-[11px] font-bold uppercase tracking-widest">Thời gian khám</span>
                     </div>
                     <p className="font-extrabold text-slate-800 text-lg mb-1">
                       {new Date(selectedRow.appointmentStartAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedRow.appointmentEndAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                     </p>
                     <p className="text-sm font-medium text-slate-500">
                       {new Date(selectedRow.appointmentStartAt).toLocaleString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                     </p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                     <div className="flex items-center gap-2 text-slate-500 mb-3">
                        <CircleDollarSign size={18} className="text-emerald-500"/>
                        <span className="text-[11px] font-bold uppercase tracking-widest">Chi phí</span>
                     </div>
                     <div className="flex justify-between items-baseline mb-2 border-b border-slate-200 pb-2">
                        <span className="text-xs font-semibold text-slate-500">Phí khám</span>
                        <span className="text-sm font-bold text-slate-700">{Number(selectedRow.consultationFee).toLocaleString()} ₫</span>
                     </div>
                     <div className="flex justify-between items-baseline">
                        <span className="text-sm font-bold text-slate-800">Tổng cộng</span>
                        <span className="text-lg font-extrabold text-emerald-600">{Number(selectedRow.totalFee).toLocaleString()} ₫</span>
                     </div>
                  </div>
               </div>

               {/* Payment Center */}
               <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                 <div className="flex items-start justify-between gap-3">
                   <div>
                     <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                       <Wallet size={14} />
                       Thanh toán
                     </h4>
                     <p className="mt-2 text-sm font-medium text-slate-600">
                       {isLoadingPaymentInfo ? 'Đang kiểm tra trạng thái thanh toán…' : paymentInfo?.message ?? '—'}
                     </p>
                   </div>
                   <span
                     className={cn(
                       'rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider',
                       paymentBadgeClass(selectedRow),
                     )}
                   >
                     {paymentStatusText(selectedRow)}
                   </span>
                 </div>

                 <div className="mt-4 grid gap-2 sm:grid-cols-3">
                   <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                     <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bước 1</div>
                     <div className="mt-1 text-xs font-semibold text-slate-700">Đặt lịch</div>
                   </div>
                   <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                     <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bước 2</div>
                     <div className="mt-1 text-xs font-semibold text-slate-700">Bác sĩ xác nhận</div>
                   </div>
                   <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                     <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bước 3</div>
                     <div className="mt-1 text-xs font-semibold text-slate-700">Thanh toán hoàn tất</div>
                   </div>
                 </div>

                 {paymentInfo?.payUrl ? (
                   <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                     <a
                       href={paymentInfo.payUrl}
                       target="_blank"
                       rel="noreferrer"
                       className={cn(
                         'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors',
                         paymentInfo.canPayNow ? 'bg-[#ae2070] hover:bg-[#961b61]' : 'bg-slate-400 pointer-events-none',
                       )}
                     >
                       Mở MoMo để thanh toán <ExternalLink size={16} />
                     </a>
                     <button
                       type="button"
                       onClick={() => {
                         navigator.clipboard?.writeText(paymentInfo.payUrl ?? '');
                         toast.show({ variant: 'info', title: 'Đã copy', message: 'Đã sao chép liên kết thanh toán.' });
                       }}
                       className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                     >
                       Sao chép link thanh toán
                     </button>
                   </div>
                 ) : null}
               </div>

               {/* Additional Details */}
               <div className="space-y-4">
                 {isLoadingDetail ? (
                   <div className="flex items-center justify-center p-6 text-sm text-slate-500 font-medium">
                      <div className="w-5 h-5 border-2 border-teal-600 border-r-transparent rounded-full animate-spin mr-3"></div>
                      Đang tải thông tin chi tiết…
                   </div>
                 ) : detail ? (
                   <>
                     {detail.patientNote ? (
                       <div>
                         <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                            <FileText size={14} /> Ghi chú của bạn
                         </h4>
                         <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm font-medium text-slate-700 shadow-sm leading-relaxed">
                           {detail.patientNote}
                         </div>
                       </div>
                     ) : null}
                     {detail.doctorNote ? (
                       <div>
                         <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-600 mb-2">
                            <CheckCircle2 size={14} /> Phản hồi từ Bác sĩ
                         </h4>
                         <div className="bg-teal-50 rounded-xl border border-teal-100 p-4 text-sm font-semibold text-teal-800 shadow-sm leading-relaxed">
                           {detail.doctorNote}
                         </div>
                       </div>
                     ) : null}
                     {detail.rejectionReason ? (
                       <div>
                         <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-500 mb-2">
                            <AlertCircle size={14} /> Lý do từ chối
                         </h4>
                         <div className="bg-red-50 rounded-xl border border-red-100 p-4 text-sm font-semibold text-red-700 shadow-sm leading-relaxed">
                           {detail.rejectionReason}
                         </div>
                       </div>
                     ) : null}
                     {detail.cancelReason ? (
                       <div>
                         <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                            <AlertCircle size={14} /> Lý do huỷ
                         </h4>
                         <div className="bg-slate-100 rounded-xl border border-slate-200 p-4 text-sm font-medium text-slate-600 shadow-sm leading-relaxed">
                           {detail.cancelReason}
                         </div>
                       </div>
                     ) : null}
                   </>
                 ) : null}
               </div>
            </div>

            <div className="p-6 sm:p-8 border-t border-slate-100 bg-white flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
                type="button"
                onClick={() => setSelectedId(null)}
              >
                Đóng
              </button>
              {selectedRow.status === 'pending' ? (
                <button
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-6 py-3 text-sm font-bold text-red-600 hover:bg-red-100 hover:text-red-700 shadow-sm transition-all"
                  type="button"
                  onClick={() => setCancelId(selectedRow.id)}
                >
                  <Trash2 size={16} />
                  Huỷ lịch hẹn
                </button>
              ) : null}
              {canReviewSelected ? (
                <button
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-6 py-3 text-sm font-bold text-amber-700 hover:bg-amber-100 shadow-sm transition-all"
                  type="button"
                  onClick={() => setReviewBookingId(selectedRow.id)}
                >
                  <Star size={16} />
                  Đánh giá bác sĩ
                </button>
              ) : null}
              {selectedRow && reviewedBookingIds[selectedRow.id] ? (
                <span className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-bold text-emerald-700">
                  Đã đánh giá
                </span>
              ) : null}
            </div>
            </div>
          </div>,
          document.body,
        )
        : null}

      {/* Cancel confirm modal */}
      {isMounted && cancelId
        ? createPortal(
          <div className="fixed inset-0 z-[1010] flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px]" onClick={() => { setCancelId(null); setCancelReason(''); }} />
            <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl p-8">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-6">
               <AlertCircle size={32} />
            </div>
            
            <h4 className="text-2xl font-extrabold text-center text-slate-900 mb-2">Bạn chắc chắn muốn huỷ?</h4>
            <p className="text-sm font-medium text-center text-slate-500 mb-8">
              Lịch hẹn sẽ bị huỷ bỏ và không thể khôi phục. Bạn có thể cho chúng tôi biết lý do để cải thiện dịch vụ.
            </p>

            <div className="mb-8">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="cancelReason">
                Lý do huỷ (Tuỳ chọn)
              </label>
              <textarea
                id="cancelReason"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100 placeholder:text-slate-400 resize-none"
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ví dụ: Bận việc đột xuất, muốn đổi lịch..."
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                className="w-full flex items-center justify-center rounded-xl bg-red-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700 disabled:opacity-60 disabled:shadow-none"
                type="button"
                disabled={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate(cancelId)}
              >
                {cancelMutation.isPending ? 'Đang xử lý…' : 'Xác nhận huỷ lịch'}
              </button>
              <button
                className="w-full flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-60"
                type="button"
                disabled={cancelMutation.isPending}
                onClick={() => { setCancelId(null); setCancelReason(''); }}
              >
                Quay lại
              </button>
            </div>
            </div>
          </div>,
          document.body,
        )
        : null}
      {isMounted && reviewBookingId && selectedRow
        ? createPortal(
          <div className="fixed inset-0 z-[1015] flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px]" onClick={() => setReviewBookingId(null)} />
            <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl p-8">
              <h4 className="text-2xl font-extrabold text-slate-900 mb-2">Đánh giá bác sĩ</h4>
              <p className="text-sm text-slate-500 mb-6">{selectedRow.doctorName}</p>
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Điểm đánh giá</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-sm font-bold',
                        reviewRating >= star ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-500',
                      )}
                    >
                      ★ {star}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-5">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="reviewComment">
                  Nhận xét
                </label>
                <textarea
                  id="reviewComment"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100 placeholder:text-slate-400 resize-none"
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                />
              </div>
              <label className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-600">
                <input type="checkbox" checked={reviewAnonymous} onChange={(e) => setReviewAnonymous(e.target.checked)} />
                Gửi ẩn danh
              </label>
              <div className="flex flex-col gap-3">
                <button
                  className="w-full flex items-center justify-center rounded-xl bg-amber-600 px-6 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-amber-700 disabled:opacity-60"
                  type="button"
                  disabled={reviewMutation.isPending}
                  onClick={() =>
                    reviewMutation.mutate({
                      doctorUserId: selectedRow.doctorUserId,
                      bookingId: selectedRow.id,
                      rating: reviewRating,
                      comment: reviewComment.trim() || undefined,
                      isAnonymous: reviewAnonymous,
                    })
                  }
                >
                  {reviewMutation.isPending ? 'Đang gửi…' : 'Gửi đánh giá'}
                </button>
                <button
                  className="w-full flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
                  type="button"
                  disabled={reviewMutation.isPending}
                  onClick={() => setReviewBookingId(null)}
                >
                  Đóng
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
