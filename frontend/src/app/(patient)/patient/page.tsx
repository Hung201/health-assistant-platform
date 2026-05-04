'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import {
  Search, Calendar, User, Activity, Bot, ArrowUpRight, ShieldCheck,
  CalendarCheck, TrendingUp,
} from 'lucide-react';

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

  const STATS = [
    {
      label: 'Lịch hẹn sắp tới',
      value: isLoading ? '—' : String(upcomingBookings.length),
      unit: 'lịch',
      icon: Calendar,
      iconColor: '#0D9E75',
      iconBg: 'rgba(13,158,117,0.10)',
      micro: upcomingBookings.length > 0 ? 'Cập nhật hôm nay' : null,
    },
    {
      label: 'Tổng lượt khám',
      value: isLoading ? '—' : String(totalBookings),
      unit: 'lượt',
      icon: TrendingUp,
      iconColor: '#3B82F6',
      iconBg: 'rgba(59,130,246,0.10)',
      micro: totalBookings > 0 ? 'Cập nhật hôm nay' : null,
    },
    {
      label: 'Trạng thái hồ sơ',
      value: hasProfile ? 'Đầy đủ' : 'Cần cập nhật',
      unit: '',
      icon: User,
      iconColor: hasProfile ? '#10B981' : '#F59E0B',
      iconBg: hasProfile ? 'rgba(16,185,129,0.10)' : 'rgba(245,158,11,0.10)',
      micro: null,
      pill: !hasProfile,
    },
  ];

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
        className="relative overflow-hidden rounded-[20px] p-7 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #1a3353 0%, #0D9E75 100%)' }}
      >
        {/* Background circles */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-[200px] w-[200px] rounded-full bg-white opacity-[0.07]" />
        <div className="pointer-events-none absolute -right-4 top-16 h-[140px] w-[140px] rounded-full bg-white opacity-[0.05]" />

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {/* Badge */}
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
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-[14px] font-semibold text-[#0D9E75] shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-[.97]"
            >
              <Bot size={18} />
              Trợ lý AI chẩn đoán
            </Link>
          </div>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="flex items-center gap-5 rounded-2xl border border-[#E8EDF2] bg-white px-6 py-5 shadow-sm"
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                style={{ background: s.iconBg }}
              >
                <Icon size={22} style={{ color: s.iconColor }} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">{s.label}</p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-[28px] font-extrabold leading-none text-[#1a3353]">{s.value}</span>
                  {s.unit && <span className="text-[14px] font-medium text-[#94A3B8]">{s.unit}</span>}
                  {s.pill && (
                    <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[12px] font-semibold text-orange-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                      Cần cập nhật
                    </span>
                  )}
                </div>
                {s.micro && (
                  <p className="mt-1 text-[11px] font-medium text-[#0D9E75]">{s.micro}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── SHORTCUTS ── */}
      <div>
        <h3 className="mb-4 text-[16px] font-bold text-[#1a3353]">Lối tắt thông dụng</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {SHORTCUTS.map((c) => {
            const Icon = c.Icon;
            return (
              <Link
                key={c.href}
                href={c.href}
                className="group flex flex-col rounded-2xl border border-[#E8EDF2] bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[#0D9E75] hover:shadow-[0_8px_24px_rgba(13,158,117,0.12)] active:scale-[.98]"
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
                <p className="mt-3 text-[12px] font-semibold text-[#0D9E75] opacity-0 transition-opacity group-hover:opacity-100">
                  Truy cập →
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
