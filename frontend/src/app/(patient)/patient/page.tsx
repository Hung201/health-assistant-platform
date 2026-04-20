'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Search, Calendar, User, Activity, Bot, ArrowRight, ShieldCheck } from 'lucide-react';

export default function PatientDashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['patient', 'bookings', 'me'],
    queryFn: bookingsApi.my,
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const upcomingBookings = bookings?.filter((b) => b.status === 'pending' || b.status === 'approved') || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-70 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck size={14} />
            Hồ sơ y tế điện tử
          </div>
          <h2 className="text-3xl font-extrabold text-[#003f87] mb-2">
            {getGreeting()},{' '}
            <span className="text-teal-600">{user?.fullName?.split(' ').pop() || 'bạn'}</span>!
          </h2>
          <p className="text-slate-500 font-medium">Hôm nay bạn cảm thấy thế nào? Hãy để chúng tôi chăm sóc sức khỏe cho bạn.</p>
        </div>
        <div className="relative z-10 shrink-0 mt-4 sm:mt-0">
          <Link href="/patient/ai-assistant" className="inline-flex items-center gap-2 bg-[#003f87] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#002b5e] shadow-lg shadow-[#003f87]/20 transition-all hover:-translate-y-0.5">
            <Bot size={18} />
            Trợ lý AI chẩn đoán
          </Link>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Calendar size={28} />
           </div>
           <div>
              <p className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-1">Lịch hẹn sắp tới</p>
              <div className="flex items-baseline gap-2">
                 <span className="text-3xl font-extrabold text-[#003f87]">{isLoading ? '-' : upcomingBookings.length}</span>
                 <span className="text-sm font-semibold text-slate-500">lịch</span>
              </div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Activity size={28} />
           </div>
           <div>
              <p className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-1">Tổng lượt khám</p>
              <div className="flex items-baseline gap-2">
                 <span className="text-3xl font-extrabold text-[#003f87]">{isLoading ? '-' : bookings?.length || 0}</span>
                 <span className="text-sm font-semibold text-slate-500">lượt</span>
              </div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              <User size={28} />
           </div>
           <div>
              <p className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-1">Trạng thái hồ sơ</p>
              <div className="flex items-baseline gap-2">
                 <span className="text-lg font-extrabold text-orange-600">{user?.patientProfile?.bloodType ? 'Đã cập nhật' : 'Cần cập nhật'}</span>
              </div>
           </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h3 className="text-lg font-extrabold text-slate-800 mb-4">Lối tắt thông dụng</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { 
              href: '/patient/doctors', 
              icon: <Search size={28} />, 
              title: 'Đặt lịch Bác sĩ', 
              desc: 'Tìm kiếm bác sĩ giỏi theo chuyên khoa và đánh giá.',
              color: 'text-blue-600',
              bg: 'bg-blue-50',
              border: 'group-hover:border-blue-200'
            },
            { 
              href: '/patient/bookings', 
              icon: <Calendar size={28} />, 
              title: 'Quản lý lịch hẹn', 
              desc: 'Xem chi tiết thời gian khám và trạng thái cuộc hẹn.',
              color: 'text-teal-600',
              bg: 'bg-teal-50',
              border: 'group-hover:border-teal-200'
            },
            { 
              href: '/patient/profile', 
              icon: <User size={28} />, 
              title: 'Hồ sơ cá nhân', 
              desc: 'Cập nhật thông tin y tế, nhóm máu, địa chỉ liên hệ.',
              color: 'text-purple-600',
              bg: 'bg-purple-50',
              border: 'group-hover:border-purple-200'
            },
          ].map((c) => (
            <Link
              className={`group flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 ${c.border}`}
              href={c.href}
              key={c.href}
            >
              <div className="mb-6 flex justify-between items-start">
                 <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${c.bg} ${c.color} transition-transform group-hover:scale-110`}>
                   {c.icon}
                 </div>
                 <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#003f87] group-hover:text-white transition-colors">
                    <ArrowRight size={16} />
                 </div>
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-slate-800 mb-2">{c.title}</h4>
                <p className="text-sm font-medium leading-relaxed text-slate-500">{c.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
