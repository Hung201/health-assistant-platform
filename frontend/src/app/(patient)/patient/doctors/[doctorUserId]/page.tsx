'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import { BadgeCheck, Calendar as CalendarIcon, ArrowLeft, ArrowRight, Wallet } from 'lucide-react';

import { bookingsApi, doctorsApi } from '@/lib/api';

export default function PatientDoctorDetailPage() {
  const router = useRouter();
  const params = useParams<{ doctorUserId: string }>();
  const doctorUserId = params.doctorUserId;

  const [patientNote, setPatientNote] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: doctor, isLoading: isLoadingDoctor, isError: isDoctorError, error: doctorError } = useQuery({
    queryKey: ['public', 'doctor', doctorUserId],
    queryFn: () => doctorsApi.detail(doctorUserId),
    staleTime: 30_000,
  });

  const primarySpecId = useMemo(() => {
    const s = doctor?.specialties?.find((x) => x.isPrimary) ?? doctor?.specialties?.[0];
    return s?.id;
  }, [doctor]);

  const { data: slots, isLoading: isLoadingSlots } = useQuery({
    queryKey: ['public', 'doctorSlots', doctorUserId],
    queryFn: () => doctorsApi.slots(doctorUserId, { specialtyId: primarySpecId }),
    enabled: Boolean(primarySpecId),
    staleTime: 10_000,
  });

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
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  // Handle selected slot reset when date changes
  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate]);

  const activeSlots = selectedDate ? slotsByDate[selectedDate] : [];

  const createBooking = useMutation({
    mutationFn: (availableSlotId: number) =>
      bookingsApi.create({
        availableSlotId,
        specialtyId: primarySpecId,
        patientNote: patientNote.trim() || undefined,
      }),
    onSuccess: () => {
      router.push('/patient/bookings');
      router.refresh();
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

            <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-800 mb-4">Chọn ngày khám</h3>
            
            {isLoadingSlots ? (
              <div className="flex gap-3 overflow-hidden pb-4">
                 <div className="w-[72px] h-[88px] rounded-2xl bg-slate-100 animate-pulse"></div>
                 <div className="w-[72px] h-[88px] rounded-2xl bg-slate-100 animate-pulse"></div>
                 <div className="w-[72px] h-[88px] rounded-2xl bg-slate-100 animate-pulse"></div>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-4 snap-x hide-scrollbar">
                {availableDates.map(dateStr => {
                   const d = new Date(dateStr);
                   const dayOfWeek = d.toLocaleDateString('vi-VN', { weekday: 'short' }).replace('T', 'Thứ ');
                   const day = d.getDate().toString().padStart(2, '0');
                   const month = d.getMonth() + 1;
                   const isSelected = selectedDate === dateStr;

                   return (
                     <button
                       key={dateStr}
                       onClick={() => setSelectedDate(dateStr)}
                       className={`snap-start shrink-0 flex flex-col items-center justify-center w-[76px] h-[92px] rounded-2xl transition-all ${
                         isSelected 
                           ? 'bg-[#003f87] text-white shadow-lg shadow-[#003f87]/30 scale-100 ring-2 ring-offset-2 ring-[#003f87]' 
                           : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                       }`}
                     >
                       <span className={`text-[10px] font-bold mb-1 tracking-wide ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>{dayOfWeek}</span>
                       <span className="text-2xl font-extrabold leading-none mb-1">{day}</span>
                       <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>Th{month}</span>
                     </button>
                   )
                })}
                {availableDates.length === 0 && (
                  <div className="text-sm text-slate-500 italic py-4 bg-slate-50 w-full rounded-2xl text-center border border-slate-100">Bác sĩ hiện chưa có lịch khám trống.</div>
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
                 const time = new Date(slot.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                 if (isFull) {
                   return (
                     <div key={slot.id} className="py-3.5 px-2 rounded-2xl border border-slate-100 bg-slate-50 opacity-50 text-center flex justify-center items-center">
                       <span className="text-sm font-extrabold text-slate-400">{time}</span>
                     </div>
                   );
                 }

                 return (
                   <button
                     key={slot.id}
                     onClick={() => setSelectedSlot(slot.id)}
                     className={`py-3.5 px-2 rounded-2xl font-extrabold text-sm transition-all text-center ${
                       isSelected
                         ? 'bg-[#003f87] text-white border-2 border-[#003f87] shadow-lg shadow-[#003f87]/20 scale-105'
                         : 'bg-white text-[#003f87] border-2 border-[#003f87]/10 hover:border-[#003f87]/50 hover:bg-[#f4fcfb]'
                     }`}
                   >
                     {time}
                   </button>
                 );
              })}
              {activeSlots.length === 0 && availableDates.length > 0 && (
                 <div className="col-span-full text-sm text-slate-500 italic py-6 text-center bg-slate-50 rounded-2xl border border-slate-100">
                    Không có khung giờ nào trống trong ngày này.
                 </div>
              )}
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100">
               <button
                 disabled={!selectedSlot || createBooking.isPending}
                 onClick={() => setIsModalOpen(true)}
                 className="w-full flex items-center justify-center gap-2 bg-[#003f87] hover:bg-[#002b5e] disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed text-white font-extrabold text-base py-4 rounded-2xl transition-all shadow-xl shadow-[#003f87]/20 active:scale-[0.98]"
               >
                 Tiếp tục đặt lịch <ArrowRight size={20} />
               </button>
               <p className="text-center text-[9px] uppercase tracking-[0.25em] font-extrabold text-slate-300 mt-5">
                 Clinical Precision • Bảo mật & An toàn Y tế
               </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Confirm Modal */}
      {isModalOpen && selectedSlot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
             <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 mb-6 mx-auto">
               <CalendarIcon size={32} />
             </div>
             
             <h3 className="text-2xl font-extrabold text-[#003f87] mb-2 text-center">Xác nhận lịch hẹn</h3>
             
             {(() => {
               const slotInfo = activeSlots.find(s => s.id === selectedSlot);
               if (!slotInfo) return null;
               return (
                 <p className="text-center text-sm font-semibold text-slate-600 mb-8 bg-slate-50 py-3 px-4 rounded-xl border border-slate-100">
                   {new Date(slotInfo.startAt).toLocaleString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })} lúc <span className="text-[#003f87] font-extrabold">{new Date(slotInfo.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                 </p>
               );
             })()}

             <div className="mb-8">
                <label className="text-sm font-extrabold text-slate-700 block mb-2">Ghi chú cho bác sĩ <span className="text-slate-400 font-medium">(Tùy chọn)</span></label>
                <textarea 
                  className="w-full border-2 border-slate-100 bg-slate-50 rounded-2xl p-4 text-sm font-medium focus:border-[#003f87] focus:bg-white outline-none transition-colors resize-none" 
                  rows={3} 
                  value={patientNote}
                  onChange={e => setPatientNote(e.target.value)}
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
                  className="flex-1 py-4 bg-[#003f87] text-white font-extrabold rounded-2xl hover:bg-[#002b5e] transition-colors shadow-lg shadow-[#003f87]/20"
                >
                  Xác nhận
                </button>
             </div>
           </div>
        </div>
      )}
      
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
