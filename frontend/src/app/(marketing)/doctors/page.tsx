'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Activity, Search, MapPin, BadgeCheck, Stethoscope } from 'lucide-react';
import Select from 'react-select';

import { authApi, doctorsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { fetchVnDistricts, fetchVnProvinces } from '@/lib/vn-location';

type LocationOption = { value: string; label: string };

export default function DoctorsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<number | null>(null);
  const [provinceCode, setProvinceCode] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      logout();
      router.refresh();
    },
  });

  const { data: specialtiesData } = useQuery({
    queryKey: ['public-specialties'],
    queryFn: authApi.specialties,
  });

  const { data: doctorsData, isLoading } = useQuery({
    queryKey: ['public-doctors', selectedSpecialty, provinceCode, districtCode, debouncedSearchTerm],
    queryFn: () =>
      doctorsApi.list({
        specialtyId: selectedSpecialty || undefined,
        provinceCode: provinceCode.trim() || undefined,
        districtCode: districtCode.trim() || undefined,
        workplaceQuery: debouncedSearchTerm || undefined,
        limit: 100,
      }),
  });
  const { data: provinces = [] } = useQuery({
    queryKey: ['vn-location', 'provinces', 'doctor-page'],
    queryFn: fetchVnProvinces,
    staleTime: 24 * 60 * 60 * 1000,
  });
  const { data: districts = [] } = useQuery({
    queryKey: ['vn-location', 'districts', provinceCode, 'doctor-page'],
    queryFn: () => fetchVnDistricts(provinceCode),
    enabled: Boolean(provinceCode),
    staleTime: 24 * 60 * 60 * 1000,
  });
  const provinceOptions = provinces.map((p) => ({ value: String(p.code), label: p.name }));
  const districtOptions = districts.map((d) => ({ value: String(d.code), label: d.name }));
  const currentProvinceOption = provinceOptions.find((o) => o.value === provinceCode) ?? null;
  const currentDistrictOption = districtOptions.find((o) => o.value === districtCode) ?? null;
  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      minHeight: 50,
      borderRadius: 12,
      borderColor: state.isFocused ? '#2dd4bf' : '#e2e8f0',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(45,212,191,0.2)' : 'none',
      backgroundColor: '#f8fafc',
    }),
    menu: (base: any) => ({ ...base, zIndex: 30 }),
  };

  const appHref = user?.roles?.includes('admin')
    ? '/admin'
    : user?.roles?.includes('doctor')
      ? '/doctor'
      : user
        ? '/patient'
        : '/login';

  const aiHref = user ? '/patient/ai-assistant' : '/ai';

  // Client-side filtering by name and price
  const filteredDoctors = doctorsData?.items?.filter((doc) => {
    const fee = Number(doc.consultationFee);
    let matchPrice = true;
    if (priceFilter === 'under500') matchPrice = fee < 500000;
    else if (priceFilter === '500to1m') matchPrice = fee >= 500000 && fee <= 1000000;
    else if (priceFilter === 'over1m') matchPrice = fee > 1000000;
    
    return matchPrice;
  });

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

      <main className="flex-1 pb-24 pt-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Danh bạ Bác sĩ</h1>
            <p className="text-slate-500 max-w-2xl text-base">
              Tìm kiếm và đặt lịch khám với hàng ngàn bác sĩ chuyên khoa giỏi, uy tín trên toàn quốc.
            </p>
          </div>

          {/* Filter and Search Section */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 mb-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên bác sĩ..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm outline-none transition-all focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 px-4 text-sm outline-none transition-all focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 appearance-none"
                value={selectedSpecialty || ''}
                onChange={(e) => setSelectedSpecialty(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Tất cả chuyên khoa</option>
                {specialtiesData?.map((spec) => (
                  <option key={spec.id} value={spec.id}>
                    {spec.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Select<LocationOption, false>
                isClearable
                options={provinceOptions}
                value={currentProvinceOption}
                placeholder="Lọc theo Tỉnh/Thành"
                styles={selectStyles}
                onChange={(opt) => {
                  setProvinceCode(opt?.value ?? '');
                  setDistrictCode('');
                }}
              />
            </div>

            <div>
              <Select<LocationOption, false>
                isClearable
                isDisabled={!provinceCode}
                options={districtOptions}
                value={currentDistrictOption}
                placeholder={provinceCode ? 'Lọc theo Quận/Huyện' : 'Chọn Tỉnh/Thành trước'}
                styles={selectStyles}
                onChange={(opt) => setDistrictCode(opt?.value ?? '')}
              />
            </div>

            <div>
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 px-4 text-sm outline-none transition-all focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 appearance-none"
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
              >
                <option value="all">Tất cả mức giá</option>
                <option value="under500">Dưới 500.000đ</option>
                <option value="500to1m">500.000đ - 1.000.000đ</option>
                <option value="over1m">Trên 1.000.000đ</option>
              </select>
            </div>
          </div>

          {/* Doctors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading ? (
              <div className="col-span-full py-20 text-center text-slate-500">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent mb-4"></div>
                <p>Đang tải danh sách bác sĩ...</p>
              </div>
            ) : filteredDoctors?.length === 0 ? (
              <div className="col-span-full py-20 text-center text-slate-500 bg-white rounded-2xl border border-slate-100 border-dashed">
                <Stethoscope size={48} className="mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-bold text-slate-700 mb-2">Không tìm thấy bác sĩ</h3>
                <p>Không có bác sĩ nào khớp với điều kiện tìm kiếm của bạn.</p>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedSpecialty(null);
                    setProvinceCode('');
                    setDistrictCode('');
                    setPriceFilter('all');
                  }}
                  className="mt-4 text-teal-600 font-bold hover:underline"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              filteredDoctors?.map((doctor) => (
                <Link 
                  href={`/doctors/${doctor.userId}`} 
                  key={doctor.userId}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200 transition-all hover:shadow-xl hover:border-teal-200 hover:-translate-y-1"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <img 
                      alt={doctor.fullName} 
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      src={doctor.avatarUrl || 'https://images.unsplash.com/photo-1612349317150-e410f624c427?q=80&w=2070&auto=format&fit=crop'} 
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1 shadow-sm">
                      <BadgeCheck size={14} className="text-blue-500" />
                      <span className="text-xs font-bold text-slate-700">Đã xác minh</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-2">
                      <span className="inline-block rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-700">
                        {doctor.specialties?.[0]?.name || 'Đa khoa'}
                      </span>
                    </div>
                    
                    <h4 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1 group-hover:text-teal-600 transition-colors">
                      {doctor.professionalTitle ? `${doctor.professionalTitle} ` : ''}{doctor.fullName}
                    </h4>
                    
                    <div className="flex items-start gap-1.5 text-sm text-slate-500 mb-4 line-clamp-2">
                      <MapPin size={16} className="shrink-0 mt-0.5 text-slate-400" />
                      <span>
                        {doctor.workplaceAddress ||
                          [doctor.workplaceName, doctor.districtCode, doctor.provinceCode].filter(Boolean).join(', ') ||
                          'Phòng khám Clinical Precision'}
                      </span>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Giá khám</p>
                        <p className="font-extrabold text-teal-700">
                          {Number(doctor.consultationFee).toLocaleString('vi-VN')} ₫
                        </p>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                        <span className="font-bold text-lg leading-none mb-1">→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
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
