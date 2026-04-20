/* eslint-disable react-hooks/rules-of-hooks */
'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { authApi, doctorsApi, publicPostsApi } from '@/lib/api';

export default function Home() {
  const { data: specialties } = useQuery({
    queryKey: ['specialties'],
    queryFn: () => authApi.specialties(),
  });

  const { data: doctorsData } = useQuery({
    queryKey: ['public-doctors'],
    queryFn: () => doctorsApi.list({ limit: 4 }),
  });

  const { data: postsData } = useQuery({
    queryKey: ['public-posts'],
    queryFn: () => publicPostsApi.list(1, 3),
  });

  return (
    <main>
      {/* Hero Section */}
      <section className="relative overflow-hidden pb-24 pt-16 lg:pb-40 lg:pt-24 bg-white">
        <div className="absolute inset-0 -z-10 w-full h-full">
           <img src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop" alt="Hero background" className="w-full h-full object-cover opacity-20 mix-blend-luminosity" />
           <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" />
        </div>
        
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 mb-6">
              <span className="material-symbols-outlined text-[16px] text-primary">auto_awesome</span>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Được hỗ trợ bởi AI</span>
            </div>
            <h2 className="mb-6 text-5xl font-extrabold tracking-tight sm:text-6xl text-slate-900 leading-tight">
              Chẩn đoán sức khỏe <br/> <span className="text-primary">thông minh</span> với AI
            </h2>
            <p className="mb-10 text-lg leading-relaxed text-slate-600 max-w-xl">
              Ứng dụng trí tuệ nhân tạo tiên tiến giúp bạn phân tích triệu chứng ban đầu, tìm bác sĩ phù hợp và đặt lịch khám nhanh chóng.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 mb-12">
              <Link href="/ai-assistant" className="rounded-xl bg-primary px-8 py-3.5 font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 flex items-center gap-2 hover:-translate-y-1">
                <span className="material-symbols-outlined">health_and_safety</span>
                Thử phân tích với AI
              </Link>
              <button className="rounded-xl bg-white border-2 border-slate-200 px-8 py-3.5 font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300">
                Khám phá chuyên khoa
              </button>
            </div>

            <div className="grid grid-cols-3 gap-8 border-t border-slate-200 pt-8 max-w-lg">
              <div>
                <div className="text-3xl font-extrabold text-slate-900">1,200+</div>
                <div className="text-sm font-medium text-slate-500 mt-1">Bác sĩ uy tín</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-900">50+</div>
                <div className="text-sm font-medium text-slate-500 mt-1">Chuyên khoa</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-900">98%</div>
                <div className="text-sm font-medium text-slate-500 mt-1">Hài lòng</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specialties Section */}
      <section className="bg-[#f8f9fa] py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h4 className="text-primary font-bold uppercase tracking-widest text-sm mb-2">Chuyên khoa</h4>
            <h3 className="text-3xl font-bold text-slate-900">Tìm bác sĩ theo chuyên khoa</h3>
            <p className="mt-4 text-slate-500">Đội ngũ bác sĩ trải rộng trên nhiều lĩnh vực, sẵn sàng hỗ trợ bạn.</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {specialties?.map((specialty) => (
              <div key={specialty.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-xl text-primary">
                  <span className="material-symbols-outlined text-[24px]">medical_services</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{specialty.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">Chẩn đoán và điều trị bệnh chuyên sâu.</p>
                </div>
              </div>
            ))}
            {!specialties && Array.from({length: 8}).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-start gap-4 animate-pulse">
                <div className="bg-slate-200 w-12 h-12 rounded-xl"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Doctors Section */}
      <section className="bg-white py-20 border-t border-slate-100">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h4 className="text-primary font-bold uppercase tracking-widest text-sm mb-2">Bác sĩ ưu tú</h4>
              <h3 className="text-3xl font-bold text-slate-900">Đội ngũ chuyên gia hàng đầu</h3>
            </div>
            <a className="text-sm font-bold text-primary hover:underline flex items-center gap-1" href="/doctors">
              Xem tất cả <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </a>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {doctorsData?.items.map((doctor) => (
              <article
                className="group rounded-2xl border border-slate-100 bg-white overflow-hidden transition-all hover:shadow-xl hover:shadow-slate-200/50 hover:border-primary/30"
                key={doctor.userId}
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
                  <img alt={doctor.fullName} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" src={doctor.avatarUrl || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop'} />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-end justify-center pb-6">
                    <button className="bg-primary text-white font-bold px-6 py-2.5 rounded-full text-sm shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      Đặt lịch khám
                    </button>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h4 className="text-lg font-bold text-slate-900 mb-1">{doctor.professionalTitle ? `${doctor.professionalTitle} ` : ''}{doctor.fullName}</h4>
                  <p className="text-sm font-semibold text-primary mb-3">
                    {doctor.specialties[0]?.name || 'Chuyên gia Y tế'}
                  </p>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                     <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Kinh nghiệm</span>
                        <span className="text-sm font-medium text-slate-700">10+ Năm</span>
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
              </article>
            ))}
            {!doctorsData && Array.from({length: 4}).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-white overflow-hidden animate-pulse">
                <div className="aspect-[4/5] bg-slate-200"></div>
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="bg-[#f8f9fa] py-24 border-t border-slate-100">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h4 className="text-primary font-bold uppercase tracking-widest text-sm mb-2">Blog Y Khoa</h4>
            <h3 className="text-3xl font-bold text-slate-900">Kiến thức sức khỏe & Cộng đồng</h3>
            <p className="mx-auto mt-4 max-w-2xl text-slate-500">
              Cập nhật những thông tin y khoa mới nhất từ đội ngũ chuyên gia.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {postsData?.items.map((article) => (
              <article
                className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 border border-transparent"
                key={article.id}
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 group">
                  <img alt={article.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" src={article.thumbnailUrl || 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=2070&auto=format&fit=crop'} />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-4">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                      {article.postType === 'article' ? 'Kiến thức' : article.postType === 'news' ? 'Tin tức' : 'Sức khỏe'}
                    </span>
                  </div>
                  <h4 className="mb-3 text-xl font-bold text-slate-900 line-clamp-2">{article.title}</h4>
                  <p className="mb-6 text-sm text-slate-500 line-clamp-3">{article.excerpt}</p>
                  <a className="mt-auto text-sm font-bold text-primary hover:underline flex items-center gap-1 w-fit" href={`/blog/${article.slug}`}>
                    Đọc thêm <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </a>
                </div>
              </article>
            ))}
            {!postsData && Array.from({length: 3}).map((_, i) => (
              <div key={i} className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm animate-pulse border border-slate-100">
                <div className="aspect-[16/10] bg-slate-200"></div>
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  <div className="h-6 bg-slate-200 rounded w-full"></div>
                  <div className="h-16 bg-slate-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
