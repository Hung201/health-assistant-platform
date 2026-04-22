'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, BadgeCheck, Stethoscope, X } from 'lucide-react';
import Select from 'react-select';
import Image from 'next/image';

import { authApi, doctorsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { fetchVnDistricts, fetchVnProvinces } from '@/lib/vn-location';

type LocationOption = { value: string; label: string };

export default function PatientFindDoctorsPage() {
  const user = useAuthStore((s) => s.user);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<number | null>(null);
  const [provinceCode, setProvinceCode] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [nearByMode, setNearByMode] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [focusedDoctorId, setFocusedDoctorId] = useState<string | null>(null);

  const { data: specialtiesData } = useQuery({
    queryKey: ['public-specialties'],
    queryFn: authApi.specialties,
  });

  const { data: doctorsData, isLoading } = useQuery({
    queryKey: ['public-doctors', selectedSpecialty, provinceCode, districtCode],
    queryFn: () =>
      doctorsApi.list({
        specialtyId: selectedSpecialty || undefined,
        provinceCode: provinceCode || undefined,
        districtCode: districtCode || undefined,
        limit: 100,
      }),
  });

  const { data: provinces = [] } = useQuery({
    queryKey: ['vn-location', 'provinces', 'patient-doctors'],
    queryFn: fetchVnProvinces,
    staleTime: 24 * 60 * 60 * 1000,
  });
  const { data: districts = [] } = useQuery({
    queryKey: ['vn-location', 'districts', provinceCode, 'patient-doctors'],
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
      borderColor: state.isFocused ? '#14b8a6' : 'hsl(var(--border))',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(20,184,166,0.25)' : 'none',
      backgroundColor: 'hsl(var(--background))',
    }),
    menu: (base: any) => ({ ...base, zIndex: 30 }),
  };

  const filteredDoctors = useMemo(() => {
    const rows = doctorsData?.items ?? [];
    const search = searchTerm.toLowerCase();
    const meProvince = user?.patientProfile?.provinceCode ?? '';
    const meDistrict = user?.patientProfile?.districtCode ?? '';

    const list = rows.filter((doc) => {
      const matchName =
        doc.fullName.toLowerCase().includes(search) ||
        (doc.workplaceName ?? '').toLowerCase().includes(search) ||
        (doc.workplaceAddress ?? '').toLowerCase().includes(search);
      const fee = Number(doc.consultationFee);
      let matchPrice = true;
      if (priceFilter === 'under500') matchPrice = fee < 500000;
      else if (priceFilter === '500to1m') matchPrice = fee >= 500000 && fee <= 1000000;
      else if (priceFilter === 'over1m') matchPrice = fee > 1000000;
      return matchName && matchPrice;
    });

    if (!nearByMode || (!meProvince && !meDistrict)) return list;

    return [...list].sort((a, b) => {
      const score = (d: (typeof list)[number]) => {
        if (meDistrict && d.districtCode === meDistrict) return 3;
        if (meProvince && d.provinceCode === meProvince) return 2;
        return 1;
      };
      return score(b) - score(a);
    });
  }, [doctorsData?.items, nearByMode, priceFilter, searchTerm, user?.patientProfile?.districtCode, user?.patientProfile?.provinceCode]);
  const focusedDoctor =
    (focusedDoctorId ? filteredDoctors.find((d) => d.userId === focusedDoctorId) : null) ?? filteredDoctors[0] ?? null;
  const mapQuery = focusedDoctor
    ? focusedDoctor.workplaceAddress ||
      [focusedDoctor.workplaceName, focusedDoctor.districtCode, focusedDoctor.provinceCode]
        .filter(Boolean)
        .join(', ')
    : [currentDistrictOption?.label, currentProvinceOption?.label].filter(Boolean).join(', ');
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery || 'Việt Nam')}&output=embed`;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-bold text-foreground">Tìm bác sĩ</h2>
        <p className="text-sm text-muted-foreground mt-1">Tìm kiếm và xem hồ sơ bác sĩ để đặt lịch khám bệnh.</p>
      </header>

      {/* Filter and Search Section */}
      <div className="rounded-2xl bg-card p-6 shadow-sm border border-border grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên bác sĩ..."
            className="w-full rounded-xl border border-border bg-background py-3.5 pl-12 pr-4 text-sm outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div>
          <select
            className="w-full rounded-xl border border-border bg-background py-3.5 px-4 text-sm outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500 appearance-none"
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

        <div className="flex gap-2">
          <select
            className="w-full rounded-xl border border-border bg-background py-3.5 px-4 text-sm outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500 appearance-none"
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
          >
            <option value="all">Tất cả mức giá</option>
            <option value="under500">Dưới 500.000đ</option>
            <option value="500to1m">500.000đ - 1.000.000đ</option>
            <option value="over1m">Trên 1.000.000đ</option>
          </select>
          <button
            type="button"
            onClick={() => setNearByMode((v) => !v)}
            className={`shrink-0 rounded-xl border px-4 text-sm font-bold transition-colors ${
              nearByMode ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-border bg-background text-muted-foreground'
            }`}
            title={!user?.patientProfile?.provinceCode ? 'Cập nhật địa chỉ bệnh nhân để ưu tiên bác sĩ gần bạn' : 'Ưu tiên bác sĩ gần bạn'}
          >
            Gần bạn
          </button>
          <button
            type="button"
            onClick={() => setShowMap((v) => !v)}
            className="shrink-0 rounded-lg p-1 transition-transform hover:scale-105 active:scale-95"
            title="Hiển thị bản đồ địa chỉ bác sĩ"
            aria-label={showMap ? 'Ẩn bản đồ' : 'Bật bản đồ'}
          >
            <span className="inline-flex items-center justify-center">
              <Image
                src="/assets/map-icons/google-maps_2702604.png"
                alt="Google Maps"
                width={30}
                height={30}
                className="h-[30px] w-[30px] object-contain"
              />
            </span>
          </button>
        </div>
      </div>

      {showMap ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h3 className="text-sm font-extrabold text-foreground">Bản đồ địa chỉ bác sĩ</h3>
              <p className="text-xs text-muted-foreground">{mapQuery || 'Đang hiển thị Việt Nam'}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowMap(false)}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted"
            >
              <X size={14} /> Đóng
            </button>
          </div>
          <iframe
            title="Doctor location map"
            src={mapUrl}
            className="h-[360px] w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          {filteredDoctors.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto border-t border-border p-3">
              {filteredDoctors.slice(0, 12).map((doctor) => (
                <button
                  key={doctor.userId}
                  type="button"
                  onClick={() => setFocusedDoctorId(doctor.userId)}
                  className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-bold ${
                    focusedDoctor?.userId === doctor.userId
                      ? 'border-[#003f87] bg-[#003f87] text-white'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {doctor.fullName}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center text-muted-foreground">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent mb-4"></div>
            <p>Đang tải danh sách bác sĩ...</p>
          </div>
        ) : filteredDoctors?.length === 0 ? (
          <div className="col-span-full py-20 text-center text-muted-foreground bg-card rounded-2xl border border-border border-dashed">
            <Stethoscope size={48} className="mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-bold text-foreground mb-2">Không tìm thấy bác sĩ</h3>
            <p>Không có bác sĩ nào khớp với điều kiện tìm kiếm của bạn.</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedSpecialty(null);
                setProvinceCode('');
                setDistrictCode('');
                setPriceFilter('all');
                setNearByMode(false);
              }}
              className="mt-4 text-teal-600 font-bold hover:underline"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          filteredDoctors?.map((doctor) => (
            <Link 
              href={`/patient/doctors/${doctor.userId}`} 
              key={doctor.userId}
              className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm border border-border transition-all hover:shadow-xl hover:border-teal-200 hover:-translate-y-1"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
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
                
                <h4 className="text-lg font-bold text-foreground mb-1 line-clamp-1 group-hover:text-teal-600 transition-colors">
                  {doctor.professionalTitle ? `${doctor.professionalTitle} ` : ''}{doctor.fullName}
                </h4>
                
                <div className="flex items-start gap-1.5 text-sm text-muted-foreground mb-4 line-clamp-2">
                  <MapPin size={16} className="shrink-0 mt-0.5 opacity-60" />
                  <span>
                    {doctor.workplaceAddress ||
                      [doctor.workplaceName, doctor.districtCode, doctor.provinceCode].filter(Boolean).join(', ') ||
                      'Phòng khám Clinical Precision'}
                  </span>
                </div>
                
                <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Giá khám</p>
                    <p className="font-extrabold text-teal-600">
                      {Number(doctor.consultationFee).toLocaleString('vi-VN')} ₫
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowMap(true);
                        setFocusedDoctorId(doctor.userId);
                      }}
                      className="rounded-full p-1 transition-transform hover:scale-105 active:scale-95"
                      title="Xem vị trí bác sĩ trên bản đồ"
                      aria-label="Xem vị trí bác sĩ trên bản đồ"
                    >
                      <Image
                        src="/assets/map-icons/google-maps_2702604.png"
                        alt="Google Maps"
                        width={22}
                        height={22}
                        className="h-[22px] w-[22px] object-contain"
                      />
                    </button>
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                      <span className="font-bold text-lg leading-none mb-1">→</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
