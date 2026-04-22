'use client';

import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Activity, MapPin, BadgeCheck, Stethoscope, Star, Clock, GraduationCap, ArrowLeft, CalendarCheck, User as UserIcon } from 'lucide-react';

import { authApi, doctorsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { fetchVnDistricts, fetchVnProvinces, fetchVnWards } from '@/lib/vn-location';

export default function DoctorDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      logout();
      router.refresh();
    },
  });

  const { data: doctor, isLoading } = useQuery({
    queryKey: ['public-doctor', params.id],
    queryFn: () => doctorsApi.detail(params.id),
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

  const appHref = user?.roles?.includes('admin')
    ? '/admin'
    : user?.roles?.includes('doctor')
      ? '/doctor'
      : user
        ? '/patient'
        : '/login';

  const aiHref = user ? '/patient/ai-assistant' : '/ai';
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
    <div className="min-h-screen bg-[#fafafb] text-slate-900 font-sans flex flex-col">
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-2" href="/">
            <div className="rounded-lg bg-teal-500 p-1.5 text-white">
              <Activity size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Clinical Precision</h1>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link className="text-sm font-semibold text-slate-600 transition-colors hover:text-teal-600" href={aiHref}>
              AI
            </Link>
            <Link className="text-sm font-semibold text-teal-600 transition-colors hover:text-teal-700" href="/doctors">
              Bác sĩ
            </Link>
            <Link className="text-sm font-semibold text-slate-600 transition-colors hover:text-teal-600" href="/#blog">
              Blog
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  className="rounded-full px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
                  href={appHref}
                >
                  Vào ứng dụng
                </Link>
                <button
                  className="rounded-full bg-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={logoutMutation.isPending}
                  onClick={() => logoutMutation.mutate()}
                  type="button"
                >
                  {logoutMutation.isPending ? 'Đang đăng xuất…' : 'Đăng xuất'}
                </button>
              </>
            ) : (
              <>
                <Link
                  className="rounded-full px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
                  href="/login"
                >
                  Đăng nhập
                </Link>
                <Link
                  className="rounded-full bg-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-teal-700"
                  href="/register"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24 pt-8">
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
                      <Star size={16} className="fill-current" />
                      <Star size={16} className="fill-current" />
                      <Star size={16} className="fill-current" />
                      <Star size={16} className="fill-current" />
                      <span className="text-sm font-semibold text-slate-600 ml-1">(5.0)</span>
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
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-100 py-8 border-t border-slate-200 mt-auto">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-[#003f87]">Clinical Precision</h2>
            </div>
            
            <div className="flex gap-6 text-sm font-medium text-slate-600">
              <a href="#" className="hover:text-teal-600 transition-colors">Chính sách bảo mật</a>
              <a href="#" className="hover:text-teal-600 transition-colors">Điều khoản sử dụng</a>
              <a href="#" className="hover:text-teal-600 transition-colors">Liên hệ</a>
            </div>
            
            <p className="text-[10px] uppercase tracking-widest text-slate-400">
              © 2024 ETHOS CLINICAL SYSTEMS. ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
