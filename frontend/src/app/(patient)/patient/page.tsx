'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import {
  Search, Calendar, User, Bot, ArrowUpRight, ShieldCheck,
  CalendarCheck, TrendingUp,
} from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { StatCounter } from '@/components/ui/StatCounter';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function PatientDashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['patient', 'bookings', 'me'],
    queryFn: bookingsApi.my,
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const firstName = user?.fullName?.split(' ').pop() || 'bạn';

  const upcomingBookings = bookings?.filter((b) => b.status === 'pending' || b.status === 'approved') ?? [];
  const totalBookings = bookings?.length ?? 0;
  const hasProfile = Boolean(user?.patientProfile?.bloodType);

  // ── GSAP entrance refs ──
  const greetingRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const shortcutsRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Entrance timeline: greeting → stats → shortcuts
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(greetingRef.current,
      { y: 28, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6 }
    )
    .fromTo(
      statsRef.current?.querySelectorAll('.stat-card') ?? [],
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.08 },
      '-=0.35'
    )
    .fromTo(
      shortcutsRef.current?.querySelectorAll('.shortcut-card') ?? [],
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 },
      '-=0.3'
    );
  }, { scope: pageRef });

  // Scroll reveal for section label
  useScrollReveal(shortcutsRef, { y: 16, stagger: 0.1 });

  const SHORTCUTS = [
    {
      href: '/patient/doctors',
      Icon: Search,
      title: 'Đặt lịch Bác sĩ',
      desc: 'Tìm kiếm bác sĩ giỏi theo chuyên khoa và đánh giá.',
      iconBg: 'rgba(59,130,246,0.10)',
      iconColor: '#3B82F6',
    },
    {
      href: '/patient/bookings',
      Icon: CalendarCheck,
      title: 'Quản lý lịch hẹn',
      desc: 'Xem chi tiết thời gian khám và trạng thái cuộc hẹn.',
      iconBg: 'rgba(13,158,117,0.10)',
      iconColor: '#0D9E75',
    },
    {
      href: '/patient/profile',
      Icon: User,
      title: 'Hồ sơ cá nhân',
      desc: 'Cập nhật thông tin y tế, nhóm máu, địa chỉ liên hệ.',
      iconBg: 'rgba(139,92,246,0.10)',
      iconColor: '#8B5CF6',
    },
  ];

  return (
    <div ref={pageRef} className="space-y-6 pb-12">
      {/* ── GREETING CARD ── */}
      <div
        ref={greetingRef}
        className="relative overflow-hidden rounded-[20px] p-7 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #1a3353 0%, #0D9E75 100%)' }}
      >
        {/* Mesh overlay */}
        <div className="dashboard-mesh" />
        {/* Background circles */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-[200px] w-[200px] rounded-full bg-white opacity-[0.07]" />
        <div className="pointer-events-none absolute -right-4 top-16 h-[140px] w-[140px] rounded-full bg-white opacity-[0.05]" />

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {/* Decorative line + badge (mirrors hero eyebrow) */}
            <div className="mb-3 h-[2px] w-10 rounded-full bg-white/40" />
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
              <ShieldCheck size={12} className="text-white" />
              <span className="text-[11px] font-medium text-white">HỒ SƠ Y TẾ ĐIỆN TỬ</span>
            </div>
            <p className="text-[18px] font-normal text-white/80">{greeting},</p>
            <h2 className="mt-1 text-[32px] font-extrabold leading-tight text-white">{firstName}!</h2>
            <p className="mt-1.5 text-[14px] text-white/60">Hôm nay bạn cảm thấy thế nào? Hãy để chúng tôi chăm sóc sức khỏe cho bạn.</p>
          </div>

          {/* CTA */}
          <div className="shrink-0">
            <Link
              href="/patient/ai-assistant"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-[14px] font-semibold text-[#0D9E75] shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl active:scale-[.97]"
            >
              <Bot size={18} />
              Trợ lý AI chẩn đoán
            </Link>
          </div>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div ref={statsRef} className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* StatCounter for numeric stats */}
        <div className="stat-card">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(13,158,117,0.10)' }}>
            <Calendar size={22} style={{ color: '#0D9E75' }} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">Lịch hẹn sắp tới</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              {isLoading
                ? <span className="text-[28px] font-extrabold leading-none text-[#1a3353]">—</span>
                : <StatCounter end={upcomingBookings.length} label="" duration={1.8} inline />
              }
              <span className="text-[14px] font-medium text-[#94A3B8]">lịch</span>
            </div>
            {upcomingBookings.length > 0 && (
              <p className="mt-1 text-[11px] font-medium text-[#0D9E75]">Cập nhật hôm nay</p>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(59,130,246,0.10)' }}>
            <TrendingUp size={22} style={{ color: '#3B82F6' }} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">Tổng lượt khám</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              {isLoading
                ? <span className="text-[28px] font-extrabold leading-none text-[#1a3353]">—</span>
                : <StatCounter end={totalBookings} label="" duration={1.8} inline />
              }
              <span className="text-[14px] font-medium text-[#94A3B8]">lượt</span>
            </div>
            {totalBookings > 0 && (
              <p className="mt-1 text-[11px] font-medium text-[#0D9E75]">Cập nhật hôm nay</p>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
            style={{ background: hasProfile ? 'rgba(16,185,129,0.10)' : 'rgba(245,158,11,0.10)' }}
          >
            <User size={22} style={{ color: hasProfile ? '#10B981' : '#F59E0B' }} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">Trạng thái hồ sơ</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[22px] font-extrabold leading-none text-[#1a3353]">
                {hasProfile ? 'Đầy đủ' : 'Cần cập nhật'}
              </span>
              {!hasProfile && (
                <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[12px] font-semibold text-orange-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                  Thiếu thông tin
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── SHORTCUTS ── */}
      <div ref={shortcutsRef}>
        <div className="mb-4 flex items-center gap-3">
          <span className="h-[2px] w-6 rounded-full bg-[#1BAF7C]" aria-hidden />
          <h3 className="text-[16px] font-bold text-[#1a3353]">Lối tắt thông dụng</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {SHORTCUTS.map((c) => {
            const Icon = c.Icon;
            return (
              <Link
                key={c.href}
                href={c.href}
                className="shortcut-card group"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-[52px] w-[52px] items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                    style={{ background: c.iconBg }}
                  >
                    <Icon size={24} style={{ color: c.iconColor }} />
                  </div>
                  <ArrowUpRight size={18} className="text-slate-300 transition-colors group-hover:text-[#0D9E75]" />
                </div>
                <h4 className="mt-4 text-[15px] font-bold text-[#1a3353]">{c.title}</h4>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[#64748B]">{c.desc}</p>

                {/* Hover overlay — slides up */}
                <div className="shortcut-overlay">
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0D9E75]">
                    Truy cập ngay
                    <ArrowUpRight size={14} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
