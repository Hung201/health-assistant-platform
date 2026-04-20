'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';

export default function PatientDashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-8 pb-8">
      <header className="relative overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200">
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-primary/10 to-transparent mix-blend-multiply" />
        <div className="absolute -right-24 -top-24 z-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-8 md:p-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 mb-4">
              <span className="material-symbols-outlined text-[16px] text-primary">waving_hand</span>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Xin chào</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              {user?.fullName || 'Bệnh nhân'}
            </h2>
            <p className="text-slate-600 max-w-lg">
              Chào mừng bạn đến với trung tâm y tế số. Quản lý sức khỏe, lịch hẹn và hồ sơ y tế của bạn ngay tại đây.
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center border-4 border-white shadow-sm overflow-hidden text-primary text-3xl font-bold">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <span>{user?.fullName?.charAt(0).toUpperCase() || 'P'}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4 px-2">Truy cập nhanh</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { 
              href: '/patient/ai-assistant', 
              icon: 'smart_toy', 
              title: 'Trợ lý AI', 
              desc: 'Kiểm tra triệu chứng ban đầu với AI.',
              color: 'text-indigo-600',
              bg: 'bg-indigo-50'
            },
            { 
              href: '/patient/doctors', 
              icon: 'search', 
              title: 'Tìm bác sĩ', 
              desc: 'Khám phá và đặt lịch với chuyên gia.',
              color: 'text-emerald-600',
              bg: 'bg-emerald-50'
            },
            { 
              href: '/patient/bookings', 
              icon: 'event', 
              title: 'Lịch hẹn', 
              desc: 'Theo dõi các cuộc hẹn sắp tới.',
              color: 'text-orange-600',
              bg: 'bg-orange-50'
            },
            { 
              href: '/patient/profile', 
              icon: 'folder_shared', 
              title: 'Hồ sơ y tế', 
              desc: 'Cập nhật thông tin cá nhân & bệnh án.',
              color: 'text-blue-600',
              bg: 'bg-blue-50'
            },
          ].map((c) => (
            <Link
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-slate-300"
              href={c.href}
              key={c.href}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${c.bg} ${c.color} group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-[24px]">{c.icon}</span>
                </div>
                <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">arrow_outward</span>
              </div>
              <div>
                <p className="font-bold text-slate-900 mb-1">{c.title}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{c.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 px-2">Lịch hẹn sắp tới</h3>
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm flex flex-col items-center justify-center min-h-[200px]">
            <div className="mb-4 rounded-full bg-slate-50 p-4 text-slate-400">
              <span className="material-symbols-outlined text-[32px]">calendar_month</span>
            </div>
            <p className="text-slate-600 font-medium">Bạn chưa có lịch hẹn nào sắp tới.</p>
            <Link href="/patient/doctors" className="mt-4 text-sm font-bold text-primary hover:underline">
              Đặt lịch ngay
            </Link>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 px-2">Nhắc nhở sức khỏe</h3>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
             <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                <div className="bg-amber-100 text-amber-600 rounded-lg p-2 mt-1">
                   <span className="material-symbols-outlined text-[18px]">water_drop</span>
                </div>
                <div>
                   <p className="font-bold text-slate-900 text-sm">Uống đủ nước</p>
                   <p className="text-xs text-slate-500 mt-1">Nên uống ít nhất 2 lít nước mỗi ngày để cơ thể khỏe mạnh.</p>
                </div>
             </div>
             <div className="flex items-start gap-4">
                <div className="bg-emerald-100 text-emerald-600 rounded-lg p-2 mt-1">
                   <span className="material-symbols-outlined text-[18px]">directions_walk</span>
                </div>
                <div>
                   <p className="font-bold text-slate-900 text-sm">Vận động nhẹ nhàng</p>
                   <p className="text-xs text-slate-500 mt-1">Dành 30 phút mỗi ngày cho các bài tập giãn cơ cơ bản.</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
