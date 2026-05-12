'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend,
  Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  TrendingUp, TrendingDown, CreditCard, Clock,
  CalendarPlus, CalendarCheck, UserCircle2, ArrowRight,
} from 'lucide-react';

import { doctorApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

function StatCard({
  label,
  value,
  sub,
  Icon,
  accent,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  Icon: React.ElementType;
  accent: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="doctor-stat-card">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${accent}18` }}
      >
        <Icon size={20} style={{ color: accent }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 text-[22px] font-bold text-[#1a3353] leading-tight">{value}</p>
        {sub && (
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
            {trend === 'up' && <TrendingUp size={10} className="text-emerald-500" />}
            {trend === 'down' && <TrendingDown size={10} className="text-red-400" />}
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

const SHORTCUTS = [
  {
    href: '/doctor/slots',
    Icon: CalendarPlus,
    title: 'Lịch trống',
    desc: 'Tạo và quản lý khung giờ khám cho bệnh nhân.',
    color: '#0D9E75',
  },
  {
    href: '/doctor/bookings',
    Icon: CalendarCheck,
    title: 'Lịch hẹn',
    desc: 'Duyệt và ghi chú các lịch hẹn đang chờ.',
    color: '#6366F1',
  },
  {
    href: '/doctor/profile',
    Icon: UserCircle2,
    title: 'Hồ sơ hành nghề',
    desc: 'Cập nhật thông tin chuyên môn và giới thiệu.',
    color: '#F59E0B',
  },
];

export default function DoctorDashboardPage() {
  const [periodDays, setPeriodDays] = useState<7 | 30 | 90>(30);
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['doctor', 'dashboard', 'payment-summary', periodDays],
    queryFn: () => doctorApi.dashboardPaymentSummary(periodDays),
  });

  const fmtCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  const fmtCompact = (value: number) =>
    new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0);
  const formatMethod = (method: string) => {
    if (method === 'momo') return 'MoMo';
    if (method === 'pay_at_clinic') return 'Tại viện';
    return method;
  };

  const trendData = (data?.revenueTrend ?? []).map((d) => ({
    ...d,
    day: new Date(`${d.date}T00:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
  }));
  const methodData = (data?.revenueByMethod ?? []).map((row) => ({
    ...row,
    label: formatMethod(row.paymentMethod),
  }));
  const pieColors = ['#0D9E75', '#6366F1', '#F59E0B', '#EF4444', '#8B5CF6'];

  const growthPct = data?.payment.revenueGrowthPct ?? 0;
  const growthTrend: 'up' | 'down' | 'neutral' = growthPct > 0 ? 'up' : growthPct < 0 ? 'down' : 'neutral';

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <div className="space-y-6">
      {/* ── Greeting banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #0D9E75 0%, #0a7a5c 100%)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: [
              'radial-gradient(circle at 15% 50%, rgba(255,255,255,0.07) 0%, transparent 55%)',
              'radial-gradient(circle at 85% 20%, rgba(255,255,255,0.05) 0%, transparent 50%)',
            ].join(', '),
          }}
        />
        <div className="relative flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-white/70">{greeting()},</p>
            <h2 className="text-2xl font-bold mt-0.5">
              BS {user?.fullName ?? 'Bác sĩ'} 👋
            </h2>
            <p className="mt-1 text-sm text-white/70">
              {user?.doctorSpecialty ? `Chuyên khoa ${user.doctorSpecialty.name}` : 'Chào mừng trở lại trang quản trị'}
            </p>
          </div>
          {/* Period selector */}
          <div className="flex items-center gap-2 mt-3 sm:mt-0">
            {([7, 30, 90] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setPeriodDays(d)}
                className={[
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                  periodDays === d
                    ? 'bg-white text-[#0D9E75] shadow-sm'
                    : 'bg-white/15 text-white hover:bg-white/25',
                ].join(' ')}
              >
                {d} ngày
              </button>
            ))}
          </div>
        </div>
      </div>

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(error as Error).message}
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={`Doanh thu ${periodDays} ngày`}
          value={isLoading ? '…' : fmtCurrency(data?.payment.periodPaidRevenue ?? 0)}
          Icon={CreditCard}
          accent="#0D9E75"
        />
        <StatCard
          label="Tăng trưởng"
          value={isLoading ? '…' : `${growthPct}%`}
          sub={isLoading ? '' : `${fmtCurrency(data?.payment.previousPeriodPaidRevenue ?? 0)} kỳ trước`}
          Icon={TrendingUp}
          accent="#6366F1"
          trend={growthTrend}
        />
        <StatCard
          label="Tỷ lệ thanh toán"
          value={isLoading ? '…' : `${data?.payment.paidRatePct ?? 0}%`}
          Icon={CreditCard}
          accent="#F59E0B"
        />
        <StatCard
          label="Lịch chờ duyệt"
          value={isLoading ? '…' : String(data?.pendingApprovalBookings ?? 0)}
          Icon={Clock}
          accent="#EF4444"
        />
      </div>

      {/* ── Revenue Trend Chart ── */}
      <div className="rounded-2xl border border-[#E8EDF2] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-[#1a3353]">Xu hướng doanh thu</h3>
            <p className="text-xs text-slate-400 mt-0.5">Doanh thu và lịch đã thanh toán theo ngày</p>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={fmtCompact} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '0.75rem', border: '1px solid #E8EDF2', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                formatter={(value, name) => name === 'Doanh thu' ? fmtCurrency(Number(value ?? 0)) : value}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Line yAxisId="left" type="monotone" dataKey="revenue" name="Doanh thu" stroke="#0D9E75" strokeWidth={2.5} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="paidBookings" name="Lịch đã thanh toán" stroke="#6366F1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Method Charts ── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-[#E8EDF2] bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-[#1a3353] mb-4">Thanh toán theo phương thức</h3>
          <div className="h-56">
            {methodData.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-slate-400">Chưa có dữ liệu thanh toán thành công.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={methodData} dataKey="revenue" nameKey="label" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                    {methodData.map((row, idx) => (
                      <Cell key={row.paymentMethod} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '0.75rem', border: '1px solid #E8EDF2' }}
                    formatter={(value) => fmtCurrency(Number(value ?? 0))}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-[#E8EDF2] bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-[#1a3353] mb-4">Số lịch theo phương thức</h3>
          <div className="h-56">
            {methodData.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-slate-400">Chưa có dữ liệu thanh toán thành công.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={methodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid #E8EDF2' }} />
                  <Bar dataKey="paidBookings" name="Lịch đã thanh toán" fill="#0D9E75" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick access shortcuts ── */}
      <div>
        <h3 className="text-base font-bold text-[#1a3353] mb-3">Truy cập nhanh</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {SHORTCUTS.map((c) => {
            const Icon = c.Icon;
            return (
              <Link key={c.href} href={c.href} className="doctor-quick-card group">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl mb-3"
                  style={{ background: `${c.color}18` }}
                >
                  <Icon size={20} style={{ color: c.color }} />
                </div>
                <p className="font-bold text-[#1a3353]">{c.title}</p>
                <p className="mt-1 text-sm text-slate-400">{c.desc}</p>
                <div
                  className="mt-3 flex items-center gap-1 text-xs font-semibold transition-colors"
                  style={{ color: c.color }}
                >
                  Xem ngay
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
