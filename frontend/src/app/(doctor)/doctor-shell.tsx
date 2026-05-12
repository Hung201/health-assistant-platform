'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  AlignJustify, X, LayoutDashboard, Calendar, CalendarCheck,
  Video, MessageSquare, FileText, Stethoscope, BookOpen,
  Lock, Settings, LogOut, User as UserIcon, ChevronRight,
} from 'lucide-react';

import { useAuthStore } from '@/stores/auth.store';
import './doctor.css';

const NAV = [
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

  const pageTitle = getPageTitle(pathname);

  const userInitials = user?.fullName
    ? user.fullName.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase()
    : 'BS';

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  const renderSidebar = () => (
    <div
      className="doctor-sidebar flex h-full w-[260px] flex-col border-r border-[#E8EDF2] shadow-sm"
    >
      {/* Logo */}
      <div className="flex h-[72px] shrink-0 items-center gap-[10px] px-5 border-b border-[#E8EDF2]">
        <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-[#0D9E75] text-white shadow-sm">
          <span className="material-symbols-outlined text-[20px]">clinical_notes</span>
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href="/"
            onClick={closeMobile}
            className="block text-[16px] font-bold leading-tight text-[#1a3353] truncate"
          >
            Clinical Precision
          </Link>
          <p className="text-[10px] font-medium tracking-widest text-[#0D9E75] uppercase mt-0.5">
            BÁC SĨ PORTAL
          </p>
        </div>
        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 lg:hidden"
          onClick={closeMobile}
          aria-label="Đóng menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 hide-scrollbar">
        <p className="px-5 pt-4 pb-1.5 text-[10px] font-semibold tracking-[.08em] uppercase text-[#94A3B8]">
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
                  : 'text-[#475569] hover:bg-[#E8F8F2]/60 hover:text-[#0D9E75]',
              ].join(' ')}
            >
              <Icon
                size={18}
                className={active ? 'text-white' : 'text-[#94A3B8]'}
              />
              <span className="flex-1">{item.label}</span>
              {active && <span className="h-1.5 w-1.5 rounded-full bg-white/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom user card */}
      <div className="shrink-0 border-t border-[#E8EDF2] p-4 bg-white/60">
        <div className="mb-3 h-[2px] w-8 rounded-full bg-gradient-to-r from-[#0D9E75] to-[#1BAF7C]" />
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#0D9E75]/10 flex items-center justify-center text-[#0D9E75] text-sm font-bold">
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt={user.fullName ?? ''} className="h-full w-full object-cover" />
              : userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[#1a3353] truncate">
              {user?.fullName ? `BS ${user.fullName}` : 'Bác sĩ'}
            </p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email ?? ''}</p>
          </div>
          <button
            type="button"
            aria-label="Đăng xuất"
            onClick={() => { logout(); router.replace('/login'); }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Đăng xuất"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F7FAFB] text-slate-900 font-sans">
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
        <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between gap-3 border-b border-[#E8EDF2]/80 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 ring-1 ring-slate-200 hover:bg-[#E8F8F2] hover:text-[#0D9E75] hover:ring-[#0D9E75]/30 transition-all lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Mở menu"
            >
              <AlignJustify size={20} />
            </button>
            <div className="flex min-w-0 items-center gap-0">
              <span className="doctor-breadcrumb-accent hidden sm:inline-block" aria-hidden />
              <h1 className="text-[18px] sm:text-[20px] font-bold text-[#1a3353] truncate">{pageTitle}</h1>
            </div>
          </div>

          {/* Right side */}
          <div className="flex shrink-0 items-center gap-3">
            {/* Specialty badge */}
            {user?.doctorSpecialty && (
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#0D9E75]/20 bg-[#E8F8F2] px-3 py-1 text-xs font-semibold text-[#0D9E75]">
                <Stethoscope size={12} />
                {user.doctorSpecialty.name}
              </span>
            )}
            {/* Avatar */}
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ring-2 ring-[#0D9E75]/30 bg-[#0D9E75]/10 text-[#0D9E75] text-sm font-bold">
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt={user.fullName ?? ''} className="h-full w-full object-cover" />
                : userInitials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main key={pathname} className="flex-1 p-4 sm:p-6 lg:p-8 doctor-page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}
