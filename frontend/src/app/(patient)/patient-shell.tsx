'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu } from '@base-ui/react/menu';
import { AlignJustify, Bell, LogOut, Search, User as UserIcon, UserCircle, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';

const NAV: { href: string; icon: string; label: string }[] = [
  { href: '/patient', icon: 'dashboard', label: 'Tổng quan' },
  { href: '/patient/ai-assistant', icon: 'smart_toy', label: 'Trạm AI' },
  { href: '/patient/doctors', icon: 'calendar_month', label: 'Đặt lịch' },
  { href: '/patient/bookings', icon: 'event_note', label: 'Lịch hẹn' },
  { href: '/patient/profile', icon: 'person', label: 'Hồ sơ cá nhân' },
  { href: '/blog', icon: 'article', label: 'Blog' },
  { href: '/patient/security', icon: 'lock', label: 'Bảo mật' },
];

function navActive(pathname: string, href: string) {
  if (href === '/patient') return pathname === '/patient';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getPageTitle(pathname: string) {
  const item = NAV.find((n) => navActive(pathname, n.href));
  if (item?.href === '/patient/ai-assistant') return 'Trạm AI phân tích triệu chứng';
  return item ? item.label : 'Dashboard';
}

export function PatientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const pageTitle = getPageTitle(pathname);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] text-slate-900 font-sans">
      {mobileNavOpen ? (
        <button
          type="button"
          aria-label="Đóng menu điều hướng"
          className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-[1px] lg:hidden"
          onClick={closeMobileNav}
        />
      ) : null}

      {/* Sidebar: drawer < lg, fixed bar ≥ lg */}
      <aside
        className={cn(
          'fixed flex h-full w-[min(100vw-3rem,16rem)] max-w-[16rem] flex-col border-r border-slate-200 bg-white shadow-lg transition-transform duration-200 ease-out sm:w-64 lg:shadow-sm',
          'z-30',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        id="patient-sidebar-nav"
      >
        <div className="flex items-center gap-3 border-b border-slate-100 p-4 sm:p-6">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
            <span className="material-symbols-outlined text-[20px]">medical_services</span>
          </div>
          <div className="min-w-0 flex-1">
            <Link className="text-base font-bold leading-tight text-slate-800 sm:text-lg" href="/" onClick={closeMobileNav}>
              Clinical Precision
            </Link>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">AI Diagnostic Hub</p>
          </div>
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={closeMobileNav}
            aria-label="Đóng menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4 sm:px-4 sm:py-6">
          {NAV.map((item) => {
            const active = navActive(pathname, item.href);
            const className = `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              active
                ? 'bg-[#eefaf8] text-teal-700 shadow-sm ring-1 ring-teal-100'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`;
            return (
              <Link className={className} href={item.href} key={item.href} onClick={closeMobileNav}>
                <span className={`material-symbols-outlined text-[20px] ${active ? 'text-teal-600' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="ml-0 flex min-h-screen flex-1 flex-col lg:ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex min-h-16 w-full items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-md sm:min-h-20 sm:gap-4 sm:px-6 lg:h-20 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 lg:hidden"
              onClick={() => setMobileNavOpen(true)}
              aria-expanded={mobileNavOpen}
              aria-controls="patient-sidebar-nav"
              aria-label="Mở menu điều hướng"
            >
              <AlignJustify size={20} />
            </button>
            <h1 className="min-w-0 truncate text-lg font-bold text-[#003f87] sm:text-xl">{pageTitle}</h1>
          </div>

          <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3 md:gap-4 md:border-l md:border-slate-200 md:pl-4 lg:pl-6">
            <div className="relative hidden min-w-0 md:block md:w-48 lg:w-80">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm tài liệu..."
                className="w-full rounded-full border border-slate-200 bg-[#f8f9fa] py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
              />
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <Bell size={20} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>

              <Menu.Root modal={false}>
                <Menu.Trigger
                  type="button"
                  delay={120}
                  closeDelay={180}
                  openOnHover
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-600 outline-none ring-offset-2 transition-colors hover:bg-slate-300 focus-visible:ring-2 focus-visible:ring-teal-500 overflow-hidden"
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.fullName ?? ''} className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon size={20} />
                  )}
                </Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner side="bottom" align="end" sideOffset={8} className="z-[100]">
                    <Menu.Popup className="min-w-[240px] origin-[var(--transform-origin)] rounded-xl border border-slate-200 bg-white py-1.5 text-slate-800 shadow-lg shadow-slate-200/80 outline-none data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0">
                      <div className="border-b border-slate-100 px-3 pb-2 pt-1">
                        <p className="truncate text-sm font-bold text-slate-900">{user?.fullName ?? 'Bệnh nhân'}</p>
                        <p className="truncate text-xs text-slate-500">{user?.email ?? 'Chưa cập nhật'}</p>
                      </div>
                      <Menu.Item
                        className="mx-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium outline-none data-[highlighted]:bg-[#eefaf8] data-[highlighted]:text-teal-800"
                        onClick={() => router.push('/patient/profile')}
                      >
                        <UserCircle size={18} className="text-slate-500" />
                        Hồ sơ cá nhân
                      </Menu.Item>
                      <Menu.Separator className="my-1 h-px bg-slate-100" />
                      <Menu.Item
                        className="mx-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 outline-none data-[highlighted]:bg-red-50"
                        onClick={() => {
                          logout();
                          router.replace('/login');
                        }}
                      >
                        <LogOut size={18} />
                        Đăng xuất
                      </Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

