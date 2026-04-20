'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useAuthStore } from '@/stores/auth.store';
import { ModeToggle } from '@/components/ui/mode-toggle';

const NAV: { href: string; icon: string; label: string }[] = [
  { href: '/patient', icon: 'dashboard', label: 'Tổng quan' },
  { href: '/patient/ai-assistant', icon: 'smart_toy', label: 'Trợ lý AI' },
  { href: '/doctors', icon: 'search', label: 'Tìm bác sĩ' },
  { href: '/patient/bookings', icon: 'event', label: 'Lịch hẹn' },
];

const USER_NAV: { href: string; icon: string; label: string }[] = [
  { href: '/patient/profile', icon: 'person', label: 'Hồ sơ' },
  { href: '/patient/security', icon: 'security', label: 'Bảo mật' },
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
    <div className="flex min-h-screen flex-col bg-[#f8f9fa] text-slate-900 font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link className="flex items-center gap-2" href="/">
              <div className="rounded-lg bg-primary p-1.5 text-white shadow-sm">
                <span className="material-symbols-outlined text-[20px]">health_and_safety</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">Clinical Precision</h1>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map((item) => {
                const active = navActive(pathname, item.href);
                return (
                  <Link 
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      active 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-1 border-r border-slate-200 pr-4 mr-2">
               {USER_NAV.map((item) => {
                const active = navActive(pathname, item.href);
                return (
                  <Link 
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      active 
                        ? 'text-primary' 
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    title={item.label}
                  >
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold text-slate-900 leading-tight">{user?.fullName ?? 'Bệnh nhân'}</span>
                <span className="text-xs font-medium text-slate-500">{user?.email ?? ''}</span>
              </div>
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.fullName?.charAt(0).toUpperCase() || 'P'}</span>
                )}
              </div>
            </div>
            
            <button
              className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              onClick={() => {
                logout();
                router.replace('/login');
              }}
              title="Đăng xuất"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation - Only visible on small screens */}
      <div className="md:hidden border-b border-slate-200 bg-white overflow-x-auto">
        <nav className="flex items-center p-2 min-w-max">
          {[...NAV, ...USER_NAV].map((item) => {
            const active = navActive(pathname, item.href);
            return (
              <Link 
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  active 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-slate-500">
            © 2024 Clinical Precision. Khách hàng Bệnh nhân.
          </p>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
            <Link href="/patient/support" className="hover:text-primary transition-colors">Hỗ trợ</Link>
            <Link href="/patient/privacy" className="hover:text-primary transition-colors">Bảo mật</Link>
            <Link href="/patient/terms" className="hover:text-primary transition-colors">Điều khoản</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
