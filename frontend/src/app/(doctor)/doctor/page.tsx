'use client';

import Link from 'next/link';

export default function DoctorDashboardPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tổng quan</h2>
          <p className="text-sm text-slate-500">Quản lý lịch trống và theo dõi lịch hẹn.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { href: '/doctor/slots', icon: 'schedule', title: 'Lịch trống', desc: 'Tạo và cập nhật khung giờ khám.' },
          { href: '/doctor/bookings', icon: 'event_note', title: 'Lịch hẹn', desc: 'Duyệt/ghi chú các lịch hẹn.' },
          { href: '/doctor/profile', icon: 'stethoscope', title: 'Hồ sơ', desc: 'Cập nhật thông tin hành nghề.' },
        ].map((c) => (
          <Link
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:bg-slate-50"
            href={c.href}
            key={c.href}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">{c.icon}</span>
              <p className="font-bold text-slate-900">{c.title}</p>
            </div>
            <p className="mt-2 text-sm text-slate-500">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

