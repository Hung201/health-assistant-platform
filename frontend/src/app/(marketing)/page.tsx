/* eslint-disable react-hooks/rules-of-hooks */
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Activity, Brain,
  Stethoscope, CalendarCheck, FileBadge,
  ChevronDown, MessageSquare, Shield, Clock, Smartphone, Radio,
  ChevronLeft, ChevronRight
} from 'lucide-react';

import { authApi, doctorsApi, livestreamsApi, publicPostsApi, qaApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import './marketing.css';

const getSpecialtyImage = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes('nội') || n.includes('tổng quát')) return '/images/specialties/internal-medicine.png';
  if (n.includes('tim')) return '/images/specialties/cardiology.png';
  if (n.includes('xương') || n.includes('khớp')) return '/images/specialties/orthopedics.png';
  if (n.includes('da')) return '/images/specialties/dermatology.png';
  if (n.includes('thần kinh')) return '/images/specialties/neurology.png';
  if (n.includes('mắt')) return '/images/specialties/ophthalmology.png';
  if (n.includes('nhi')) return '/images/specialties/pediatrics.png';
  if (n.includes('sản') || n.includes('phụ')) return '/images/specialties/obstetrics.png';
  return '/images/specialties/default.png';
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
  const [scrolled, setScrolled] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollSpecialties = (dir: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: dir === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll('.animate-on-scroll');
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

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
    <>
      {/* ── HERO ── */}
        {/* ── HERO ── */}
        <section className="hero-section relative overflow-hidden py-20 lg:py-28">
          <div className="hero-mesh" />
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

              {/* Left: text */}
              <div className="animate-on-scroll">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#E8F8F2] px-3 py-1.5 text-sm font-semibold text-[#0D9E75] ring-1 ring-inset ring-[#0D9E75]/20">
                  <span className="flex h-2 w-2 rounded-full bg-[#0D9E75] animate-pulse" />
                  Được hỗ trợ bởi AI Tiên Tiến
                </div>
                <h1 className="mb-5 text-[48px] font-bold tracking-tight text-slate-900 leading-[1.1]">
                  Chẩn đoán sức khỏe <br />
                  <span className="text-[#0D9E75]">thông minh</span> với AI
                </h1>
                <p className="mb-8 text-base leading-relaxed text-slate-600 max-w-lg">
                  Ứng dụng trí tuệ nhân tạo tiên tiến giúp bạn phân tích triệu chứng ban đầu, tìm bác sĩ phù hợp và đặt lịch hẹn khám nhanh chóng ngay tại nhà.
                </p>
                <div className="flex flex-col sm:flex-row items-start gap-3 mb-10">
                  <Link href={aiHref} className="btn-primary">
                    <Activity size={18} />
                    Thử phân tích với AI
                  </Link>
                  <Link href="/doctors" className="btn-secondary">
                    Tìm bác sĩ ngay
                  </Link>
                </div>
                {/* Stats bar */}
                <div className="grid grid-cols-3 gap-6 border-t border-slate-200/70 pt-8">
                  {[
                    { n: '500+', label: 'Bác sĩ uy tín' },
                    { n: '50+',  label: 'Chuyên khoa' },
                    { n: '98%',  label: 'Bệnh nhân hài lòng' },
                  ].map(s => (
                    <div key={s.label} className="stat-item">
                      <span className="stat-number">{s.n}</span>
                      <span className="stat-label">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: AI chat mockup */}
              <div className="hidden lg:flex justify-center items-center">
                <div className="relative">
                  <div className="ai-chat-glow" />
                  <div className="ai-chat-card w-[340px]">
                    {/* Header */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-[#0D9E75]">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <Activity size={16} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Trợ lý AI</p>
                        <p className="text-[11px] text-green-100">Đang hoạt động</p>
                      </div>
                    </div>
                    {/* Messages */}
                    <div className="px-5 py-4 space-y-3 bg-[#f8fffe]">
                      <div className="flex gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#0D9E75]/10 flex items-center justify-center flex-shrink-0">
                          <Activity size={12} className="text-[#0D9E75]" />
                        </div>
                        <div className="bg-white rounded-2xl rounded-tl-none px-3 py-2 text-xs text-slate-700 shadow-sm max-w-[200px]">
                          Xin chào! Bạn đang có triệu chứng gì?
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <div className="bg-[#0D9E75] rounded-2xl rounded-tr-none px-3 py-2 text-xs text-white max-w-[200px]">
                          Tôi bị đau đầu và sốt nhẹ 2 ngày nay
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#0D9E75]/10 flex items-center justify-center flex-shrink-0">
                          <Activity size={12} className="text-[#0D9E75]" />
                        </div>
                        <div className="bg-white rounded-2xl rounded-tl-none px-3 py-2 text-xs text-slate-700 shadow-sm max-w-[210px]">
                          Dựa vào triệu chứng, tôi gợi ý bạn khám <strong className="text-[#0D9E75]">Nội tổng quát</strong> hoặc <strong className="text-[#0D9E75]">Tai Mũi Họng</strong>.
                        </div>
                      </div>
                    </div>
                    {/* Input */}
                    <div className="px-4 py-3 border-t border-slate-100 flex gap-2 items-center">
                      <div className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-400">Nhập triệu chứng của bạn…</div>
                      <div className="w-8 h-8 rounded-lg bg-[#0D9E75] flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      </div>
                    </div>
                  </div>
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

        {/* QA Section */}
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
                    src="/images/ask-doctor.png"
                    alt="Hỏi bác sĩ miễn phí"
                    className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <h4 className="mt-4 text-3xl font-extrabold text-[#003f87]">Hỏi bác sĩ miễn phí</h4>
                <p className="mt-2 text-sm text-slate-600">Gửi câu hỏi của bạn và nhận phản hồi trực tiếp từ bác sĩ trên hệ thống.</p>
              </Link>
              <Link href="/blog" className="group rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg">
                <div className="overflow-hidden rounded-2xl">
                  <img
                    src="/images/health-handbook.png"
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

        {/* ── HOW IT WORKS ── */}
        <section className="bg-white py-20 animate-on-scroll">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-14 text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-[#0D9E75] mb-2">Quy trình đơn giản</p>
              <h2 className="text-[36px] font-bold text-slate-900 mb-3">Cách thức hoạt động</h2>
              <p className="text-slate-500 max-w-xl mx-auto text-base">Trải nghiệm chăm sóc sức khỏe liền mạch từ lúc xuất hiện triệu chứng đến khi gặp chuyên gia.</p>
            </div>
            <div className="flex flex-col md:flex-row items-start gap-0 md:gap-0">
              {[
                { icon: MessageSquare, title: 'Chat với AI', desc: 'Mô tả triệu chứng để AI chẩn đoán sơ bộ.' },
                { icon: Stethoscope,  title: 'Gợi ý Chuyên khoa', desc: 'Nhận kết quả và danh sách bác sĩ phù hợp.' },
                { icon: CalendarCheck,title: 'Đặt lịch hẹn', desc: 'Chọn giờ khám trực tuyến hoặc tại phòng khám.' },
                { icon: FileBadge,    title: 'Khám & Hồ sơ', desc: 'Quản lý kết quả và đơn thuốc dễ dàng trên hệ thống.' },
              ].map((step, idx, arr) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="flex md:flex-col flex-1 items-start md:items-center gap-4 md:gap-0 step-card" style={{ animationDelay: `${idx * 0.15}s` }}>
                    <div className="flex md:flex-col items-center w-full">
                      <div className="step-icon-wrap mx-auto mb-0 md:mb-4 relative">
                        <Icon size={28} />
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#0D9E75] text-white text-[10px] font-bold flex items-center justify-center border border-white">{idx+1}</span>
                      </div>
                      {idx < arr.length - 1 && (
                        <div className="hidden md:block stepper-connector mx-2" />
                      )}
                    </div>
                    <div className="md:text-center px-3 pb-6">
                      <h4 className="text-[16px] font-semibold text-slate-900 mb-1">{step.title}</h4>
                      <p className="text-[14px] text-slate-500 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── SPECIALTIES ── */}
        <section className="bg-[#f8fafb] py-20 animate-on-scroll">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div className="text-left">
                <p className="text-sm font-semibold uppercase tracking-widest text-[#0D9E75] mb-2">Chuyên khoa</p>
                <h2 className="text-[36px] font-bold text-slate-900 mb-3">Tìm bác sĩ theo chuyên khoa</h2>
                <p className="text-slate-500 max-w-xl text-base">Đội ngũ bác sĩ trải rộng trên nhiều lĩnh vực, sẵn sàng hỗ trợ bạn.</p>
              </div>
              <div className="hidden sm:flex gap-3">
                <button onClick={() => scrollSpecialties('left')} className="w-12 h-12 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-[#0D9E75] hover:border-[#0D9E75] hover:shadow-md transition-all active:scale-95">
                  <ChevronLeft size={24} />
                </button>
                <button onClick={() => scrollSpecialties('right')} className="w-12 h-12 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-[#0D9E75] hover:border-[#0D9E75] hover:shadow-md transition-all active:scale-95">
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
            <div ref={scrollContainerRef} className="flex gap-5 overflow-x-auto pb-6 snap-x snap-mandatory hide-scrollbar">
              {specialtiesData?.length ? (
                specialtiesData.map((spec, idx) => {
                  const imgSrc = getSpecialtyImage(spec.name);
                  return (
                    <Link href={`/doctors?specialtyId=${spec.id}`} key={spec.id} className="specialty-card shrink-0 w-[280px] snap-start" style={{ animationDelay: `${idx * 40}ms` }}>
                      <div className="specialty-img-wrap">
                        <img src={imgSrc} alt={spec.name} className="specialty-img" />
                      </div>
                      <div>
                        <h4 className="text-[15px] font-semibold text-slate-900 leading-snug line-clamp-2">{spec.name}</h4>
                        <p className="text-[12px] text-[#0D9E75] font-medium mt-1">Khám ngay →</p>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="w-full text-center py-12 text-slate-500">Đang tải chuyên khoa...</div>
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
                  src="/images/feature-ai.png"
                  alt="AI-powered healthcare diagnostics"
                  className="rounded-3xl shadow-xl w-full object-cover h-[500px]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── TOP DOCTORS ── */}
        <section className="bg-[#f8fafb] py-20 animate-on-scroll">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-[#0D9E75] mb-2">Bác sĩ ưu tú</p>
                <h2 className="text-[36px] font-bold text-slate-900">Đội ngũ chuyên gia hàng đầu</h2>
              </div>
              <Link className="text-sm font-semibold text-[#0D9E75] hover:text-[#0B8A65] hover:underline inline-flex items-center gap-1" href="/doctors">Xem tất cả <span>→</span></Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {doctorsData?.items?.length ? (
                doctorsData.items.map((doctor, idx) => (
                  <Link key={doctor.userId} href={`/doctors/${doctor.userId}`} className="doctor-card">
                    <div className="relative overflow-hidden bg-slate-100" style={{ aspectRatio: '3/4' }}>
                      <img
                        alt={doctor.fullName}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        src={doctor.avatarUrl || '/images/default-avatar.jpg'}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200" />
                    </div>
                    <div className="p-5 flex flex-col gap-2">
                      <h4 className="text-[15px] font-semibold text-slate-900 line-clamp-2">
                        {doctor.professionalTitle ? `${doctor.professionalTitle} ` : ''}{doctor.fullName}
                      </h4>
                      <span className="doctor-badge w-fit">{doctor.specialties?.[0]?.name || 'Đa khoa'}</span>
                      <span className="doctor-see-more mt-1">Xem hồ sơ →</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-4 text-center py-12 text-slate-500">Đang tải danh sách bác sĩ...</div>
              )}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="testimonial-section py-20 animate-on-scroll">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-[#0D9E75] mb-2">Đánh giá thực tế</p>
              <h2 className="text-[36px] font-bold text-slate-900 mb-3">Hàng ngàn người đã tin tưởng</h2>
              <p className="text-slate-500 max-w-xl mx-auto">Những chia sẻ từ bệnh nhân sau khi sử dụng hệ thống đặt khám thông minh.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {[
                { name: 'Nguyễn Văn A', role: 'Bệnh nhân', text: 'Nhờ AI phân tích, tôi đã biết mình cần khám khoa Nội tiết thay vì Tim mạch. Đặt lịch với bác sĩ rất nhanh chóng và không phải chờ đợi.' },
                { name: 'Trần Thị B',   role: 'Bệnh nhân', text: 'Ứng dụng cực kỳ tiện lợi. Tôi có thể xem hồ sơ bác sĩ chi tiết trước khi đặt hẹn. Các bác sĩ tư vấn rất nhiệt tình và chuyên môn cao.' },
                { name: 'Lê Hoàng C',   role: 'Bệnh nhân', text: 'Bảo mật thông tin tốt, tôi hoàn toàn yên tâm. Trải nghiệm từ lúc nhập triệu chứng đến lúc đến phòng khám đều rất trơn tru.' },
              ].map((review, i) => (
                <div key={i} className="testimonial-card">
                  <div className="testimonial-stars">
                    {[...Array(5)].map((_, j) => (
                      <svg key={j} width="15" height="15" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    ))}
                  </div>
                  <p className="testimonial-quote">&ldquo;{review.text}&rdquo;</p>
                  <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-100">
                    <div className="testimonial-avatar-initials">{review.name.charAt(0)}</div>
                    <div>
                      <p className="text-[14px] font-semibold text-slate-900">{review.name}</p>
                      <p className="text-[12px] text-slate-500">{review.role}</p>
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

        {/* ── FAQ ── */}
        <section className="bg-white py-20 animate-on-scroll">
          <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-[#0D9E75] mb-2">Hỗ trợ</p>
              <h2 className="text-[36px] font-bold text-slate-900 mb-2">Câu hỏi thường gặp</h2>
              <p className="text-slate-500">Giải đáp nhanh những thắc mắc của bạn về nền tảng.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
              {FAQS.map((faq, index) => (
                <div key={index} className="faq-item">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="faq-trigger"
                    aria-expanded={openFaq === index}
                  >
                    <span>{faq.question}</span>
                    <ChevronDown size={18} className={`faq-chevron ${openFaq === index ? 'open' : ''}`} />
                  </button>
                  <div className={`faq-panel ${openFaq === index ? 'open' : ''}`}>
                    <div className="faq-panel-inner">{faq.answer}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
    </>
  );
}

