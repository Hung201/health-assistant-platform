'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import {
  Search, Calendar, User, Bot, ArrowUpRight, ShieldCheck,
  CalendarCheck, TrendingUp,
} from 'lucide-react';
import { StatCounter } from '@/components/ui/StatCounter';

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
    <div className="space-y-6 pb-12">
      {/* ── GREETING CARD ── */}
      <div
        className="relative overflow-hidden rounded-[20px] p-6 sm:p-8 text-white"
        style={{ background: 'linear-gradient(135deg, #1a3353 0%, #0D9E75 100%)' }}
      >
        {/* Mesh overlay */}
        <div className="dashboard-mesh" />
        {/* Background circles */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-[200px] w-[200px] rounded-full bg-white opacity-[0.07]" />
        <div className="pointer-events-none absolute -right-4 top-16 h-[140px] w-[140px] rounded-full bg-white opacity-[0.05]" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {/* Decorative line + badge */}
            <div className="mb-3 h-[2px] w-10 rounded-full bg-white/40" />
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
              <ShieldCheck size={12} className="text-white" />
              <span className="text-[11px] font-medium text-white">HỒ SƠ Y TẾ ĐIỆN TỬ</span>
            </div>
            <p className="text-[16px] font-normal text-white/80">{greeting},</p>
            <h2 className="mt-1 text-[26px] sm:text-[32px] font-extrabold leading-tight text-white">{firstName}!</h2>
            <p className="mt-1.5 text-[13px] text-white/60">Hôm nay bạn cảm thấy thế nào? Hãy để chúng tôi chăm sóc sức khỏe cho bạn.</p>
          </div>

          {/* CTA */}
          <div className="shrink-0">
            <Link
              href="/patient/ai-assistant"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-[13px] font-semibold text-[#0D9E75] shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl active:scale-[.97]"
            >
              <Bot size={16} />
              Trợ lý AI chẩn đoán
            </Link>
          </div>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="stat-card">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(13,158,117,0.10)' }}>
            <Calendar size={20} style={{ color: '#0D9E75' }} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">Lịch hẹn sắp tới</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              {isLoading
                ? <span className="text-[24px] font-extrabold leading-none text-[#1a3353]">—</span>
                : <StatCounter end={upcomingBookings.length} label="" duration={1.8} inline />
              }
              <span className="text-[13px] font-medium text-[#94A3B8]">lịch</span>
            </div>
            {upcomingBookings.length > 0 && (
              <p className="mt-1 text-[11px] font-medium text-[#0D9E75]">Cập nhật hôm nay</p>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(59,130,246,0.10)' }}>
            <TrendingUp size={20} style={{ color: '#3B82F6' }} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">Tổng lượt khám</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              {isLoading
                ? <span className="text-[24px] font-extrabold leading-none text-[#1a3353]">—</span>
                : <StatCounter end={totalBookings} label="" duration={1.8} inline />
              }
              <span className="text-[13px] font-medium text-[#94A3B8]">lượt</span>
            </div>
            {totalBookings > 0 && (
              <p className="mt-1 text-[11px] font-medium text-[#0D9E75]">Cập nhật hôm nay</p>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{ background: hasProfile ? 'rgba(16,185,129,0.10)' : 'rgba(245,158,11,0.10)' }}
          >
            <User size={20} style={{ color: hasProfile ? '#10B981' : '#F59E0B' }} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">Trạng thái hồ sơ</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-1.5">
              <span className="text-[20px] font-extrabold leading-none text-[#1a3353]">
                {hasProfile ? 'Đầy đủ' : 'Cần cập nhật'}
              </span>
              {!hasProfile && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                  Thiếu thông tin
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── SHORTCUTS ── */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <span className="h-[2px] w-6 rounded-full bg-[#1BAF7C]" aria-hidden />
          <h3 className="text-[16px] font-bold text-[#1a3353]">Lối tắt thông dụng</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                    className="flex h-[48px] w-[48px] items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                    style={{ background: c.iconBg }}
                  >
                    <Icon size={22} style={{ color: c.iconColor }} />
                  </div>
                  <ArrowUpRight size={18} className="text-slate-300 transition-colors group-hover:text-[#0D9E75]" />
                </div>
                <h4 className="mt-4 text-[14px] font-bold text-[#1a3353]">{c.title}</h4>
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
