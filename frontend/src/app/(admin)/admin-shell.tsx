'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Drawer } from 'vaul';

import { adminApi, authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

const ADMIN_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDUMP08rYqsRC6ewEBgMsxpA7wgUXnnD0_tJeg2dhExPM2ln1Ca3iMmxnPBUW0UmmB3DEYtdNbJB1xAim7gPzNrVJU53gmTfuzIBL3S7OOTR42zSB5a1iGavXy8d-cQAVKTTb_uPOC5OTogepdSKi45wCd3XyTYt09oA2yneo4gz5dtjmRBrEbPorEN6XXxH-RbO5clcwFIn_ntipfYZgFS5BOFmjCt8mgzaOg6IYm-z1xnAhgNTWClY6c52k0uZZOqQhbD2IMGrgBu';

const NAV: { href: string; icon: string; label: string; badgeFrom?: 'pendingPosts' | 'pendingDoctors' }[] = [
  { href: '/admin', icon: 'dashboard', label: 'Dashboard' },
  { href: '/admin/users', icon: 'group', label: 'Người dùng' },
  { href: '/admin/doctors/pending', icon: 'stethoscope', label: 'Duyệt bác sĩ', badgeFrom: 'pendingDoctors' },
  { href: '/admin/posts/pending', icon: 'article', label: 'Duyệt bài viết', badgeFrom: 'pendingPosts' },
  { href: '/admin/specialties', icon: 'category', label: 'Chuyên khoa' },
  { href: '/blog', icon: 'menu_book', label: 'Kiến thức y khoa' },
  { href: '/admin/settings', icon: 'settings', label: 'Cài đặt' },
];

function navActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const { data: summary } = useQuery({
    queryKey: ['admin', 'dashboard', 'summary'],
    queryFn: () => adminApi.dashboardSummary(30),
    enabled: true,
    staleTime: 30_000,
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      logout();
      router.replace('/login');
    },
  });

  const renderSidebar = () => (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-3 p-6">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <span className="material-symbols-outlined">health_and_safety</span>
        </div>
        <div>
          <Link className="text-lg font-bold leading-tight" href="/">
            MediAI
          </Link>
          <p className="text-xs text-muted-foreground">Quản trị</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-4">
        {NAV.map((item) => {
          const active = navActive(pathname, item.href);
          const badge =
            item.badgeFrom && summary
              ? item.badgeFrom === 'pendingPosts'
                ? summary.pendingPosts
                : summary.pendingDoctors
              : null;
          const className = `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? 'bg-primary text-primary-foreground' : 'text-foreground/80 hover:bg-muted hover:text-foreground'
            }`;
          return (
            <Link className={className} href={item.href} key={item.href} onClick={() => setMobileOpen(false)}>
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {badge != null && badge > 0 ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-destructive/15 text-destructive'
                    }`}
                >
                  {badge > 99 ? '99+' : badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 p-2">
          <img
            alt=""
            className="size-8 rounded-full border border-border"
            height={32}
            src={ADMIN_AVATAR}
            width={32}
          />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-bold">{user?.fullName ?? 'Admin'}</span>
            <span className="text-xs text-muted-foreground">Quản trị viên</span>
          </div>
        </div>
        <button
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          disabled={logoutMutation.isPending}
          onClick={() => logoutMutation.mutate()}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          {logoutMutation.isPending ? 'Đang đăng xuất…' : 'Đăng xuất'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden md:block">{renderSidebar()}</aside>

      <main className="flex-1 p-4 md:ml-64 md:p-8">
        <Drawer.Root direction="left" open={mobileOpen} onOpenChange={setMobileOpen}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40 md:hidden" />
            <Drawer.Content className="fixed inset-y-0 left-0 z-50 w-64 outline-none md:hidden">
              {renderSidebar()}
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
        <div className="sticky top-2 z-20 mb-4 flex items-center justify-between rounded-xl border border-border bg-card/95 px-4 py-3 shadow-sm backdrop-blur md:hidden">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
            onClick={() => setMobileOpen(true)}
          >
            <span className="material-symbols-outlined text-[18px]">menu</span>
            Menu
          </button>
          <span className="text-sm font-semibold text-foreground">Quản trị</span>
        </div>
        {children}
      </main>
    </div>
  );
}
