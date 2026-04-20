'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, BadgeCheck, Stethoscope } from 'lucide-react';

import { authApi, doctorsApi } from '@/lib/api';

export default function PatientFindDoctorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<number | null>(null);
  const [priceFilter, setPriceFilter] = useState<string>('all');

  const { data: specialtiesData } = useQuery({
    queryKey: ['public-specialties'],
    queryFn: authApi.specialties,
  });

  const { data: doctorsData, isLoading } = useQuery({
    queryKey: ['public-doctors', selectedSpecialty],
    queryFn: () => doctorsApi.list({ specialtyId: selectedSpecialty || undefined, limit: 100 }),
  });

  // Client-side filtering by name and price
  const filteredDoctors = doctorsData?.items?.filter((doc) => {
    const matchName = doc.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const fee = Number(doc.consultationFee);
    let matchPrice = true;
    if (priceFilter === 'under500') matchPrice = fee < 500000;
    else if (priceFilter === '500to1m') matchPrice = fee >= 500000 && fee <= 1000000;
    else if (priceFilter === 'over1m') matchPrice = fee > 1000000;
    
    return matchName && matchPrice;
  });

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-bold text-foreground">Tìm bác sĩ</h2>
        <p className="text-sm text-muted-foreground mt-1">Tìm kiếm và xem hồ sơ bác sĩ để đặt lịch khám bệnh.</p>
      </header>

      {/* Filter and Search Section */}
      <div className="rounded-2xl bg-card p-6 shadow-sm border border-border flex flex-col md:flex-row gap-6">
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
        
        <div className="md:w-64">
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

        <div className="md:w-64">
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
        </div>
      </div>

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
              onClick={() => { setSearchTerm(''); setSelectedSpecialty(null); setPriceFilter('all'); }}
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
                  <span>{doctor.workplaceName || 'Phòng khám Clinical Precision'}</span>
                </div>
                
                <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Giá khám</p>
                    <p className="font-extrabold text-teal-600">
                      {Number(doctor.consultationFee).toLocaleString('vi-VN')} ₫
                    </p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                    <span className="font-bold text-lg leading-none mb-1">→</span>
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
