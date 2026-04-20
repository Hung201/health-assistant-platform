'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { doctorsApi } from '@/lib/api';

export default function DoctorDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: doctor, isLoading, error } = useQuery({
    queryKey: ['public-doctor-detail', id],
    queryFn: () => doctorsApi.detail(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md w-full">
          <span className="material-symbols-outlined text-[48px] text-slate-300 mb-4">person_off</span>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy bác sĩ</h2>
          <p className="text-slate-500 mb-6">Thông tin bác sĩ không tồn tại hoặc đã bị xóa.</p>
          <Link href="/doctors" className="bg-primary text-white font-bold px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors inline-block">
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24">
      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200 h-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent z-0" />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Info */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6 items-start">
              <div className="w-32 h-32 rounded-2xl bg-slate-100 border-4 border-white shadow-lg overflow-hidden shrink-0 mx-auto md:mx-0">
                <img 
                  src={doctor.avatarUrl || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop'} 
                  alt={doctor.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Đang hoạt động
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
                  {doctor.professionalTitle ? `${doctor.professionalTitle} ` : ''}{doctor.fullName}
                </h1>
                <p className="text-primary font-semibold mb-4">
                  {doctor.specialties.map(s => s.name).join(', ') || 'Chuyên gia Y tế'}
                </p>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-8 border-t border-slate-100 pt-4">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-500 uppercase font-semibold">Kinh nghiệm</span>
                    <span className="text-sm font-bold text-slate-900">{doctor.yearsOfExperience ? `${doctor.yearsOfExperience} Năm` : 'Đang cập nhật'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-500 uppercase font-semibold">Nơi công tác</span>
                    <span className="text-sm font-bold text-slate-900">{doctor.workplaceName || 'Phòng khám đa khoa Clinical Precision'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-500 uppercase font-semibold">Đánh giá</span>
                    <div className="flex items-center gap-1 text-sm font-bold text-slate-900">
                      <span className="material-symbols-outlined text-[16px] text-amber-400" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                      4.9 <span className="text-slate-400 font-normal text-xs">(120+)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person</span>
                Giới thiệu chung
              </h3>
              <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-p:leading-relaxed text-sm">
                <p>
                  {doctor.bio || `${doctor.professionalTitle ? doctor.professionalTitle : 'Bác sĩ'} ${doctor.fullName} là một trong những chuyên gia hàng đầu trong lĩnh vực ${doctor.specialties[0]?.name || 'y tế'}. Với nhiều năm kinh nghiệm công tác và tận tâm với nghề, bác sĩ đã điều trị thành công cho hàng ngàn bệnh nhân.`}
                </p>
              </div>
            </div>
            
            {/* Reviews Section */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">forum</span>
                Đánh giá từ bệnh nhân
              </h3>
              <div className="space-y-6">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-4 border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                    <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900 text-sm">Bệnh nhân ẩn danh</span>
                        <div className="flex text-amber-400">
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">Bác sĩ rất nhiệt tình, giải thích cặn kẽ bệnh tình và hướng dẫn uống thuốc rất chi tiết.</p>
                      <span className="text-[10px] text-slate-400 mt-2 block">1 tháng trước</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Col */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 sticky top-24">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">calendar_month</span>
                Đặt lịch khám
              </h3>
              
              <div className="bg-slate-50 p-4 rounded-xl mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600 font-medium">Giá khám</span>
                  <span className="text-lg font-bold text-primary">{Number(doctor.consultationFee).toLocaleString()} ₫</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 font-medium">Hình thức</span>
                  <span className="text-sm font-bold text-slate-900">Khám trực tuyến (Video)</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-900 mb-3">Chọn ngày khám</label>
                <div className="grid grid-cols-3 gap-2">
                  <button className="bg-primary/10 border border-primary text-primary font-bold py-2 rounded-lg text-sm flex flex-col items-center">
                    <span>Hôm nay</span>
                    <span className="text-xs font-medium">15/05</span>
                  </button>
                  <button className="bg-white border border-slate-200 text-slate-600 hover:border-primary/50 font-medium py-2 rounded-lg text-sm flex flex-col items-center transition-colors">
                    <span>Ngày mai</span>
                    <span className="text-xs">16/05</span>
                  </button>
                  <button className="bg-white border border-slate-200 text-slate-600 hover:border-primary/50 font-medium py-2 rounded-lg text-sm flex flex-col items-center transition-colors">
                    <span>T5</span>
                    <span className="text-xs">17/05</span>
                  </button>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-bold text-slate-900 mb-3">Giờ khám</label>
                <div className="grid grid-cols-3 gap-2">
                  <button className="bg-white border border-slate-200 text-slate-700 hover:border-primary hover:text-primary font-semibold py-2 rounded-lg text-sm transition-colors">08:00</button>
                  <button className="bg-white border border-slate-200 text-slate-700 hover:border-primary hover:text-primary font-semibold py-2 rounded-lg text-sm transition-colors">09:30</button>
                  <button className="bg-white border border-slate-200 text-slate-700 hover:border-primary hover:text-primary font-semibold py-2 rounded-lg text-sm transition-colors">14:00</button>
                  <button className="bg-white border border-slate-200 text-slate-700 hover:border-primary hover:text-primary font-semibold py-2 rounded-lg text-sm transition-colors">15:30</button>
                  <button className="bg-slate-100 border border-slate-200 text-slate-400 font-medium py-2 rounded-lg text-sm cursor-not-allowed">16:00</button>
                </div>
              </div>

              <Link href="/patient/bookings" className="block w-full text-center bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
                XÁC NHẬN ĐẶT LỊCH
              </Link>
              <p className="text-center text-xs text-slate-500 mt-4 flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[14px]">shield</span>
                Hủy miễn phí trước 24h
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
