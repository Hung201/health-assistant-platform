'use client';

import Link from 'next/link';

export default function PatientDashboardPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tổng quan</h2>
          <p className="text-sm text-muted-foreground">Bắt đầu đặt lịch khám theo chuyên khoa hoặc bác sĩ.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { href: '/patient/doctors', icon: 'search', title: 'Tìm bác sĩ', desc: 'Theo chuyên khoa, đánh giá, tên.' },
          { href: '/patient/bookings', icon: 'event', title: 'Lịch hẹn', desc: 'Xem và theo dõi trạng thái.' },
          { href: '/patient/profile', icon: 'person', title: 'Hồ sơ', desc: 'Thông tin cơ bản và liên hệ.' },
        ].map((c) => (
          <Link
            className="rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted"
            href={c.href}
            key={c.href}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">{c.icon}</span>
              <p className="font-bold text-foreground">{c.title}</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

