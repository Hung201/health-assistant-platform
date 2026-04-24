'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BadgeCheck, Calendar as CalendarIcon, ArrowLeft, ArrowRight, Wallet, CircleDotDashed, CheckCircle2, AlertTriangle, MapPin } from 'lucide-react';

import { bookingsApi, doctorsApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { fetchVnDistricts, fetchVnProvinces, fetchVnWards } from '@/lib/vn-location';

export default function PatientDoctorDetailPage() {
  const router = useRouter();
  const toast = useToast();
  const params = useParams<{ doctorUserId: string }>();
  const doctorUserId = params.doctorUserId;

  const [patientNote, setPatientNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'pay_at_clinic'>('momo');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const { data: doctor, isLoading: isLoadingDoctor, isError: isDoctorError, error: doctorError } = useQuery({
    queryKey: ['public', 'doctor', doctorUserId],
    queryFn: () => doctorsApi.detail(doctorUserId),
    staleTime: 30_000,
  });
  const { data: provinces = [] } = useQuery({
    queryKey: ['vn-location', 'provinces', 'patient-doctor-detail'],
    queryFn: fetchVnProvinces,
    staleTime: 24 * 60 * 60 * 1000,
  });
  const { data: districts = [] } = useQuery({
    queryKey: ['vn-location', 'districts', doctor?.provinceCode, 'patient-doctor-detail'],
    queryFn: () => fetchVnDistricts(doctor?.provinceCode ?? ''),
    enabled: Boolean(doctor?.provinceCode),
    staleTime: 24 * 60 * 60 * 1000,
  });
  const { data: wards = [] } = useQuery({
    queryKey: ['vn-location', 'wards', doctor?.districtCode, 'patient-doctor-detail'],
    queryFn: () => fetchVnWards(doctor?.districtCode ?? ''),
    enabled: Boolean(doctor?.districtCode),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const doctorSpecialty = useMemo(() => doctor?.specialties?.[0] ?? null, [doctor]);

  const { data: slots, isLoading: isLoadingSlots } = useQuery({
    queryKey: ['public', 'doctorSlots', doctorUserId],
    queryFn: () => doctorsApi.slots(doctorUserId),
    enabled: Boolean(doctorUserId),
    staleTime: 10_000,
  });

  const selectedSlotInfo = useMemo(
    () => (slots ?? []).find((s) => s.id === selectedSlot) ?? null,
    [slots, selectedSlot],
  );
  // Group slots by date
  const slotsByDate = useMemo(() => {
    if (!slots) return {};
    const grouped: Record<string, typeof slots> = {};
    slots.forEach(s => {
      const dateStr = s.slotDate; // e.g., '2024-04-12'
      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push(s);
    });
    return grouped;
  }, [slots]);

  const availableDates = Object.keys(slotsByDate).sort();

  // Auto-select first date when loaded
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  // Keep selected date valid when specialty filter changes.
  useEffect(() => {
    if (!selectedDate) return;
    if (!availableDates.includes(selectedDate)) {
      setSelectedDate(availableDates[0] ?? null);
    }
  }, [availableDates, selectedDate]);

  // Handle selected slot reset when date changes
  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate]);

  useEffect(() => {
    if (!isModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen]);

  const activeSlots = selectedDate ? slotsByDate[selectedDate] : [];
  const selectedSlotDateTime = selectedSlotInfo
    ? new Date(selectedSlotInfo.startAt).toLocaleString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;
  const selectedSlotSpecialtyLabel = selectedSlotInfo?.specialtyId
    ? doctorSpecialty?.name ?? `Chuyên khoa #${selectedSlotInfo.specialtyId}`
    : doctorSpecialty?.name ?? 'Chưa gắn chuyên khoa';
  const consultationFeeLabel = Number(doctor?.consultationFee ?? 0).toLocaleString('vi-VN');
  const selectedSlotTimeRange = selectedSlotInfo
    ? `${new Date(selectedSlotInfo.startAt).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })} - ${new Date(selectedSlotInfo.endAt).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : null;
  const selectedSlotRemaining = selectedSlotInfo ? selectedSlotInfo.maxBookings - selectedSlotInfo.bookedCount : null;
  const provinceName = provinces.find((p) => String(p.code) === doctor?.provinceCode)?.name ?? doctor?.provinceCode;
  const districtName = districts.find((d) => String(d.code) === doctor?.districtCode)?.name ?? doctor?.districtCode;
  const wardName = wards.find((w) => String(w.code) === doctor?.wardCode)?.name ?? doctor?.wardCode;
  const doctorAddress = [doctor?.workplaceAddress, wardName, districtName, provinceName].filter(Boolean).join(', ');

  const createBooking = useMutation({
    mutationFn: (availableSlotId: number) =>
      bookingsApi.create({
        availableSlotId,
        specialtyId: selectedSlotInfo?.specialtyId ?? undefined,
        patientNote: patientNote.trim() || undefined,
        paymentMethod,
      }),
    onSuccess: () => {
      toast.show({
        variant: 'success',
        title: 'Đặt lịch thành công',
        message: 'Yêu cầu của bạn đã được gửi. Vui lòng chờ bác sĩ duyệt lịch.',
      });
      router.push('/patient/bookings');
      router.refresh();
    },
    onError: (e: unknown) => {
      toast.show({
        variant: 'error',
        title: 'Đặt lịch thất bại',
        message: e instanceof Error ? e.message : 'Không thể gửi yêu cầu đặt lịch. Vui lòng thử lại.',
      });
    },
  });

  if (isDoctorError) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(doctorError as Error).message}
        </div>
        <Link className="text-sm font-semibold text-[#003f87] hover:underline" href="/patient/doctors">
          ← Quay lại danh sách bác sĩ
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <header className="flex items-center justify-between">
        <Link className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#003f87] transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100" href="/patient/doctors">
          <ArrowLeft size={16} /> Chi tiết Bác sĩ
        </Link>
      </header>

      {isLoadingDoctor ? (
        <div className="py-20 text-center text-slate-500">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#003f87] border-r-transparent mb-4"></div>
          <p>Đang tải thông tin bác sĩ...</p>
        </div>
      ) : doctor ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
          {/* Left Column */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-3xl shadow-lg shadow-slate-200/50 p-6 relative overflow-hidden flex flex-col border border-slate-100">
            <div className="absolute top-4 right-4 z-10">
              <span className="bg-[#b35e2b] text-white text-[9px] uppercase font-extrabold px-3 py-1.5 rounded-full shadow-sm tracking-wider">
                Bác sĩ Cấp cao
              </span>
            </div>

            <div className="flex flex-col items-center pt-6">
               <div className="w-32 h-32 rounded-[2rem] overflow-hidden bg-slate-100 shadow-inner mb-6 relative">
                 <img alt={doctor.fullName} src={doctor.avatarUrl || 'https://images.unsplash.com/photo-1612349317150-e410f624c427?q=80&w=2070&auto=format&fit=crop'} className="w-full h-full object-cover" />
               </div>
               
               <h2 className="text-[22px] font-extrabold text-[#003f87] text-center px-4 leading-tight mb-1.5">
                 {doctor.professionalTitle ? `${doctor.professionalTitle}. ` : ''}{doctor.fullName}
               </h2>
               
               <p className="text-[#0056b3] font-bold text-sm mb-8">
                 {doctor.specialties?.[0]?.name || 'Đa khoa'}
               </p>

               <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full mb-8">
                  <div className="bg-slate-50 rounded-2xl py-3 px-2 flex flex-col items-center justify-center text-center border border-slate-100">
                     <span className="font-extrabold text-[#003f87] text-lg leading-none mb-1.5">{doctor.yearsOfExperience || '15'}+</span>
                     <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Năm Kinh<br/>Nghiệm</span>
                  </div>
                  <div className="bg-slate-50 rounded-2xl py-3 px-2 flex flex-col items-center justify-center text-center border border-slate-100">
                     <span className="font-extrabold text-[#003f87] text-lg leading-none mb-1.5">2k+</span>
                     <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Bệnh<br/>Nhân</span>
                  </div>
                  <div className="bg-slate-50 rounded-2xl py-3 px-2 flex flex-col items-center justify-center text-center border border-slate-100">
                     <span className="font-extrabold text-[#003f87] text-lg leading-none mb-1.5">4.9</span>
                     <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Đánh<br/>Giá</span>
                  </div>
               </div>

               <div className="w-full text-left mb-8 flex-1">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3 text-sm">
                   <BadgeCheck size={18} className="text-[#003f87]" /> Giới thiệu
                 </h3>
                 <p className="text-sm text-slate-600 leading-relaxed">
                   {doctor.bio || '15 năm kinh nghiệm công tác tại BV Chợ Rẫy, chuyên gia đầu ngành trong điều trị các bệnh lý. Thành viên hiệp hội y khoa Việt Nam.'}
                 </p>
               </div>

               <div className="w-full text-left mb-8 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2 text-sm">
                   <MapPin size={16} className="text-[#003f87]" /> Địa điểm khám
                 </h3>
                 <p className="text-sm text-slate-600">
                   {doctorAddress || doctor.workplaceName || 'Địa chỉ đang cập nhật'}
                 </p>
                 {doctorAddress ? (
                   <a
                     href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(doctorAddress)}`}
                     target="_blank"
                     rel="noreferrer"
                     className="mt-2 inline-flex text-xs font-bold text-[#003f87] hover:text-[#0056b3] hover:underline"
                   >
                     Mở trên Google Maps
                   </a>
                 ) : null}
               </div>

               <div className="w-full bg-[#f4fcfb] rounded-2xl p-5 flex items-center justify-between border border-teal-50">
                 <div>
                   <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#0056b3] mb-1">Giá khám</p>
                   <p className="text-xl font-extrabold text-[#003f87]">
                     {Number(doctor.consultationFee).toLocaleString('vi-VN')}đ
                   </p>
                 </div>
                 <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-[#003f87]">
                   <Wallet size={20} />
                 </div>
               </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-3xl shadow-lg shadow-slate-200/50 p-6 sm:p-8 flex flex-col min-h-full border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-slate-100 pb-6">
               <div>
                 <h2 className="text-2xl font-extrabold text-[#003f87] mb-1.5">Đặt lịch hẹn</h2>
                 <p className="text-sm text-slate-500 font-medium">Chọn thời gian phù hợp nhất cho bạn</p>
               </div>
               <div className="flex items-center gap-2.5 bg-slate-50 px-4 py-2.5 rounded-xl text-slate-700 text-sm font-bold border border-slate-200 shadow-sm">
                 <CalendarIcon size={16} className="text-slate-500" />
                 {selectedDate ? `Tháng ${new Date(selectedDate).getMonth() + 1}, ${new Date(selectedDate).getFullYear()}` : 'Tháng --, ----'}
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              <div className="rounded-2xl border border-[#003f87]/15 bg-[#003f87]/5 px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest font-extrabold text-[#003f87] mb-1">Bước 1</p>
                <p className="text-sm font-bold text-[#003f87]">Chọn ngày khám</p>
              </div>
              <div className={`rounded-2xl border px-4 py-3 ${selectedDate ? 'border-teal-200 bg-teal-50' : 'border-slate-200 bg-slate-50'}`}>
                <p className={`text-[10px] uppercase tracking-widest font-extrabold mb-1 ${selectedDate ? 'text-teal-700' : 'text-slate-500'}`}>Bước 2</p>
                <p className={`text-sm font-bold ${selectedDate ? 'text-teal-700' : 'text-slate-600'}`}>Chọn khung giờ</p>
              </div>
              <div className={`rounded-2xl border px-4 py-3 ${selectedSlot ? 'border-teal-200 bg-teal-50' : 'border-slate-200 bg-slate-50'}`}>
                <p className={`text-[10px] uppercase tracking-widest font-extrabold mb-1 ${selectedSlot ? 'text-teal-700' : 'text-slate-500'}`}>Bước 3</p>
                <p className={`text-sm font-bold ${selectedSlot ? 'text-teal-700' : 'text-slate-600'}`}>Xác nhận lịch và thanh toán</p>
              </div>
            </div>

            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-800">Chọn ngày khám</h3>
              {availableDates.length > 0 ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                  {availableDates.length} ngày khả dụng
                </span>
              ) : null}
            </div>
            
            {isLoadingSlots ? (
              <div className="flex gap-2 overflow-hidden pb-4">
                 <div className="h-11 w-28 rounded-xl bg-slate-100 animate-pulse"></div>
                 <div className="h-11 w-28 rounded-xl bg-slate-100 animate-pulse"></div>
                 <div className="h-11 w-28 rounded-xl bg-slate-100 animate-pulse"></div>
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-4 snap-x hide-scrollbar">
                {availableDates.map(dateStr => {
                   const d = new Date(dateStr);
                   const dayOfWeek = d.toLocaleDateString('vi-VN', { weekday: 'short' }).replace('T', 'Thứ ');
                   const dayMonth = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                   const isSelected = selectedDate === dateStr;

                   return (
                     <button
                       key={dateStr}
                       onClick={() => setSelectedDate(dateStr)}
                       className={`snap-start shrink-0 min-w-[124px] rounded-xl border px-3 py-2 text-left transition-all ${
                         isSelected 
                           ? 'border-[#003f87] bg-[#003f87] text-white shadow-md shadow-[#003f87]/25'
                           : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                       }`}
                     >
                       <span className={`block text-[10px] font-bold uppercase tracking-wide ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                         {dayOfWeek}
                       </span>
                       <span className={`mt-0.5 block text-sm font-extrabold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                         {dayMonth}
                       </span>
                     </button>
                   )
                })}
                {availableDates.length === 0 && (
                  <div className="text-sm text-slate-500 py-5 bg-slate-50 w-full rounded-2xl text-center border border-slate-100">
                    <p className="font-bold mb-1">Bác sĩ hiện chưa có lịch khám trống.</p>
                    <p className="text-xs">Vui lòng quay lại sau hoặc chọn bác sĩ khác.</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-8 mb-4">
               <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-800">Khung giờ còn trống</h3>
               <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                 <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full border-2 border-slate-300"></div> Trống</span>
                 <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div> Đã đặt</span>
               </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 md:gap-4 mb-10">
              {activeSlots.map(slot => {
                 const isFull = slot.bookedCount >= slot.maxBookings;
                 const isSelected = selectedSlot === slot.id;
                 const timeRange = `${new Date(slot.startAt).toLocaleTimeString('vi-VN', {
                   hour: '2-digit',
                   minute: '2-digit',
                 })} - ${new Date(slot.endAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

                 if (isFull) {
                   return (
                     <div key={slot.id} className="py-3.5 px-2 rounded-2xl border border-slate-100 bg-slate-50 opacity-50 text-center flex justify-center items-center">
                       <span className="text-sm font-extrabold text-slate-400">{timeRange}</span>
                     </div>
                   );
                 }

                 return (
                   <button
                     key={slot.id}
                     onClick={() => setSelectedSlot(slot.id)}
                    className={`py-3 px-2 rounded-2xl font-extrabold text-sm transition-all text-center ${
                       isSelected
                         ? 'bg-[#003f87] text-white border-2 border-[#003f87] shadow-lg shadow-[#003f87]/20 scale-105'
                         : 'bg-white text-[#003f87] border-2 border-[#003f87]/10 hover:border-[#003f87]/50 hover:bg-[#f4fcfb]'
                     }`}
                   >
                    <span className="block">{timeRange}</span>
                    <span className={`mt-1 block text-[10px] font-bold ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                      Còn {slot.maxBookings - slot.bookedCount} chỗ
                    </span>
                   </button>
                 );
              })}
              {activeSlots.length === 0 && availableDates.length > 0 && (
                 <div className="col-span-full text-sm text-slate-500 py-6 text-center bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="font-bold mb-1">Không có khung giờ nào trống trong ngày này.</p>
                    <p className="text-xs">Hãy chọn ngày khác để tiếp tục.</p>
                 </div>
              )}
            </div>
            <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">Thông tin bạn đang chọn</p>
              {selectedSlotInfo ? (
                <div className="space-y-1 text-sm">
                  <p className="font-bold text-slate-800">{selectedSlotDateTime}</p>
                  <p className="text-slate-600">Chuyên khoa: <span className="font-semibold">{selectedSlotSpecialtyLabel}</span></p>
                  <p className="text-slate-600">Khung giờ: <span className="font-semibold">{selectedSlotTimeRange}</span></p>
                  <p className="text-slate-600">Số chỗ còn lại: <span className="font-semibold">{selectedSlotRemaining}</span></p>
                  <p className="text-slate-600">Phí khám: <span className="font-bold text-[#003f87]">{consultationFeeLabel}đ</span></p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <CircleDotDashed size={16} />
                  Vui lòng chọn một khung giờ để tiếp tục đặt lịch.
                </div>
              )}
            </div>
            {createBooking.isError && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>{(createBooking.error as Error)?.message || 'Tạo lịch hẹn thất bại, vui lòng thử lại.'}</span>
              </div>
            )}

            <div className="mt-auto pt-6 border-t border-slate-100">
               <button
                 disabled={!selectedSlot || createBooking.isPending}
                 onClick={() => setIsModalOpen(true)}
                 className="w-full flex items-center justify-center gap-2 bg-[#003f87] hover:bg-[#002b5e] disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed text-white font-extrabold text-base py-4 rounded-2xl transition-all shadow-xl shadow-[#003f87]/20 active:scale-[0.98]"
               >
                 Tiếp tục đặt lịch <ArrowRight size={20} />
               </button>
               <p className="text-center text-[9px] uppercase tracking-[0.25em] font-extrabold text-slate-300 mt-5">
                Clinical Precision • Quy trình xác nhận rõ ràng
               </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Confirm Modal */}
      {isMounted && isModalOpen && selectedSlot
        ? createPortal(
            <div className="fixed inset-0 z-[1000] bg-slate-950/70 backdrop-blur-[2px]">
              <button
                className="absolute inset-0 h-full w-full"
                type="button"
                aria-label="Đóng modal"
                onClick={() => setIsModalOpen(false)}
              />
              <div className="absolute left-1/2 top-1/2 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-2xl sm:p-8">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 mb-4 mx-auto">
                  <CalendarIcon size={28} />
                </div>

                <h3 className="text-2xl font-extrabold text-[#003f87] mb-2 text-center">Xác nhận lịch hẹn</h3>
                <p className="text-center text-xs text-slate-500 mb-4">Kiểm tra thông tin trước khi gửi yêu cầu đặt lịch.</p>

                {(() => {
                  const slotInfo = activeSlots.find((s) => s.id === selectedSlot);
                  if (!slotInfo) return null;
                  return (
                    <div className="mb-5 rounded-2xl border border-slate-100 bg-slate-50 py-3 px-4">
                      <p className="text-center text-sm font-semibold text-slate-600">
                        {new Date(slotInfo.startAt).toLocaleString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })} lúc{' '}
                        <span className="text-[#003f87] font-extrabold">
                          {new Date(slotInfo.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(slotInfo.endAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </p>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-xl bg-white border border-slate-100 px-3 py-2">
                          <p className="text-slate-500 font-semibold">Chuyên khoa</p>
                          <p className="font-bold text-slate-700">{selectedSlotSpecialtyLabel}</p>
                        </div>
                        <div className="rounded-xl bg-white border border-slate-100 px-3 py-2">
                          <p className="text-slate-500 font-semibold">Phí khám</p>
                          <p className="font-bold text-[#003f87]">{consultationFeeLabel}đ</p>
                        </div>
                        <div className="rounded-xl bg-white border border-slate-100 px-3 py-2">
                          <p className="text-slate-500 font-semibold">Chỗ trống</p>
                          <p className="font-bold text-[#003f87]">{selectedSlotRemaining}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="mb-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-3">Hình thức thanh toán</p>
                  <label className="flex items-center gap-3 py-2 cursor-pointer">
                    <input type="radio" name="pm" checked={paymentMethod === 'momo'} onChange={() => setPaymentMethod('momo')} className="h-4 w-4" />
                    <span className="text-sm font-semibold text-slate-800">MoMo (sau khi bác sĩ duyệt, email kèm QR)</span>
                  </label>
                  <label className="flex items-center gap-3 py-2 cursor-pointer">
                    <input type="radio" name="pm" checked={paymentMethod === 'pay_at_clinic'} onChange={() => setPaymentMethod('pay_at_clinic')} className="h-4 w-4" />
                    <span className="text-sm font-semibold text-slate-800">Thanh toán tại viện</span>
                  </label>
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Bác sĩ duyệt lịch trước. Sau đó hệ thống gửi hướng dẫn thanh toán theo lựa chọn của bạn.
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-sm font-extrabold text-slate-700 block mb-2">
                    Ghi chú cho bác sĩ <span className="text-slate-400 font-medium">(Tùy chọn)</span>
                  </label>
                  <textarea
                    className="w-full border-2 border-slate-100 bg-slate-50 rounded-2xl p-4 text-sm font-medium focus:border-[#003f87] focus:bg-white outline-none transition-colors resize-none"
                    rows={3}
                    value={patientNote}
                    onChange={(e) => setPatientNote(e.target.value)}
                    placeholder="Mô tả ngắn gọn triệu chứng của bạn..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-700 font-extrabold rounded-2xl hover:bg-slate-200 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={() => {
                      createBooking.mutate(selectedSlot);
                      setIsModalOpen(false);
                    }}
                    disabled={createBooking.isPending}
                    className="flex-1 py-4 bg-[#003f87] text-white font-extrabold rounded-2xl hover:bg-[#002b5e] disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-lg shadow-[#003f87]/20"
                  >
                    {createBooking.isPending ? (
                      <span className="inline-flex items-center gap-2"><CircleDotDashed size={16} className="animate-spin" /> Đang gửi</span>
                    ) : (
                      <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} /> Xác nhận</span>
                    )}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
