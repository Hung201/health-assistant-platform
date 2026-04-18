'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useAuthStore } from '@/stores/auth.store';
import { ModeToggle } from '@/components/ui/mode-toggle';

const NAV: { href: string; icon: string; label: string }[] = [
  { href: '/patient', icon: 'home', label: 'Tổng quan' },
  { href: '/patient/ai-assistant', icon: 'smart_toy', label: 'Trợ lý sức khỏe AI' },
  { href: '/patient/doctors', icon: 'search', label: 'Tìm bác sĩ' },
  { href: '/patient/bookings', icon: 'event', label: 'Lịch hẹn của tôi' },
  { href: '/patient/profile', icon: 'person', label: 'Hồ sơ' },
  { href: '/patient/security', icon: 'security', label: 'Bảo mật' },
  { href: '/blog', icon: 'menu_book', label: 'Kiến thức y khoa' },
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
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="fixed flex h-full w-64 flex-col border-r border-border bg-card">
        <div className="flex items-center gap-3 p-6">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="material-symbols-outlined">health_and_safety</span>
          </div>
          <div>
            <Link className="text-lg font-bold leading-tight" href="/">
              Clinical Precision
            </Link>
            <p className="text-xs text-muted-foreground">Bệnh nhân</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-4">
          {NAV.map((item) => {
            const active = navActive(pathname, item.href);
            const className = `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active ? 'bg-primary text-primary-foreground' : 'text-foreground/80 hover:bg-muted hover:text-foreground'
            }`;
            return (
              <Link className={className} href={item.href} key={item.href}>
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-bold">{user?.fullName ?? 'Bệnh nhân'}</span>
              <span className="truncate text-xs text-muted-foreground">{user?.email ?? ''}</span>
            </div>
            <ModeToggle />
          </div>
          <button
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
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

