'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

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

  const { data: summary } = useQuery({
    queryKey: ['admin', 'dashboard', 'summary'],
    queryFn: adminApi.dashboardSummary,
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

  return (
    <div className="flex min-h-screen bg-background-light text-slate-900">
      <aside className="fixed flex h-full w-64 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-3 p-6">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-white">
            <span className="material-symbols-outlined">health_and_safety</span>
          </div>
          <div>
            <Link className="text-lg font-bold leading-tight text-slate-900" href="/">
              MediAI
            </Link>
            <p className="text-xs text-slate-500">Quản trị</p>
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
            const className = `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'
            }`;
            return (
              <Link className={className} href={item.href} key={item.href}>
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {badge != null && badge > 0 ? (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      active ? 'bg-white/25 text-white' : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {badge > 99 ? '99+' : badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3 p-2">
            <img
              alt=""
              className="size-8 rounded-full border border-slate-200"
              height={32}
              src={ADMIN_AVATAR}
              width={32}
            />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-bold">{user?.fullName ?? 'Admin'}</span>
              <span className="text-xs text-slate-500">Quản trị viên</span>
            </div>
          </div>
          <button
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            {logoutMutation.isPending ? 'Đang đăng xuất…' : 'Đăng xuất'}
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}
