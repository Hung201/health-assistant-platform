/* eslint-disable react-hooks/rules-of-hooks */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Activity, HeartPulse, Bone, ScanFace, Brain, Eye, Baby, Users,
  Stethoscope, CalendarCheck, FileBadge, ArrowRight, Star, Quote,
  ChevronDown, Check, ChevronUp, MessageSquare, Shield, Clock, Smartphone,
  CheckCircle2, Sparkles, Send, Lock, Bot, User as UserIcon, FileText, Radio
} from 'lucide-react';

import { authApi, doctorsApi, livestreamsApi, publicPostsApi, qaApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

const getSpecialtyIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('nội') || n.includes('tổng quát')) return Activity;
  if (n.includes('tim')) return HeartPulse;
  if (n.includes('xương') || n.includes('khớp')) return Bone;
  if (n.includes('da')) return ScanFace;
  if (n.includes('thần kinh')) return Brain;
  if (n.includes('mắt')) return Eye;
  if (n.includes('nhi')) return Baby;
  if (n.includes('sản') || n.includes('phụ')) return Users;
  return Stethoscope;
};

const FAQS = [
  { question: "Trợ lý AI chẩn đoán có chính xác không?", answer: "AI của chúng tôi được đào tạo dựa trên cơ sở dữ liệu y khoa chuẩn xác. Tuy nhiên, nó chỉ đóng vai trò phân tích sơ bộ và gợi ý chuyên khoa, không thay thế chẩn đoán y khoa chính thức từ bác sĩ." },
  { question: "Tôi có thể hủy lịch khám đã đặt không?", answer: "Bạn có thể hủy lịch khám trước giờ hẹn. Việc hủy sẽ hoàn tất nhanh chóng và phí (nếu có) sẽ được hoàn lại theo chính sách của chúng tôi." },
  { question: "Dữ liệu y tế của tôi có bị chia sẻ không?", answer: "Không. Chúng tôi tuân thủ nghiêm ngặt các tiêu chuẩn bảo mật y tế. Thông tin cá nhân và hồ sơ bệnh án của bạn được mã hóa và bảo mật an toàn." },
  { question: "Chi phí sử dụng nền tảng là bao nhiêu?", answer: "Việc sử dụng Trợ lý AI và đặt lịch hoàn toàn miễn phí. Bạn chỉ thanh toán phí khám bệnh cho bác sĩ theo bảng giá được niêm yết công khai trên hồ sơ của họ." },
];

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      logout();
      router.refresh();
    },
  });

  const { data: specialtiesData } = useQuery({
    queryKey: ['public-specialties-home'],
    queryFn: authApi.specialties,
  });

  const { data: doctorsData } = useQuery({
    queryKey: ['public-doctors-home'],
    queryFn: () => doctorsApi.list({ limit: 4 }),
  });

  const { data: blogsData } = useQuery({
    queryKey: ['public-posts-home'],
    queryFn: () => publicPostsApi.list(1, 3),
  });

  const { data: qaData } = useQuery({
    queryKey: ['public-qa-home'],
    queryFn: () => qaApi.listPublic(1, 4),
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
              AI Phân Tích
            </Link>
            <Link className="text-sm font-semibold text-slate-600 transition-colors hover:text-teal-600" href="/doctors">
              Danh Bạ Bác Sĩ
            </Link>
            <Link className="text-sm font-semibold text-slate-600 transition-colors hover:text-teal-600" href="/blog">
              Blog Y Khoa
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
        <section className="relative overflow-hidden pb-24 pt-16 lg:pb-32 lg:pt-24 bg-[#e6f7f5]/40">
          <div className="absolute inset-0 -z-10 bg-[url('/images/hero-bg.jpg')] bg-cover bg-center opacity-10" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white via-white/90 to-transparent" />

          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-sm font-bold text-teal-700 ring-1 ring-inset ring-teal-600/20">
                <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
                Được hỗ trợ bởi AI Tiên Tiến
              </div>
              <h2 className="mb-6 text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl leading-[1.1]">
                Chẩn đoán sức khỏe <br /> <span className="text-teal-600">thông minh</span> với AI
              </h2>
              <p className="mb-10 text-lg leading-relaxed text-slate-600 max-w-xl">
                Ứng dụng trí tuệ nhân tạo tiên tiến giúp bạn phân tích triệu chứng ban đầu, tìm bác sĩ phù hợp và đặt lịch hẹn khám nhanh chóng ngay tại nhà.
              </p>

              <div className="flex flex-wrap items-center gap-4 mb-16">
                <Link href={aiHref} className="flex items-center gap-2 rounded-full bg-teal-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-teal-600/20 transition-all hover:bg-teal-700 hover:shadow-xl hover:-translate-y-0.5">
                  <Activity size={20} />
                  Thử phân tích với AI
                </Link>
                <Link href="/doctors" className="flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5">
                  Tìm bác sĩ ngay
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-8 border-t border-slate-200/60 pt-8">
                <div>
                  <div className="text-3xl font-extrabold text-slate-900 mb-1">500+</div>
                  <div className="text-sm font-medium text-slate-500">Bác sĩ uy tín</div>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-slate-900 mb-1">50+</div>
                  <div className="text-sm font-medium text-slate-500">Chuyên khoa</div>
                </div>
                <div>
                  <div className="text-3xl font-extrabold text-slate-900 mb-1">98%</div>
                  <div className="text-sm font-medium text-slate-500">Bệnh nhân hài lòng</div>
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

<<<<<<< HEAD
        {/* How it works Section */}
=======
        <section className="border-b border-slate-200 bg-[#f6fbfb] py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-teal-600">Bác sĩ hỏi đáp</h3>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Hỏi bác sĩ miễn phí & Cẩm nang hỏi đáp</h2>
              <p className="mt-3 max-w-3xl text-slate-600">
                Đặt câu hỏi trực tuyến để bác sĩ giải đáp, đồng thời tra cứu kho bài viết chăm sóc sức khỏe phù hợp từng vấn đề.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <Link href="/hoi-bac-si-mien-phi" className="group rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg">
                <div className="overflow-hidden rounded-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1584516150909-c43483ee7930?q=80&w=1200&auto=format&fit=crop"
                    alt="Hỏi bác sĩ miễn phí"
                    className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <h4 className="mt-4 text-3xl font-extrabold text-[#003f87]">Hỏi bác sĩ miễn phí</h4>
                <p className="mt-2 text-sm text-slate-600">Gửi câu hỏi của bạn và nhận phản hồi trực tiếp từ bác sĩ trên hệ thống.</p>
              </Link>
              <Link href="/cam-nang-hoi-dap" className="group rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg">
                <div className="overflow-hidden rounded-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=1200&auto=format&fit=crop"
                    alt="Cẩm nang hỏi đáp"
                    className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <h4 className="mt-4 text-3xl font-extrabold text-[#003f87]">Cẩm nang hỏi đáp</h4>
                <p className="mt-2 text-sm text-slate-600">Tổng hợp các bài viết thực tế từ bác sĩ giúp bạn hiểu bệnh và xử lý đúng cách.</p>
              </Link>
            </div>

            {qaData?.items?.length ? (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h4 className="text-lg font-extrabold text-slate-900">Câu hỏi mới trong cộng đồng</h4>
                  <Link href="/hoi-bac-si-mien-phi" className="text-sm font-bold text-teal-600 hover:text-teal-700">Xem tất cả →</Link>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {qaData.items.slice(0, 4).map((q) => (
                    <Link key={q.id} href={`/hoi-bac-si-mien-phi/${q.id}`} className="rounded-xl border border-slate-200 bg-[#fafafb] p-4 hover:border-teal-300">
                      <p className="line-clamp-2 text-sm font-bold text-slate-900">{q.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{q.status === 'answered' ? 'Đã có bác sĩ trả lời' : 'Đã duyệt, đang chờ bác sĩ phản hồi'}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* Specialties Section */}
>>>>>>> 03f25fbfbe76388ff84e1220bd974623c85f8748
        <section className="bg-white py-24">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h3 className="text-sm font-bold uppercase tracking-widest text-teal-600 mb-3">Quy trình đơn giản</h3>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Cách thức hoạt động</h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                Trải nghiệm chăm sóc sức khỏe liền mạch từ lúc xuất hiện triệu chứng đến khi gặp chuyên gia.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-[2px] bg-slate-100 z-0"></div>

              {[
                { icon: MessageSquare, title: 'Chat với AI', desc: 'Mô tả triệu chứng để AI chẩn đoán sơ bộ.' },
                { icon: Stethoscope, title: 'Gợi ý Chuyên khoa', desc: 'Nhận kết quả chuyên khoa và danh sách bác sĩ phù hợp.' },
                { icon: CalendarCheck, title: 'Đặt lịch hẹn', desc: 'Chọn giờ khám trực tuyến hoặc tại phòng khám.' },
                { icon: FileBadge, title: 'Khám & Hồ sơ', desc: 'Quản lý kết quả và đơn thuốc dễ dàng trên hệ thống.' }
              ].map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="relative z-10 flex flex-col items-center text-center">
                    <div className="h-24 w-24 rounded-full bg-white border-8 border-[#fafafb] shadow-sm flex items-center justify-center text-teal-600 mb-6 relative">
                      <Icon size={32} />
                      <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-sm border-2 border-white">
                        {idx + 1}
                      </div>
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-[200px]">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Specialties Section */}
        <section className="bg-slate-50 py-24">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h3 className="text-sm font-bold uppercase tracking-widest text-teal-600 mb-3">Chuyên khoa</h3>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Tìm bác sĩ theo chuyên khoa</h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                Đội ngũ bác sĩ trải rộng trên nhiều lĩnh vực, sẵn sàng hỗ trợ bạn.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {specialtiesData?.length ? (
                specialtiesData.map((spec, idx) => {
                  const Icon = getSpecialtyIcon(spec.name);
                  return (
                    <Link href={`/doctors?specialtyId=${spec.id}`} key={spec.id} className="group flex flex-col h-full items-start gap-4 rounded-2xl border border-white/60 bg-white/40 backdrop-blur-[20px] p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-teal-200 hover:bg-white/60 hover:scale-[1.02] cursor-pointer animate-in fade-in slide-in-from-bottom-4 zoom-in-95 fill-mode-both" style={{ animationDelay: `${idx * 50}ms` }}>
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                        <Icon size={24} />
                      </div>
                      <div className="flex flex-col flex-1 w-full mt-2">
                        <h4 className="font-bold text-slate-900 mb-1 line-clamp-2 group-hover:text-teal-700 transition-colors">{spec.name}</h4>
                        <p className="text-xs font-semibold text-slate-400 mt-auto pt-2">Khám ngay →</p>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12 text-slate-500">Đang tải chuyên khoa...</div>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-white py-24">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-teal-600 mb-3">Tính năng nổi bật</h3>
                <h2 className="text-3xl font-extrabold text-slate-900 mb-6">Tại sao nên chọn Clinical Precision?</h2>
                <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                  Chúng tôi mang đến giải pháp y tế số hiện đại, giúp bạn kết nối nhanh chóng với các chuyên gia và quản lý sức khỏe hiệu quả.
                </p>
                <div className="space-y-6">
                  {[
                    { icon: Brain, title: 'Công nghệ AI Chẩn đoán', desc: 'Tiếp cận kết quả phân tích y khoa chuẩn xác dựa trên trí tuệ nhân tạo.' },
                    { icon: Shield, title: 'Đội ngũ bác sĩ xác thực 100%', desc: 'Tất cả bác sĩ đều được kiểm duyệt chứng chỉ hành nghề và năng lực.' },
                    { icon: Clock, title: 'Hỗ trợ linh hoạt 24/7', desc: 'Đặt lịch mọi lúc, mọi nơi không lo giới hạn thời gian.' },
                    { icon: Smartphone, title: 'Bảo mật thông tin chuẩn y tế', desc: 'Hồ sơ sức khỏe của bạn được mã hóa hoàn toàn.' }
                  ].map((feat, i) => {
                    const Icon = feat.icon;
                    return (
                      <div key={i} className="flex gap-4">
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                          <Icon size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{feat.title}</h4>
                          <p className="text-sm text-slate-500 mt-1">{feat.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-teal-500 rounded-3xl transform translate-x-4 translate-y-4 -z-10"></div>
                <img
                  src="https://i.pinimg.com/736x/18/f4/ba/18f4ba44da7af0576d581aab54efa5f3.jpg"
                  alt="Doctor with patient"
                  className="rounded-3xl shadow-xl w-full object-cover h-[500px]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Top Doctors Section */}
        <section className="bg-slate-50 py-24">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-teal-600 mb-3">Bác sĩ ưu tú</h3>
                <h2 className="text-3xl font-extrabold text-slate-900">Đội ngũ chuyên gia hàng đầu</h2>
              </div>
              <Link className="inline-flex items-center gap-1 text-sm font-bold text-teal-600 hover:text-teal-700 group" href="/doctors">
                Xem tất cả
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {doctorsData?.items?.length ? (
                doctorsData.items.map((doctor, idx) => (
                  <Link
                    className="group flex flex-col h-full overflow-hidden rounded-2xl border border-white/60 bg-white/40 backdrop-blur-[20px] shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4 zoom-in-95 fill-mode-both"
                    style={{ animationDelay: `${idx * 100}ms` }}
                    key={doctor.userId}
                    href={`/doctors/${doctor.userId}`}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-slate-100 shrink-0">
                      <img
                        alt={doctor.fullName}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        src={doctor.avatarUrl || '/images/default-avatar.jpg'}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <h4 className="text-lg font-bold text-slate-900 mb-1 line-clamp-2">
                        {doctor.professionalTitle ? `${doctor.professionalTitle} ` : ''}{doctor.fullName}
                      </h4>
                      <p className="text-sm font-semibold text-teal-600 line-clamp-1 mt-auto pt-2">
                        {doctor.specialties?.[0]?.name || 'Đa khoa'}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-4 text-center py-12 text-slate-500">
                  Đang tải danh sách bác sĩ...
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-teal-600 py-24 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500 rounded-full blur-3xl opacity-50 transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-700 rounded-full blur-3xl opacity-50 transform -translate-x-1/2 translate-y-1/2"></div>

          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-extrabold mb-4">Hàng ngàn người đã tin tưởng sử dụng</h2>
              <p className="text-teal-100 max-w-2xl mx-auto">
                Những chia sẻ thực tế từ bệnh nhân sau khi sử dụng hệ thống đặt khám thông minh.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { name: 'Nguyễn Văn A', role: 'Bệnh nhân', text: 'Nhờ AI phân tích, tôi đã biết mình cần khám khoa Nội tiết thay vì Tim mạch. Đặt lịch với bác sĩ rất nhanh chóng và không phải chờ đợi.' },
                { name: 'Trần Thị B', role: 'Bệnh nhân', text: 'Ứng dụng cực kỳ tiện lợi. Tôi có thể xem hồ sơ bác sĩ chi tiết trước khi đặt hẹn. Các bác sĩ tư vấn rất nhiệt tình và chuyên môn cao.' },
                { name: 'Lê Hoàng C', role: 'Bệnh nhân', text: 'Bảo mật thông tin tốt, tôi hoàn toàn yên tâm. Trải nghiệm từ lúc nhập triệu chứng đến lúc đến phòng khám đều rất trơn tru.' }
              ].map((review, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 relative">
                  <Quote size={40} className="text-teal-300/30 absolute top-4 right-4" />
                  <div className="flex items-center gap-1 mb-6 text-yellow-400">
                    {[...Array(5)].map((_, j) => <Star key={j} size={16} fill="currentColor" />)}
                  </div>
                  <p className="text-teal-50 italic mb-6 leading-relaxed">"{review.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-teal-500 flex items-center justify-center font-bold text-white">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{review.name}</h4>
                      <p className="text-xs text-teal-200">{review.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Section */}
        <section className="bg-white py-24 border-b border-slate-100">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-teal-600 mb-3">Blog y khoa</h3>
                <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Kiến thức sức khỏe & Cộng đồng</h2>
              </div>
              <Link className="inline-flex items-center gap-1 text-sm font-bold text-teal-600 hover:text-teal-700 group" href="/blog">
                Xem tất cả bài viết
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {blogsData?.items?.length ? (
                blogsData.items.map((article, idx) => (
                  <article
                    className="group flex flex-col h-full overflow-hidden rounded-2xl border border-white/60 bg-white/40 backdrop-blur-[20px] shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4 zoom-in-95 fill-mode-both"
                    style={{ animationDelay: `${idx * 100}ms` }}
                    key={article.id}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 shrink-0">
                      <img
                        alt={article.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        src={article.thumbnailUrl || '/images/default-blog.jpg'}
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

        {/* Partners Section */}
        <section className="bg-slate-50 py-16 border-b border-slate-200">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <h3 className="text-center text-sm font-bold text-slate-400 mb-8 uppercase tracking-widest">ĐỐI TÁC Y TẾ & CÔNG NGHỆ</h3>
            <div className="flex flex-wrap justify-center gap-12 items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="text-2xl font-bold font-serif">MedCare+</div>
              <div className="text-2xl font-bold font-mono">HealthSync</div>
              <div className="text-2xl font-bold">VietHospital</div>
              <div className="text-2xl font-bold italic">TechPharma</div>
              <div className="text-2xl font-bold">CloudHealth</div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-white py-24">
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Câu hỏi thường gặp</h2>
              <p className="text-slate-500">Giải đáp nhanh những thắc mắc của bạn về nền tảng.</p>
            </div>

            <div className="space-y-4">
              {FAQS.map((faq, index) => (
                <div key={index} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full text-left px-6 py-4 flex items-center justify-between font-bold text-slate-900 hover:bg-slate-50 focus:outline-none"
                  >
                    {faq.question}
                    {openFaq === index ? <ChevronUp size={20} className="text-teal-600" /> : <ChevronDown size={20} className="text-slate-400" />}
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-4 pt-2 text-slate-600 text-sm leading-relaxed border-t border-slate-100 bg-slate-50">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 pt-16 pb-8 text-slate-300">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <Link className="flex items-center gap-2 mb-4" href="/">
                <div className="rounded-lg bg-teal-500 p-1.5 text-white">
                  <Activity size={20} />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white">Clinical Precision</h2>
              </Link>
              <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
                Nền tảng y tế số thông minh, ứng dụng AI để phân tích triệu chứng và kết nối người bệnh với chuyên gia y tế uy tín.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Về chúng tôi</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-teal-400 transition-colors">Giới thiệu</Link></li>
                <li><Link href="/doctors" className="hover:text-teal-400 transition-colors">Danh bạ bác sĩ</Link></li>
                <li><Link href="/blog" className="hover:text-teal-400 transition-colors">Blog sức khỏe</Link></li>
                <li><Link href="#" className="hover:text-teal-400 transition-colors">Liên hệ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-teal-400 transition-colors">Câu hỏi thường gặp</Link></li>
                <li><Link href="#" className="hover:text-teal-400 transition-colors">Điều khoản sử dụng</Link></li>
                <li><Link href="#" className="hover:text-teal-400 transition-colors">Chính sách bảo mật</Link></li>
                <li><Link href="#" className="hover:text-teal-400 transition-colors">Hướng dẫn đặt lịch</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
            <p>© 2026 ETHOS CLINICAL SYSTEMS. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-4">
              <span>Hotline: 1900 1234</span>
              <span>Email: support@clinicalprecision.com</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


