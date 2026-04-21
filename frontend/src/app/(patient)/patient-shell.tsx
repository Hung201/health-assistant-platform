'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Bell, User as UserIcon } from 'lucide-react';

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

  const pageTitle = getPageTitle(pathname);

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="fixed flex h-full w-64 flex-col border-r border-slate-200 bg-white shadow-sm z-20">
        <div className="flex items-center gap-3 p-6 border-b border-slate-100">
          <div className="flex size-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
            <span className="material-symbols-outlined text-[20px]">medical_services</span>
          </div>
          <div>
            <Link className="text-lg font-bold leading-tight text-slate-800" href="/">
              Clinical Precision
            </Link>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">AI Diagnostic Hub</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {NAV.map((item) => {
            const active = navActive(pathname, item.href);
            const className = `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              active 
                ? 'bg-[#eefaf8] text-teal-700 shadow-sm ring-1 ring-teal-100' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`;
            return (
              <Link className={className} href={item.href} key={item.href}>
                <span className={`material-symbols-outlined text-[20px] ${active ? 'text-teal-600' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="border-t border-slate-100 p-4 bg-slate-50/50">
          <div className="mb-4 flex items-center justify-between rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                <UserIcon size={18} />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-bold text-slate-800">{user?.fullName ?? 'Bệnh nhân'}</span>
                <span className="truncate text-[10px] text-slate-500">{user?.email ?? 'Chưa cập nhật'}</span>
              </div>
            </div>
          </div>
          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:text-red-600 hover:ring-red-200"
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

      {/* Main Content Area */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-md">
          <h1 className="text-xl font-bold text-[#003f87]">{pageTitle}</h1>
          
          <div className="flex items-center gap-6">
            <div className="relative w-80">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm tài liệu..."
                className="w-full rounded-full border border-slate-200 bg-[#f8f9fa] py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
              />
            </div>
            
            <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
              <button className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700">
                <Bell size={20} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-600 transition-colors hover:bg-slate-300 overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                ) : (
                  <UserIcon size={20} />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}

