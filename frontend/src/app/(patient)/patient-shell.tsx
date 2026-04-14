'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useAuthStore } from '@/stores/auth.store';

const NAV: { href: string; icon: string; label: string }[] = [
  { href: '/patient', icon: 'home', label: 'Tổng quan' },
  { href: '/patient/ai-assistant', icon: 'smart_toy', label: 'Trợ lý sức khỏe AI' },
  { href: '/patient/doctors', icon: 'search', label: 'Tìm bác sĩ' },
  { href: '/patient/bookings', icon: 'event', label: 'Lịch hẹn của tôi' },
  { href: '/patient/profile', icon: 'person', label: 'Hồ sơ' },
];

function navActive(pathname: string, href: string) {
  if (href === '/patient') return pathname === '/patient';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PatientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex min-h-screen bg-background-light text-slate-900">
      <aside className="fixed flex h-full w-64 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-3 p-6">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-white">
            <span className="material-symbols-outlined">health_and_safety</span>
          </div>
          <div>
            <Link className="text-lg font-bold leading-tight text-slate-900" href="/">
              Clinical Precision
            </Link>
            <p className="text-xs text-slate-500">Bệnh nhân</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-4">
          {NAV.map((item) => {
            const active = navActive(pathname, item.href);
            const className = `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'
            }`;
            return (
              <Link className={className} href={item.href} key={item.href}>
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <div className="mb-3 flex min-w-0 flex-col">
            <span className="truncate text-sm font-bold">{user?.fullName ?? 'Bệnh nhân'}</span>
            <span className="truncate text-xs text-slate-500">{user?.email ?? ''}</span>
          </div>
          <button
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            onClick={() => {
              logout();
              router.replace('/login');
            }}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}

