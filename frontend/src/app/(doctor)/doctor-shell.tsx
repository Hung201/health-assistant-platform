'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Drawer } from 'vaul';

import { useAuthStore } from '@/stores/auth.store';

const NAV: { href: string; icon: string; label: string }[] = [
  { href: '/doctor', icon: 'home', label: 'Tổng quan' },
  { href: '/doctor/slots', icon: 'schedule', label: 'Lịch trống' },
  { href: '/doctor/bookings', icon: 'event_note', label: 'Lịch hẹn' },
  { href: '/doctor/posts', icon: 'article', label: 'Bài viết của tôi' },
  { href: '/doctor/profile', icon: 'stethoscope', label: 'Hồ sơ hành nghề' },
  { href: '/blog', icon: 'menu_book', label: 'Kiến thức y khoa' },
  { href: '/doctor/security', icon: 'lock', label: 'Bảo mật' },
  { href: '/doctor/settings', icon: 'settings', label: 'Cài đặt' },
];

function navActive(pathname: string, href: string) {
  if (href === '/doctor') return pathname === '/doctor';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DoctorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const renderSidebar = () => (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-3 p-6">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <span className="material-symbols-outlined">clinical_notes</span>
        </div>
        <div>
          <Link className="text-lg font-bold leading-tight" href="/">
            Clinical Precision
          </Link>
          <p className="text-xs text-muted-foreground">Bác sĩ</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-4">
        {NAV.map((item) => {
          const active = navActive(pathname, item.href);
          const className = `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            active ? 'bg-primary text-primary-foreground' : 'text-foreground/80 hover:bg-muted hover:text-foreground'
          }`;
          return (
            <Link className={className} href={item.href} key={item.href} onClick={() => setMobileOpen(false)}>
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <div className="mb-3 flex min-w-0 flex-col">
          <span className="truncate text-sm font-bold">{user?.fullName ?? 'Bác sĩ'}</span>
          <span className="truncate text-xs text-muted-foreground">{user?.email ?? ''}</span>
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
    </div>
  );

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden md:block">{renderSidebar()}</aside>
      <main className="flex-1 overflow-x-hidden p-4 md:ml-64 md:p-8">
        <Drawer.Root direction="left" open={mobileOpen} onOpenChange={setMobileOpen} shouldScaleBackground={false}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40 md:hidden" />
            <Drawer.Content className="fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] outline-none md:hidden">
              {renderSidebar()}
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
        <div className="mb-4 h-[56px] md:hidden" />
        <div className="fixed left-4 right-4 top-2 z-30 flex w-auto items-center justify-between rounded-xl border border-border bg-card/95 px-4 py-3 shadow-sm backdrop-blur md:hidden">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
            onClick={() => setMobileOpen(true)}
          >
            <span className="material-symbols-outlined text-[18px]">menu</span>
            Menu
          </button>
          <span className="text-sm font-semibold text-foreground">Bác sĩ</span>
        </div>
        {children}
      </main>
    </div>
  );
}

