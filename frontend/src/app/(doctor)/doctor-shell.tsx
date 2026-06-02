'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  AlignJustify, X, LayoutDashboard, Calendar, CalendarCheck,
  Video, MessageSquare, FileText, Stethoscope, BookOpen,
  Lock, Settings, LogOut, User as UserIcon, Home,
} from 'lucide-react';
import { Menu } from '@base-ui/react/menu';

import { useAuthStore } from '@/stores/auth.store';
import './doctor.css';

const NAV = [
  { href: '/',                 Icon: Home,            label: 'Về trang chủ' },
  { href: '/doctor',           Icon: LayoutDashboard, label: 'Tổng quan' },
  { href: '/doctor/slots',     Icon: Calendar,        label: 'Lịch trống' },
  { href: '/doctor/bookings',  Icon: CalendarCheck,   label: 'Lịch hẹn' },
  { href: '/doctor/live',      Icon: Video,           label: 'Phát trực tiếp' },
  { href: '/doctor/qa',        Icon: MessageSquare,   label: 'Hỏi đáp cộng đồng' },
  { href: '/doctor/posts',     Icon: FileText,        label: 'Bài viết của tôi' },
  { href: '/doctor/profile',   Icon: Stethoscope,     label: 'Hồ sơ hành nghề' },
  { href: '/blog',             Icon: BookOpen,        label: 'Kiến thức y khoa' },
  { href: '/doctor/security',  Icon: Lock,            label: 'Bảo mật' },
  { href: '/doctor/settings',  Icon: Settings,        label: 'Cài đặt' },
];

// Bottom tabs for mobile (most important pages)
const MOBILE_TABS = [
  { href: '/doctor',           Icon: LayoutDashboard, label: 'Tổng quan' },
  { href: '/doctor/slots',     Icon: Calendar,        label: 'Lịch trống' },
  { href: '/doctor/bookings',  Icon: CalendarCheck,   label: 'Lịch hẹn' },
  { href: '/doctor/live',      Icon: Video,           label: 'Trực tiếp' },
];

// More nav for the slide-up sheet
const MORE_NAV = [
  { href: '/',                 Icon: Home,            label: 'Về trang chủ' },
  { href: '/doctor/qa',        Icon: MessageSquare,   label: 'Hỏi đáp cộng đồng' },
  { href: '/doctor/posts',     Icon: FileText,        label: 'Bài viết của tôi' },
  { href: '/doctor/profile',   Icon: Stethoscope,     label: 'Hồ sơ hành nghề' },
  { href: '/blog',             Icon: BookOpen,        label: 'Kiến thức y khoa' },
  { href: '/doctor/security',  Icon: Lock,            label: 'Bảo mật' },
  { href: '/doctor/settings',  Icon: Settings,        label: 'Cài đặt' },
];

function navActive(pathname: string, href: string) {
  if (href === '/doctor') return pathname === '/doctor';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getPageTitle(pathname: string) {
  if (pathname === '/doctor') return 'Tổng quan';
  if (pathname.startsWith('/doctor/slots')) return 'Lịch trống';
  if (pathname.startsWith('/doctor/bookings')) return 'Lịch hẹn';
  if (pathname.startsWith('/doctor/live')) return 'Phát trực tiếp';
  if (pathname.startsWith('/doctor/qa')) return 'Hỏi đáp cộng đồng';
  if (pathname.startsWith('/doctor/posts')) return 'Bài viết của tôi';
  if (pathname.startsWith('/doctor/profile')) return 'Hồ sơ hành nghề';
  if (pathname.startsWith('/doctor/security')) return 'Bảo mật';
  if (pathname.startsWith('/doctor/settings')) return 'Cài đặt';
  if (pathname.startsWith('/blog')) return 'Kiến thức y khoa';
  return 'Bác sĩ';
}

export function DoctorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  const pageTitle = getPageTitle(pathname);

  const userInitials = user?.fullName
    ? user.fullName.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase()
    : 'BS';

  useEffect(() => { setMobileOpen(false); setMoreSheetOpen(false); }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!moreSheetOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMoreSheetOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [moreSheetOpen]);

  const closeMobile = () => setMobileOpen(false);

  const renderSidebar = () => (
    <div
      className="doctor-sidebar flex h-full w-[260px] flex-col border-r border-border shadow-sm"
    >
      {/* Logo */}
      <div className="flex h-[72px] shrink-0 items-center gap-[10px] px-5 border-b border-border">
        <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-[#0D9E75] text-white shadow-sm">
          <span className="material-symbols-outlined text-[20px]">clinical_notes</span>
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href="/"
            onClick={closeMobile}
            className="block text-[16px] font-bold leading-tight text-foreground truncate"
          >
            Clinical Precision
          </Link>
          <p className="text-[10px] font-medium tracking-widest text-[#0D9E75] uppercase mt-0.5">
            BÁC SĨ PORTAL
          </p>
        </div>
        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
          onClick={closeMobile}
          aria-label="Đóng menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 hide-scrollbar">
        <p className="px-5 pt-4 pb-1.5 text-[10px] font-semibold tracking-[.08em] uppercase text-muted-foreground">
          MENU CHÍNH
        </p>
        {NAV.map((item) => {
          const active = navActive(pathname, item.href);
          const Icon = item.Icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobile}
              className={[
                'mx-2 my-0.5 flex h-11 items-center gap-[10px] rounded-[10px] px-3 text-[14px] font-medium transition-all duration-150',
                active
                  ? 'doctor-nav-active text-white'
                  : 'text-foreground/70 hover:bg-[#E8F8F2]/60 dark:hover:bg-[#0D9E75]/10 hover:text-[#0D9E75]',
              ].join(' ')}
            >
              <Icon
                size={18}
                className={active ? 'text-white' : 'text-muted-foreground'}
              />
              <span className="flex-1">{item.label}</span>
              {active && <span className="h-1.5 w-1.5 rounded-full bg-white/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom user card */}
      <div className="shrink-0 border-t border-border p-4 bg-card/60">
        <div className="mb-3 h-[2px] w-8 rounded-full bg-gradient-to-r from-[#0D9E75] to-[#1BAF7C]" />
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#0D9E75]/10 flex items-center justify-center text-[#0D9E75] text-sm font-bold">
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt={user.fullName ?? ''} className="h-full w-full object-cover" />
              : userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-foreground truncate">
              {user?.fullName ? `BS ${user.fullName}` : 'Bác sĩ'}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">{user?.email ?? ''}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-[2px] lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed z-30 flex h-full flex-col transition-transform duration-200 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
        id="doctor-sidebar-nav"
      >
        {renderSidebar()}
      </aside>

      {/* Main */}
      <div className="ml-0 flex min-h-screen flex-1 flex-col lg:ml-[260px]">
        {/* Sticky header */}
        <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {/* Mobile Logo */}
            <Link href="/" className="flex items-center gap-2.5 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0D9E75] text-white shadow-sm">
                <span className="material-symbols-outlined text-[18px]">clinical_notes</span>
              </div>
              <span className="text-[16px] font-bold text-foreground truncate">Clinical Precision</span>
            </Link>

            {/* Desktop Title */}
            <div className="hidden lg:flex min-w-0 items-center gap-0">
              <span className="doctor-breadcrumb-accent hidden sm:inline-block" aria-hidden />
              <h1 className="text-[20px] font-bold text-foreground truncate">{pageTitle}</h1>
            </div>
          </div>

          {/* Right side */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Specialty badge */}
            {user?.doctorSpecialty && (
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#0D9E75]/20 bg-[#E8F8F2] dark:bg-[#0D9E75]/10 px-3 py-1 text-xs font-semibold text-[#0D9E75]">
                <Stethoscope size={12} />
                {user.doctorSpecialty.name}
              </span>
            )}
            {/* Avatar menu */}
            <Menu.Root modal={false}>
              <Menu.Trigger
                type="button"
                delay={120}
                closeDelay={180}
                openOnHover
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ring-2 ring-[#0D9E75]/30 bg-[#0D9E75]/10 text-[#0D9E75] text-sm font-bold outline-none transition-all hover:ring-[#0D9E75]/60 focus-visible:ring-[#0D9E75]"
              >
                {user?.avatarUrl
                  ? <img src={user.avatarUrl} alt={user.fullName ?? ''} className="h-full w-full object-cover" />
                  : userInitials}
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner side="bottom" align="end" sideOffset={8} className="z-[100]">
                  <Menu.Popup className="min-w-[220px] origin-[var(--transform-origin)] rounded-xl border border-[#E8EDF2] bg-white py-1.5 text-slate-800 shadow-lg outline-none data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0">
                    <div className="border-b border-slate-100 px-3 pb-2 pt-1">
                      <p className="truncate text-sm font-bold text-[#1a3353]">
                        {user?.fullName ? `BS ${user.fullName}` : 'Bác sĩ'}
                      </p>
                      <p className="truncate text-xs text-slate-400">{user?.email ?? ''}</p>
                    </div>
                    <Menu.Item
                      className="mx-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium outline-none data-[highlighted]:bg-[#0D9E75]/10 data-[highlighted]:text-[#0D9E75]"
                      onClick={() => router.push('/doctor/profile')}
                    >
                      <UserIcon size={16} className="text-slate-400" />
                      Hồ sơ cá nhân
                    </Menu.Item>
                    <Menu.Separator className="my-1 h-px bg-slate-100" />
                    <Menu.Item
                      className="mx-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 outline-none data-[highlighted]:bg-red-50"
                      onClick={() => { logout(); router.replace('/login'); }}
                    >
                      <LogOut size={16} />
                      Rời đi
                    </Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </div>
        </header>

        {/* Page content */}
        <main key={pathname} className="flex-1 p-4 pb-[5.5rem] sm:p-6 sm:pb-[5.5rem] lg:p-8 lg:pb-8 doctor-page-enter">
          {children}
        </main>
      </div>

      {/* ── MOBILE BOTTOM TAB BAR ── */}
      <nav className="doctor-mobile-bottom-nav lg:hidden" aria-label="Điều hướng chính">
        {MOBILE_TABS.map(({ href, Icon, label }) => {
          const active = navActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`doctor-mobile-tab-item ${active ? 'active' : ''}`}
            >
              <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={`doctor-mobile-tab-item ${
            moreSheetOpen || MORE_NAV.some((n) => navActive(pathname, n.href)) ? 'active' : ''
          }`}
          onClick={() => setMoreSheetOpen(true)}
          aria-label="Xem thêm"
        >
          <AlignJustify size={21} strokeWidth={1.8} />
          <span>Thêm</span>
        </button>
      </nav>

      {/* ── MORE SHEET (mobile) ── */}
      {moreSheetOpen && (
        <>
          <button
            type="button"
            aria-label="Đóng"
            className="lg:hidden fixed inset-0 z-[50] bg-slate-900/50 backdrop-blur-[2px]"
            onClick={() => setMoreSheetOpen(false)}
          />
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-[60] rounded-t-3xl bg-white shadow-2xl bottom-sheet-slide-up">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="h-1 w-10 rounded-full bg-slate-200" />
            </div>
            {/* User card */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100">
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[#0D9E75]/10 flex items-center justify-center text-[#0D9E75] text-sm font-bold">
                {user?.avatarUrl
                  ? <img src={user.avatarUrl} alt={user.fullName ?? ''} className="h-full w-full object-cover" />
                  : userInitials}
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-[#1a3353] truncate">{user?.fullName ? `BS ${user.fullName}` : 'Bác sĩ'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email ?? ''}</p>
              </div>
            </div>
            {/* Nav items */}
            <div className="p-3">
              {MORE_NAV.map(({ href, Icon, label }) => {
                const active = navActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreSheetOpen(false)}
                    className={[
                      'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                      active ? 'bg-[#E8F8F2] text-[#0D9E75]' : 'text-slate-700 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <Icon size={18} className={active ? 'text-[#0D9E75]' : 'text-slate-400'} />
                    {label}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => { logout(); router.replace('/login'); }}
                className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors mt-1"
              >
                <LogOut size={18} />
                Đăng xuất
              </button>
            </div>
            {/* Safe area */}
            <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
          </div>
        </>
      )}
    </div>
  );
}
