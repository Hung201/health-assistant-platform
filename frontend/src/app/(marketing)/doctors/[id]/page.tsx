'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { MapPin, BadgeCheck, Stethoscope, Star, Clock, GraduationCap, ArrowLeft, CalendarCheck, User as UserIcon } from 'lucide-react';

import { doctorsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { fetchVnDistricts, fetchVnProvinces, fetchVnWards } from '@/lib/vn-location';

export default function DoctorDetailPage({ params }: { params: { id: string } }) {
  const user = useAuthStore((s) => s.user);

  const { data: doctor, isLoading } = useQuery({
    queryKey: ['public-doctor', params.id],
    queryFn: () => doctorsApi.detail(params.id),
  });
  const { data: reviewsData } = useQuery({
    queryKey: ['public-doctor-reviews', params.id],
    queryFn: () => doctorsApi.reviews(params.id, { page: 1, limit: 5 }),
    enabled: Boolean(params.id),
  });
  const { data: provinces = [] } = useQuery({
    queryKey: ['vn-location', 'provinces', 'doctor-detail'],
    queryFn: fetchVnProvinces,
    staleTime: 24 * 60 * 60 * 1000,
  });
  const { data: districts = [] } = useQuery({
    queryKey: ['vn-location', 'districts', doctor?.provinceCode, 'doctor-detail'],
    queryFn: () => fetchVnDistricts(doctor?.provinceCode ?? ''),
    enabled: Boolean(doctor?.provinceCode),
    staleTime: 24 * 60 * 60 * 1000,
  });
  const { data: wards = [] } = useQuery({
    queryKey: ['vn-location', 'wards', doctor?.districtCode, 'doctor-detail'],
    queryFn: () => fetchVnWards(doctor?.districtCode ?? ''),
    enabled: Boolean(doctor?.districtCode),
    staleTime: 24 * 60 * 60 * 1000,
  });


  const provinceName = provinces.find((p) => String(p.code) === doctor?.provinceCode)?.name ?? doctor?.provinceCode;
  const districtName = districts.find((d) => String(d.code) === doctor?.districtCode)?.name ?? doctor?.districtCode;
  const wardName = wards.find((w) => String(w.code) === doctor?.wardCode)?.name ?? doctor?.wardCode;
  const doctorAddress = [
    doctor?.workplaceAddress,
    wardName,
    districtName,
    provinceName,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="bg-[#fafafb] pb-24 pt-8">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          <Link href="/doctors" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-teal-600 transition-colors mb-8">
            <ArrowLeft size={16} /> Quay lại danh sách
          </Link>

          {isLoading ? (
            <div className="py-20 text-center text-slate-500">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent mb-4"></div>
              <p>Đang tải thông tin bác sĩ...</p>
            </div>
          ) : !doctor ? (
            <div className="py-20 text-center text-slate-500 bg-white rounded-2xl border border-slate-100 border-dashed">
              <Stethoscope size={48} className="mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-bold text-slate-700 mb-2">Không tìm thấy bác sĩ</h3>
              <p>Thông tin bác sĩ không tồn tại hoặc đã bị xóa.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Profile Card */}
              <div className="lg:col-span-1">
                <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden sticky top-28">
                  <div className="aspect-square bg-slate-100 relative">
                    <img 
                      alt={doctor.fullName} 
                      className="h-full w-full object-cover" 
                      src={doctor.avatarUrl || 'https://images.unsplash.com/photo-1612349317150-e410f624c427?q=80&w=2070&auto=format&fit=crop'} 
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm">
                      <BadgeCheck size={16} className="text-blue-500" />
                      <span className="text-sm font-bold text-slate-700">Đã xác minh</span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="mb-3">
                      <span className="inline-block rounded-full bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-700">
                        {doctor.specialties?.[0]?.name || 'Đa khoa'}
                      </span>
                    </div>
                    
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">
                      {doctor.professionalTitle ? `${doctor.professionalTitle} ` : ''}{doctor.fullName}
                    </h1>
                    
                    <div className="flex items-center gap-1 mb-6 text-amber-500">
                      <Star size={16} className="fill-current" />
                      <span className="text-sm font-semibold text-slate-700 ml-1">
                        {doctor.ratingAverage?.toFixed(1) || '0.0'} ({doctor.ratingCount ?? 0} đánh giá)
                      </span>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-start gap-3 text-sm text-slate-600">
                        <MapPin size={18} className="shrink-0 text-slate-400 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-800">Nơi công tác</p>
                          <p>{doctor.workplaceName || 'Phòng khám Clinical Precision'}</p>
                          <p className="mt-1">{doctorAddress || 'Địa chỉ đang cập nhật'}</p>
                          {doctorAddress ? (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(doctorAddress)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-flex text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline"
                            >
                              Mở trên Google Maps
                            </a>
                          ) : null}
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 text-sm text-slate-600">
                        <GraduationCap size={18} className="shrink-0 text-slate-400 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-800">Kinh nghiệm</p>
                          <p>{doctor.yearsOfExperience ? `${doctor.yearsOfExperience} năm` : 'Chưa cập nhật'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 text-sm text-slate-600">
                        <BadgeCheck size={18} className="shrink-0 text-slate-400 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-800">Chứng chỉ hành nghề</p>
                          <p>{doctor.licenseNumber || 'Đang cập nhật'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                      <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Giá khám dự kiến</p>
                      <p className="text-2xl font-extrabold text-teal-700 mb-6">
                        {Number(doctor.consultationFee).toLocaleString('vi-VN')} ₫
                      </p>
                      
                      <Link 
                        href={user ? "/patient" : "/login"} 
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#003f87] py-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#0056b3] hover:shadow-md"
                      >
                        <CalendarCheck size={18} />
                        Đặt lịch khám
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Bio & Reviews */}
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <UserIcon size={20} className="text-teal-600" /> Giới thiệu chung
                  </h3>
                  <div className="prose prose-slate max-w-none text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {doctor.bio || 'Bác sĩ hiện chưa cập nhật thông tin giới thiệu chi tiết.'}
                  </div>
                </div>

                <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-teal-600" /> Thời gian làm việc
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                    <div className="flex justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-semibold text-slate-800">Thứ 2 - Thứ 6</span>
                      <span>08:00 - 17:00</span>
                    </div>
                    <div className="flex justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-semibold text-slate-800">Thứ 7</span>
                      <span>08:00 - 12:00</span>
                    </div>
                    <div className="flex justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 md:col-span-2 opacity-60">
                      <span className="font-semibold text-slate-800">Chủ nhật</span>
                      <span>Nghỉ</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Star size={20} className="text-amber-500" /> Đánh giá bệnh nhân
                  </h3>
                  {reviewsData?.items?.length ? (
                    <div className="space-y-4">
                      {reviewsData.items.map((review) => (
                        <div key={review.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-slate-800">{review.patientName}</p>
                            <p className="text-xs font-bold text-amber-600">★ {review.rating.toFixed(1)}</p>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                          {review.comment ? (
                            <p className="mt-2 text-sm text-slate-700">{review.comment}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Chưa có đánh giá nào cho bác sĩ này.</p>
                  )}
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
