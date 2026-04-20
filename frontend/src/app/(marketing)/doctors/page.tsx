'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';

import { authApi, doctorsApi, PublicDoctorCard } from '@/lib/api';

export default function DoctorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<number | null>(null);

  const { data: specialties } = useQuery({
    queryKey: ['specialties'],
    queryFn: () => authApi.specialties(),
  });

  const { data: doctorsData, isLoading } = useQuery({
    queryKey: ['public-doctors', selectedSpecialty],
    queryFn: () => doctorsApi.list({ specialtyId: selectedSpecialty ?? undefined, limit: 50 }),
  });

  // Client-side search filter
  const filteredDoctors = doctorsData?.items.filter(doc => 
    doc.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.specialties.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  // Group doctors by specialty if no specific specialty is selected
  const groupedDoctors = filteredDoctors.reduce((acc, doctor) => {
    const primarySpecialty = doctor.specialties[0]?.name || 'Khác';
    if (!acc[primarySpecialty]) {
      acc[primarySpecialty] = [];
    }
    acc[primarySpecialty].push(doctor);
    return acc;
  }, {} as Record<string, PublicDoctorCard[]>);

  return (
    <>
      {/* Header section with Search and Filter */}
      <section className="bg-white border-b border-slate-200 py-12 relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent z-0" />
         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl mb-8">
               <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Tìm kiếm Bác sĩ & Chuyên gia</h1>
               <p className="text-slate-600">Đội ngũ y bác sĩ hàng đầu, giàu kinh nghiệm, luôn sẵn sàng đồng hành cùng sức khỏe của bạn.</p>
            </div>
            
            <div className="bg-white p-4 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row gap-4">
               <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                     <span className="material-symbols-outlined">search</span>
                  </div>
                  <input 
                     type="text" 
                     placeholder="Tìm tên bác sĩ hoặc chuyên khoa..." 
                     className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
               <div className="w-full md:w-72 relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                     <span className="material-symbols-outlined">filter_list</span>
                  </div>
                  <select 
                     className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer"
                     value={selectedSpecialty || ''}
                     onChange={(e) => setSelectedSpecialty(e.target.value ? Number(e.target.value) : null)}
                  >
                     <option value="">Tất cả chuyên khoa</option>
                     {specialties?.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                     ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                     <span className="material-symbols-outlined">expand_more</span>
                  </div>
               </div>
               <button className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3.5 rounded-xl shadow-md transition-all whitespace-nowrap">
                  Tìm kiếm
               </button>
            </div>
            
            {/* Quick Filter Tags */}
            <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
               <button 
                  onClick={() => setSelectedSpecialty(null)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${
                     selectedSpecialty === null ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
               >
                  Tất cả
               </button>
               {specialties?.slice(0, 6).map(s => (
                  <button 
                     key={s.id}
                     onClick={() => setSelectedSpecialty(s.id)}
                     className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${
                        selectedSpecialty === s.id ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                     }`}
                  >
                     {s.name}
                  </button>
               ))}
            </div>
         </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
         {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               {Array.from({length: 8}).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
                     <div className="aspect-[4/5] bg-slate-200" />
                     <div className="p-5 space-y-3">
                        <div className="h-5 bg-slate-200 rounded w-3/4" />
                        <div className="h-4 bg-slate-200 rounded w-1/2" />
                     </div>
                  </div>
               ))}
            </div>
         ) : filteredDoctors.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <span className="material-symbols-outlined text-[40px]">person_off</span>
               </div>
               <h3 className="text-lg font-bold text-slate-900">Không tìm thấy bác sĩ</h3>
               <p className="text-slate-500 mt-2">Vui lòng thử lại với từ khóa hoặc chuyên khoa khác.</p>
               <button 
                  onClick={() => { setSearchQuery(''); setSelectedSpecialty(null); }}
                  className="mt-6 text-primary font-semibold hover:underline"
               >
                  Xóa bộ lọc
               </button>
            </div>
         ) : selectedSpecialty ? (
            // Display as a flat grid if a specific specialty is selected
            <div>
               <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                     <span className="material-symbols-outlined">medical_services</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">
                     Bác sĩ {specialties?.find(s => s.id === selectedSpecialty)?.name}
                  </h2>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredDoctors.map(doctor => <DoctorCard key={doctor.userId} doctor={doctor} />)}
               </div>
            </div>
         ) : (
            // Display grouped by specialty
            <div className="space-y-16">
               {Object.entries(groupedDoctors).map(([specialtyName, doctors]) => (
                  <section key={specialtyName}>
                     <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                              <span className="material-symbols-outlined text-[20px]">medical_services</span>
                           </div>
                           <h2 className="text-2xl font-bold text-slate-900">{specialtyName}</h2>
                        </div>
                        <button 
                           onClick={() => {
                              const s = specialties?.find(sp => sp.name === specialtyName);
                              if (s) setSelectedSpecialty(s.id);
                           }}
                           className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
                        >
                           Xem thêm <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </button>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {doctors.slice(0, 4).map(doctor => (
                           <DoctorCard key={doctor.userId} doctor={doctor} />
                        ))}
                     </div>
                  </section>
               ))}
            </div>
         )}
      </main>
    </>
  );
}

function DoctorCard({ doctor }: { doctor: PublicDoctorCard }) {
   return (
      <Link href={`/doctors/${doctor.userId}`} className="group rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all hover:shadow-xl hover:shadow-slate-200/50 hover:border-primary/30 flex flex-col">
         <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
            <img 
               alt={doctor.fullName} 
               className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
               src={doctor.avatarUrl || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop'} 
            />
            
            {/* Online Indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
               <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Online</span>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-end justify-center pb-6">
               <div className="bg-primary text-white font-bold px-6 py-2.5 rounded-full text-sm shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  Đặt lịch khám
               </div>
            </div>
         </div>
         <div className="p-5 flex-1 flex flex-col">
            <h4 className="text-lg font-bold text-slate-900 mb-1">{doctor.professionalTitle ? `${doctor.professionalTitle} ` : ''}{doctor.fullName}</h4>
            <p className="text-sm font-semibold text-primary mb-3">
               {doctor.specialties[0]?.name || 'Chuyên gia Y tế'}
            </p>
            
            <div className="mt-auto pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
               <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Giá khám</span>
                  <span className="text-sm font-medium text-slate-700">{Number(doctor.consultationFee).toLocaleString()} ₫</span>
               </div>
               <div className="flex flex-col border-l border-slate-100 pl-3">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Đánh giá</span>
                  <div className="flex items-center gap-1 text-sm font-medium text-slate-700">
                     <span className="material-symbols-outlined text-[14px] text-amber-400" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                     4.9
                  </div>
               </div>
            </div>
         </div>
      </Link>
   );
}
