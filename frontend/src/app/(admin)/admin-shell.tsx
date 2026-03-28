'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { getStoredUser, isAdminUser } from '@/lib/auth';

const ADMIN_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDUMP08rYqsRC6ewEBgMsxpA7wgUXnnD0_tJeg2dhExPM2ln1Ca3iMmxnPBUW0UmmB3DEYtdNbJB1xAim7gPzNrVJU53gmTfuzIBL3S7OOTR42zSB5a1iGavXy8d-cQAVKTTb_uPOC5OTogepdSKi45wCd3XyTYt09oA2yneo4gz5dtjmRBrEbPorEN6XXxH-RbO5clcwFIn_ntipfYZgFS5BOFmjCt8mgzaOg6IYm-z1xnAhgNTWClY6c52k0uZZOqQhbD2IMGrgBu';

const navItems: {
  href: string | null;
  icon: string;
  label: string;
  badge: string | null;
}[] = [
  { href: '/admin', icon: 'dashboard', label: 'Dashboard', badge: null },
  { href: null, icon: 'article', label: 'Duyệt bài viết', badge: '12' },
  { href: null, icon: 'stethoscope', label: 'Chuyên khoa', badge: null },
  { href: null, icon: 'group', label: 'Người dùng', badge: null },
  { href: null, icon: 'settings', label: 'Cài đặt', badge: null },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);
    if (!u || !isAdminUser(u)) {
      router.replace('/login');
      return;
    }
    setChecked(true);
  }, [router]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light text-slate-600">
        Đang tải…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background-light text-slate-900">
      <aside className="fixed flex h-full w-64 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-3 p-6">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-white">
            <span className="material-symbols-outlined">health_and_safety</span>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-slate-900">MediAI</h1>
            <p className="text-xs text-slate-500">Hệ thống Y tế AI</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-4">
          {navItems.map((item) => {
            const active = Boolean(item.href && pathname === item.href);
            const className = `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'
            }`;
            const inner = (
              <>
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge ? (
                  <span
                    className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </>
            );
            if (item.href) {
              return (
                <Link className={className} href={item.href} key={item.label}>
                  {inner}
                </Link>
              );
            }
            return (
              <button className={`${className} cursor-default text-left`} key={item.label} type="button">
                {inner}
              </button>
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
        </div>
      </aside>

      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}
