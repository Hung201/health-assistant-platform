/* eslint-disable react-hooks/rules-of-hooks */
'use client';

import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Activity,
  HeartPulse,
  Bone,
  ScanFace,
  Brain,
  Eye,
  Baby,
  Users,
  CheckCircle2,
  Shield,
  Sparkles,
  Send,
  Lock,
  Bot,
  User as UserIcon,
  Clock,
  FileText,
  Radio,
} from 'lucide-react';

import { authApi, doctorsApi, livestreamsApi, publicPostsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

const SPECIALTIES = [
  { name: 'Nội khoa', desc: 'Khám và điều trị bệnh nội tổng quát', icon: Activity },
  { name: 'Tim mạch', desc: 'Chẩn đoán và điều trị bệnh tim', icon: HeartPulse },
  { name: 'Xương khớp', desc: 'Điều trị bệnh cơ xương khớp', icon: Bone },
  { name: 'Da liễu', desc: 'Chăm sóc và điều trị da', icon: ScanFace },
  { name: 'Thần kinh', desc: 'Điều trị bệnh lý thần kinh', icon: Brain },
  { name: 'Mắt', desc: 'Khám và phẫu thuật mắt', icon: Eye },
  { name: 'Nhi khoa', desc: 'Chăm sóc sức khỏe trẻ em', icon: Baby },
  { name: 'Sản phụ khoa', desc: 'Chăm sóc sức khỏe phụ nữ', icon: Users },
];

export default function Home() {
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

  const { data: doctorsData } = useQuery({
    queryKey: ['public-doctors-home'],
    queryFn: () => doctorsApi.list({ limit: 4 }),
  });
  
  const { data: blogsData } = useQuery({
    queryKey: ['public-posts-home'],
    queryFn: () => publicPostsApi.list(1, 3),
  });

  const { data: liveStreams } = useQuery({
    queryKey: ['public-livestreams-home'],
    queryFn: () => livestreamsApi.listLive(),
    staleTime: 15_000,
  });

  const appHref = user?.roles?.includes('admin')
    ? '/admin'
    : user?.roles?.includes('doctor')
      ? '/doctor'
      : user
        ? '/patient'
        : '/login';

  const aiHref = user ? '/patient/ai-assistant' : '/ai';

  return (
    <div className="min-h-screen bg-[#fafafb] text-slate-900 font-sans">
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md">
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
            <Link className="text-sm font-semibold text-slate-600 transition-colors hover:text-teal-600" href="/doctors">
              Bác sĩ
            </Link>
            <Link className="text-sm font-semibold text-slate-600 transition-colors hover:text-teal-600" href="/blog">
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

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden pb-24 pt-16 lg:pb-32 lg:pt-24 bg-[#e6f7f5]/30">
          <div className="absolute inset-0 -z-10 bg-[url('https://images.unsplash.com/photo-1576091160550-2173ff9e5ee5?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-10" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white via-white/90 to-transparent" />
          
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-sm font-bold text-teal-700 ring-1 ring-inset ring-teal-600/20">
                <span className="flex h-2 w-2 rounded-full bg-teal-500"></span>
                Được hỗ trợ bởi AI
              </div>
              <h2 className="mb-6 text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl leading-[1.1]">
                Chẩn đoán sức khỏe <br /> <span className="text-teal-600">thông minh</span> với AI
              </h2>
              <p className="mb-10 text-lg leading-relaxed text-slate-600 max-w-xl">
                Ứng dụng trí tuệ nhân tạo tiên tiến giúp bạn phân tích triệu chứng ban đầu, tìm bác sĩ phù hợp và đặt lịch khám nhanh chóng.
              </p>
              
              <div className="flex flex-wrap items-center gap-4 mb-16">
                <Link href={aiHref} className="flex items-center gap-2 rounded-full bg-teal-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-teal-600/20 transition-all hover:bg-teal-700 hover:shadow-xl hover:-translate-y-0.5">
                  <Activity size={20} />
                  Thử phân tích với AI
                </Link>
                <button className="flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5">
                  Tìm hiểu thêm
                </button>
              </div>

              <div className="grid grid-cols-3 gap-8 border-t border-slate-200/60 pt-8">
                <div>
                  <div className="text-3xl font-extrabold text-slate-900 mb-1">1,200+</div>
                  <div className="text-sm font-medium text-slate-500">Bác sĩ uy tín</div>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-slate-900 mb-1">50+</div>
                  <div className="text-sm font-medium text-slate-500">Chuyên khoa</div>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-slate-900 mb-1">98%</div>
                  <div className="text-sm font-medium text-slate-500">Hài lòng</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {liveStreams && liveStreams.length > 0 ? (
          <section className="border-b border-slate-200 bg-white py-12">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-6 flex items-center gap-2">
                <Radio className="h-5 w-5 text-red-500" aria-hidden />
                <h3 className="text-sm font-bold uppercase tracking-widest text-teal-600">Trực tiếp</h3>
              </div>
              <h2 className="mb-2 text-2xl font-extrabold text-slate-900">Đang phát trực tiếp</h2>
              <p className="mb-8 text-slate-500">Tham gia buổi chia sẻ từ bác sĩ của nền tảng.</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {liveStreams.map((s) => (
                  <Link
                    key={s.id}
                    href={`/live/${s.id}`}
                    className="group flex flex-col rounded-2xl border border-slate-200 bg-[#fafafb] p-5 shadow-sm transition-all hover:border-teal-300 hover:shadow-md"
                  >
                    <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-bold text-red-600">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                      LIVE
                    </span>
                    <p className="font-bold text-slate-900 group-hover:text-teal-700">{s.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{s.doctorName}</p>
                    <span className="mt-4 text-sm font-semibold text-teal-600">Xem ngay →</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* Specialties Section */}
        <section className="bg-white py-24">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h3 className="text-sm font-bold uppercase tracking-widest text-teal-600 mb-3">Chuyên khoa</h3>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Tìm bác sĩ theo chuyên khoa</h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                Đội ngũ bác sĩ trải rộng trên nhiều lĩnh vực, sẵn sàng hỗ trợ bạn.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {SPECIALTIES.map((spec) => {
                const Icon = spec.icon;
                return (
                  <div key={spec.name} className="group flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-teal-100 hover:bg-teal-50/30 cursor-pointer">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                      <Icon size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">{spec.name}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">{spec.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Top Doctors Section */}
        <section className="bg-[#fafafb] py-24">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-teal-600 mb-3">Bác sĩ ưu tú</h3>
                <h2 className="text-3xl font-extrabold text-slate-900">Đội ngũ chuyên gia hàng đầu</h2>
              </div>
              <a className="inline-flex items-center gap-1 text-sm font-bold text-teal-600 hover:text-teal-700 group" href="#">
                Xem tất cả
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </a>
            </div>
            
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {doctorsData?.items?.length ? (
                doctorsData.items.map((doctor) => (
                  <article
                    className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
                    key={doctor.userId}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
                      <img 
                        alt={doctor.fullName} 
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        src={doctor.avatarUrl || 'https://images.unsplash.com/photo-1612349317150-e410f624c427?q=80&w=2070&auto=format&fit=crop'} 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <div className="p-6">
                      <h4 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1">
                        {doctor.professionalTitle ? `${doctor.professionalTitle} ` : ''}{doctor.fullName}
                      </h4>
                      <p className="text-sm font-semibold text-teal-600 line-clamp-1">
                        {doctor.specialties?.[0]?.name || 'Đa khoa'}
                      </p>
                    </div>
                  </article>
                ))
              ) : (
                <div className="col-span-4 text-center py-12 text-slate-500">
                  Đang tải danh sách bác sĩ...
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Blog Section */}
        <section className="bg-white py-24 border-t border-slate-100">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h3 className="text-sm font-bold uppercase tracking-widest text-teal-600 mb-3">Blog y khoa</h3>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Kiến thức sức khỏe & Cộng đồng</h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-500">
                Cập nhật những thông tin y khoa mới nhất từ đội ngũ chuyên gia.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {blogsData?.items?.length ? (
                blogsData.items.map((article) => (
                  <article
                    className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-xl hover:ring-slate-200"
                    key={article.id}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                      <img 
                        alt={article.title} 
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        src={article.thumbnailUrl || 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=2070&auto=format&fit=crop'} 
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-6 lg:p-8">
                      <div className="mb-4">
                        <span className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-teal-700">
                          {article.postType === 'blog' ? 'Kiến thức' : article.postType}
                        </span>
                      </div>
                      <h4 className="mb-3 text-xl font-bold text-slate-900 line-clamp-2 group-hover:text-teal-600 transition-colors">
                        {article.title}
                      </h4>
                      <p className="mb-6 text-sm text-slate-500 line-clamp-3 flex-1">
                        {article.excerpt || 'Không có mô tả cho bài viết này.'}
                      </p>
                      <Link className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-teal-600 hover:text-teal-700" href={`/blog/${article.slug}`}>
                        Đọc thêm <span className="transition-transform group-hover:translate-x-1">→</span>
                      </Link>
                    </div>
                  </article>
                ))
              ) : (
                <div className="col-span-3 text-center py-12 text-slate-500">
                  Đang tải bài viết...
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-100 py-8 border-t border-slate-200">
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

