/* eslint-disable react-hooks/rules-of-hooks */
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Activity, Brain,
  Stethoscope, CalendarCheck, FileBadge,
  ChevronDown, MessageSquare, Shield, Clock, Smartphone, Radio,
  ChevronLeft, ChevronRight
} from 'lucide-react';

import { StatCounter } from '@/components/ui/StatCounter';
import { FaqAccordion } from '@/components/sections/FaqAccordion';
import { useScrollReveal } from '@/hooks/useScrollReveal';

import { authApi, doctorsApi, livestreamsApi, publicPostsApi, qaApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import './marketing.css';

const removeAccents = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

const getSpecialtyImage = (name: string): string => {
  const raw = name.toLowerCase();
  const n = removeAccents(name); // "Thần kinh" → "than kinh", "Da liễu" → "da lieu"

  // Da liễu → dermatology
  if (raw.includes('da liễu') || raw.includes('da lieu') || n === 'da lieu' || n.startsWith('da lieu')) return '/images/specialties/dermatology.png';

  // Tim mạch → cardiology
  if (raw.includes('tim') || n.includes('tim') || n.includes('mach tim')) return '/images/specialties/cardiology.png';

  // Xương khớp / Chỉnh hình / Cơ xương → orthopedics
  if (raw.includes('xương') || raw.includes('khớp') || raw.includes('chỉnh hình') ||
      n.includes('xuong') || n.includes('khop') || n.includes('chinh hinh')) return '/images/specialties/orthopedics.png';

  // Thần kinh → neurology
  if (raw.includes('thần kinh') || n.includes('than kinh')) return '/images/specialties/neurology.png';

  // Nhãn khoa / Mắt → ophthalmology
  if (raw.includes('mắt') || raw.includes('nhãn') || n.includes('mat') || n.includes('nhan khoa')) return '/images/specialties/ophthalmology.png';

  // Nhi khoa → pediatrics
  if (raw.includes('nhi') || n.includes('nhi') || raw.includes('trẻ em')) return '/images/specialties/pediatrics.png';

  // Sản phụ khoa → obstetrics
  if (raw.includes('sản') || raw.includes('phụ khoa') || n.includes('san phu') || n.includes('phu san')) return '/images/specialties/obstetrics.png';

  // Nội khoa / Nội tổng quát / Tổng quát → internal-medicine  
  if (raw.includes('nội') || raw.includes('tổng quát') || n.includes('noi') || n.includes('tong quat')) return '/images/specialties/internal-medicine.png';

  // Tất cả còn lại (Ngoại khoa, Hô hấp, Tai mũi họng, Tâm thần, Ung bướu...) → default
  return '/images/specialties/default.png';
};

const FAQS = [
  { question: "Trợ lý AI chẩn đoán có chính xác không?", answer: "AI của chúng tôi được đào tạo dựa trên cơ sở dữ liệu y khoa chuẩn xác. Tuy nhiên, nó chỉ đóng vai trò phân tích sơ bộ và gợi ý chuyên khoa, không thay thế chẩn đoán y khoa chính thức từ bác sĩ." },
  { question: "Tôi có thể hủy lịch khám đã đặt không?", answer: "Bạn có thể hủy lịch khám trước giờ hẹn. Việc hủy sẽ hoàn tất nhanh chóng và phí (nếu có) sẽ được hoàn lại theo chính sách của chúng tôi." },
  { question: "Dữ liệu y tế của tôi có bị chia sẻ không?", answer: "Không. Chúng tôi tuân thủ nghiêm ngặt các tiêu chuẩn bảo mật y tế. Thông tin cá nhân và hồ sơ bệnh án của bạn được mã hóa và bảo mật an toàn." },
  { question: "Chi phí sử dụng nền tảng là bao nhiêu?", answer: "Việc sử dụng Trợ lý AI và đặt lịch hoàn toàn miễn phí. Bạn chỉ thanh toán phí khám bệnh cho bác sĩ theo bảng giá được niêm yết công khai trên hồ sơ của họ." },
];

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  // openFaq state is now managed inside FaqAccordion component
  const [scrolled, setScrolled] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const doctorsScrollRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const heroEyebrowRef = useRef<HTMLDivElement>(null);
  const heroHeadingRef = useRef<HTMLHeadingElement>(null);
  const heroDescRef = useRef<HTMLParagraphElement>(null);
  const heroCTARef = useRef<HTMLDivElement>(null);
  const heroCardRef = useRef<HTMLDivElement>(null);
  const qaRef = useRef<HTMLElement>(null);
  const howItWorksRef = useRef<HTMLElement>(null);
  const testimonialsRef = useRef<HTMLElement>(null);

  const scrollSpecialties = (dir: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: dir === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollDoctors = (dir: 'left' | 'right') => {
    if (doctorsScrollRef.current) {
      const scrollAmount = 300;
      doctorsScrollRef.current.scrollBy({
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

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.7 } });
    tl.fromTo(heroEyebrowRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1 }
    )
    .fromTo(heroHeadingRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1 },
      '-=0.55'
    )
    .fromTo(heroDescRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1 },
      '-=0.55'
    )
    .fromTo(heroCTARef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1 },
      '-=0.55'
    )
    .fromTo(heroCardRef.current,
      { scale: 0.92, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.9 },
      0.3
    );
  }, { scope: heroRef });

  useEffect(() => {
    const els = document.querySelectorAll('.animate-on-scroll');
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Scroll reveal for QA, How-it-works, and Testimonials sections
  useScrollReveal(qaRef, { y: 24, stagger: 0.12 });
  useScrollReveal(howItWorksRef, { y: 30, stagger: 0.15 });
  useScrollReveal(testimonialsRef, { y: 24, stagger: 0.12 });

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
        <section ref={heroRef} className="hero-section relative overflow-hidden py-20 lg:py-28">
          <div className="hero-mesh" />
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Asymmetric 55/45 split */}
            <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-12 lg:gap-16 items-center">

              {/* ── Left column: text (left-aligned) ── */}
              <div className="flex flex-col items-start">
                {/* Decorative thin green line above eyebrow */}
                <div className="mb-3 h-[2px] w-16 rounded-full bg-[#1BAF7C]" />

                {/* Eyebrow */}
                <div
                  ref={heroEyebrowRef}
                  className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#E8F8F2] px-3 py-1.5 text-sm font-semibold text-[#0D9E75] ring-1 ring-inset ring-[#0D9E75]/20"
                >
                  <span className="flex h-2 w-2 rounded-full bg-[#0D9E75] animate-pulse" />
                  Được hỗ trợ bởi AI Tiên Tiến
                </div>

                {/* Heading — AI on its own line */}
                <h1
                  ref={heroHeadingRef}
                  className="mb-5 font-bold tracking-tight text-slate-900 leading-[1.1] text-left"
                  style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
                >
                  Chẩn đoán sức khỏe thông minh với{' '}
                  <br className="hidden sm:block" />
                  <span className="text-[#1BAF7C]">AI</span>
                </h1>

                {/* Description */}
                <p
                  ref={heroDescRef}
                  className="mb-8 text-base leading-relaxed text-slate-600 max-w-lg"
                >
                  Ứng dụng trí tuệ nhân tạo tiên tiến giúp bạn phân tích triệu chứng ban đầu, tìm bác sĩ phù hợp và đặt lịch hẹn khám nhanh chóng ngay tại nhà.
                </p>

                {/* CTA buttons */}
                <div ref={heroCTARef} className="flex flex-col sm:flex-row items-start gap-3 mb-10">
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
                  <StatCounter end={500} suffix="+" label="Bác sĩ uy tín" />
                  <StatCounter end={50} suffix="+" label="Chuyên khoa" />
                  <StatCounter end={98} suffix="%" label="Bệnh nhân hài lòng" />
                </div>
              </div>

              {/* ── Right column: AI chat card ── */}
              <div ref={heroCardRef} className="hidden lg:flex justify-center items-center">
                <div className="relative">
                  <div className="ai-chat-glow" />
                  <div className="ai-chat-card w-[360px]">
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

                      {/* Typing indicator */}
                      <div className="flex gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#0D9E75]/10 flex items-center justify-center flex-shrink-0">
                          <Activity size={12} className="text-[#0D9E75]" />
                        </div>
                        <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center">
                          <div className="typing-indicator">
                            <span className="typing-dot" />
                            <span className="typing-dot" style={{ animationDelay: '0.15s' }} />
                            <span className="typing-dot" style={{ animationDelay: '0.30s' }} />
                          </div>
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
        <section ref={qaRef} className="border-b border-slate-200 bg-[#f6fbfb] py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8" data-reveal>
              <h3 className="text-sm font-bold uppercase tracking-widest text-teal-600">Bác sĩ hỏi đáp</h3>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Hỏi bác sĩ miễn phí &amp; Cẩm nang hỏi đáp</h2>
              <p className="mt-3 max-w-3xl text-slate-600">
                Đặt câu hỏi trực tuyến để bác sĩ giải đáp, đồng thời tra cứu kho bài viết chăm sóc sức khỏe phù hợp từng vấn đề.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <Link data-reveal href="/hoi-bac-si-mien-phi" className="group rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg">
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
              <Link data-reveal href="/blog" className="group rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg">
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
              <div data-reveal className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
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
        <section ref={howItWorksRef} className="bg-white py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Section heading */}
            <div className="mb-16 text-center" data-reveal>
              <div className="mb-3 flex items-center justify-center gap-3">
                <span className="h-[2px] w-8 rounded-full bg-[#1BAF7C]" />
                <p className="text-sm font-semibold uppercase tracking-widest text-[#0D9E75]">Quy trình đơn giản</p>
                <span className="h-[2px] w-8 rounded-full bg-[#1BAF7C]" />
              </div>
              <h2 className="text-[38px] font-bold text-slate-900 mb-3 leading-tight">Cách thức hoạt động</h2>
              <p className="text-slate-500 max-w-xl mx-auto text-base">
                Trải nghiệm chăm sóc sức khỏe liền mạch từ lúc xuất hiện triệu chứng đến khi gặp chuyên gia.
              </p>
            </div>

            {/* Step cards grid */}
            <div className="how-it-works-grid">
              {[
                {
                  icon: MessageSquare,
                  title: 'Chat với AI',
                  desc: 'Mô tả triệu chứng bằng ngôn ngữ tự nhiên — AI sẽ lắng nghe và phân tích ngay.',
                  color: '#0D9E75',
                  gradient: 'linear-gradient(135deg, #0D9E75 0%, #1BAF7C 100%)',
                },
                {
                  icon: Stethoscope,
                  title: 'Gợi ý Chuyên khoa',
                  desc: 'Nhận kết quả phân tích sơ bộ và danh sách bác sĩ phù hợp nhất với bạn.',
                  color: '#3B82F6',
                  gradient: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
                },
                {
                  icon: CalendarCheck,
                  title: 'Đặt lịch hẹn',
                  desc: 'Chọn khung giờ thuận tiện — khám trực tuyến hoặc trực tiếp tại phòng khám.',
                  color: '#8B5CF6',
                  gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
                },
                {
                  icon: FileBadge,
                  title: 'Khám & Hồ sơ',
                  desc: 'Lưu trữ kết quả, đơn thuốc và lịch sử khám bệnh an toàn trên hệ thống.',
                  color: '#F59E0B',
                  gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
                },
              ].map((step, idx, arr) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="relative" data-reveal>
                    <div className="hiw-card h-full">
                      {/* Giant watermark step number */}
                      <span className="hiw-step-number">{idx + 1}</span>

                      {/* Icon box */}
                      <div
                        className="hiw-icon-wrap"
                        style={{
                          background: `linear-gradient(135deg, ${step.color}1A 0%, ${step.color}0D 100%)`,
                        }}
                      >
                        <Icon size={26} style={{ color: step.color }} strokeWidth={1.8} />
                        <span className="hiw-badge">{idx + 1}</span>
                      </div>

                      {/* Text */}
                      <h4 className="text-[17px] font-bold text-slate-900 mb-2 leading-snug">{step.title}</h4>
                      <p className="text-[14px] text-slate-500 leading-relaxed">{step.desc}</p>

                      {/* Bottom accent colour bar driven by step colour */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-[20px] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-350 hiw-bar"
                        style={{ background: step.gradient }}
                      />
                    </div>

                    {/* Connector arrow to next step */}
                    {idx < arr.length - 1 && (
                      <div className="hiw-connector">
                        <div className="hiw-connector-line" />
                      </div>
                    )}
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
        <section className="bg-[#E8F8F2]/30 py-24 animate-on-scroll relative overflow-hidden">
          {/* Subtle background decorations */}
          <div className="absolute top-10 left-10 text-teal-100 opacity-50"><svg width="100" height="100" viewBox="0 0 100 100" fill="currentColor"><path d="M40 0h20v40h40v20H60v40H40V60H0V40h40V0z"/></svg></div>
          <div className="absolute bottom-10 right-10 text-teal-100 opacity-50"><svg width="150" height="150" viewBox="0 0 100 100" fill="currentColor"><path d="M40 0h20v40h40v20H60v40H40V60H0V40h40V0z"/></svg></div>
          
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div className="text-left">
                <h2 className="text-[32px] md:text-[36px] font-bold text-slate-900 mb-3">Bác sĩ nổi bật</h2>
              </div>
              <div className="hidden sm:flex items-center gap-4">
                <Link className="rounded-full bg-[#E8F8F2] px-6 py-2.5 text-sm font-bold text-[#0D9E75] hover:bg-[#d1f1e6] transition-colors" href="/doctors">
                  Xem thêm
                </Link>
              </div>
            </div>

            <div className="relative group">
              {/* Left Arrow */}
              <button 
                onClick={() => scrollDoctors('left')} 
                className="absolute left-0 top-[100px] -translate-y-1/2 -translate-x-4 lg:-translate-x-6 z-20 w-10 h-10 lg:w-12 lg:h-12 rounded-lg border border-slate-200 bg-white shadow-md flex items-center justify-center text-slate-500 hover:text-[#0D9E75] hover:border-[#0D9E75] transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
              >
                <ChevronLeft size={24} />
              </button>
              
              {/* Scroll Container */}
              <div ref={doctorsScrollRef} className="flex gap-6 lg:gap-10 overflow-x-auto pb-8 pt-4 snap-x snap-mandatory hide-scrollbar">
                {doctorsData?.items?.length ? (
                  doctorsData.items.map((doctor, idx) => (
                    <Link key={doctor.userId} href={`/doctors/${doctor.userId}`} className="relative overflow-hidden group shrink-0 w-[240px] lg:w-[280px] snap-start flex flex-col items-center group/card hover:-translate-y-1 transition-transform duration-300 pb-4 rounded-xl" style={{ animationDelay: `${idx * 40}ms` }}>
                      <div className="relative w-40 h-40 lg:w-48 lg:h-48 rounded-full overflow-hidden mb-6 border-4 border-white shadow-lg transition-transform duration-300 group-hover/card:scale-105 bg-slate-100 shrink-0">
                        <img
                          alt={doctor.fullName}
                          className="w-full h-full object-cover object-top"
                          src={doctor.avatarUrl || '/images/default-avatar.jpg'}
                        />
                      </div>
                      <div className="text-center w-full px-2">
                        <h4 className="text-[16px] lg:text-[18px] font-bold text-[#003f87] mb-2 leading-tight group-hover/card:text-[#0D9E75] transition-colors px-4">
                          {doctor.professionalTitle ? `${doctor.professionalTitle}, ` : ''}Bác sĩ {doctor.fullName}
                        </h4>
                        <p className="text-[13px] lg:text-[14px] text-slate-500 font-medium leading-relaxed px-4 line-clamp-2">
                          {doctor.specialties?.[0]?.name || 'Đa khoa'}
                        </p>
                        <p className="text-[12px] lg:text-[13px] text-slate-400 mt-2 line-clamp-1 px-4">
                          {doctor.workplaceName || 'Phòng khám Clinical Precision'}
                        </p>
                      </div>

                      {/* Hover Overlay Panel */}
                      <div className="absolute inset-x-0 bottom-0 h-auto bg-white/95 backdrop-blur-sm border-t border-[#1BAF7C]/20 p-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out flex flex-col gap-3">
                        {/* TODO: Integrate real experience/patient count from backend */}
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div>
                            <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mb-1">Kinh nghiệm</p>
                            <p className="text-sm font-semibold text-slate-800">8 năm</p>
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mb-1">Bệnh nhân</p>
                            <p className="text-sm font-semibold text-slate-800">1,200+</p>
                          </div>
                        </div>
                        <button className="w-full bg-[#1BAF7C] text-white text-sm py-1.5 rounded-lg font-semibold hover:bg-[#158f64] transition-colors">
                          Đặt lịch
                        </button>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="w-full text-center py-12 text-slate-500">Đang tải danh sách bác sĩ...</div>
                )}
              </div>

              {/* Right Arrow */}
              <button 
                onClick={() => scrollDoctors('right')} 
                className="absolute right-0 top-[100px] -translate-y-1/2 translate-x-4 lg:translate-x-6 z-20 w-10 h-10 lg:w-12 lg:h-12 rounded-lg border border-slate-200 bg-white shadow-md flex items-center justify-center text-slate-500 hover:text-[#0D9E75] hover:border-[#0D9E75] transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronRight size={24} />
              </button>
            </div>
            
            {/* Mobile View More Button */}
            <div className="mt-8 flex justify-center sm:hidden">
              <Link className="rounded-full bg-[#E8F8F2] px-6 py-2.5 text-sm font-bold text-[#0D9E75] hover:bg-[#d1f1e6] transition-colors" href="/doctors">
                Xem thêm
              </Link>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section ref={testimonialsRef} className="testimonial-section py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center" data-reveal>
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
                <div key={i} data-reveal className="testimonial-card">
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
        <section className="bg-white py-20">
          <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-[#0D9E75] mb-2">Hỗ trợ</p>
              <h2 className="text-[36px] font-bold text-slate-900 mb-2">Câu hỏi thường gặp</h2>
              <p className="text-slate-500">Giải đáp nhanh những thắc mắc của bạn về nền tảng.</p>
            </div>
            <FaqAccordion items={FAQS} />
          </div>
        </section>
    </>
  );
}

