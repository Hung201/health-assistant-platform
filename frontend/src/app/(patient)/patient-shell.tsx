'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Menu } from '@base-ui/react/menu';
import { AlignJustify, Bell, LogOut, User as UserIcon, UserCircle, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { cn } from '@/lib/utils';
import { notificationsApi, type UserNotificationRow } from '@/lib/api';
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

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'Vừa xong';
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(iso).toLocaleString('vi-VN');
}

function priorityClass(p: UserNotificationRow['priority']): string {
  if (p === 'high') return 'bg-red-100 text-red-700';
  if (p === 'low') return 'bg-slate-100 text-slate-600';
  return 'bg-amber-100 text-amber-700';
}

export function PatientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticeFilter, setNoticeFilter] = useState<'all' | 'unread'>('unread');
  const noticeRef = useRef<HTMLDivElement | null>(null);

  const pageTitle = getPageTitle(pathname);

  const { data: noticeRes } = useQuery({
    queryKey: ['patient', 'notifications', noticeFilter],
    queryFn: () => notificationsApi.my(noticeFilter, 20, 0),
    staleTime: 15_000,
    enabled: Boolean(user?.id),
  });
  const notifications = noticeRes?.items ?? [];
  const unreadCount = noticeRes?.unreadCount ?? 0;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['patient', 'notifications'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['patient', 'notifications'] });
    },
  });

  useEffect(() => {
    setMobileNavOpen(false);
    setNoticeOpen(false);
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

  useEffect(() => {
    if (!noticeOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (!noticeRef.current) return;
      if (!noticeRef.current.contains(e.target as Node)) setNoticeOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [noticeOpen]);

  useEffect(() => {
    if (!user?.id) return;
    const es = new EventSource(notificationsApi.streamUrl(), { withCredentials: true });
    const onMessage = () => {
      void qc.invalidateQueries({ queryKey: ['patient', 'notifications'] });
    };
    es.addEventListener('notifications', onMessage);
    es.onerror = () => {
      // EventSource auto-reconnect; keep silent.
    };
    return () => {
      es.removeEventListener('notifications', onMessage);
      es.close();
    };
  }, [qc, user?.id]);

  const closeMobileNav = () => setMobileNavOpen(false);
  const markAllNoticesAsRead = () => {
    if (markAllMutation.isPending || notifications.length === 0) return;
    markAllMutation.mutate();
  };

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
            const className = `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${active
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

          <div className="flex shrink-0 items-center gap-2 sm:gap-3 md:gap-4 md:border-l md:border-slate-200 md:pl-4 lg:pl-6">
            <div className="relative" ref={noticeRef}>
              <button
                type="button"
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                onClick={() => setNoticeOpen((v) => !v)}
                aria-expanded={noticeOpen}
                aria-label="Mở thông báo"
              >
                <Bell size={20} />
                {unreadCount > 0 ? (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : null}
              </button>
              {noticeOpen ? (
                <div className="absolute right-0 top-12 z-40 w-[min(92vw,23rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">Thông báo</p>
                      <p className="text-xs text-slate-500">{unreadCount} chưa đọc</p>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-semibold text-teal-700 hover:underline disabled:text-slate-400"
                      onClick={markAllNoticesAsRead}
                      disabled={notifications.length === 0 || markAllMutation.isPending}
                    >
                      {markAllMutation.isPending ? 'Đang xử lý…' : 'Đánh dấu đã đọc'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setNoticeFilter('unread')}
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-semibold',
                        noticeFilter === 'unread' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      Chưa đọc
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoticeFilter('all')}
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-semibold',
                        noticeFilter === 'all' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      Tất cả
                    </button>
                  </div>
                  <div className="max-h-[22rem] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-slate-500">Chưa có thông báo mới.</div>
                    ) : (
                      notifications.map((n) => {
                        const unread = !n.isRead;
                        return (
                          <Link
                            key={n.id}
                            href={n.link || '/patient/bookings'}
                            className={cn(
                              'block border-b border-slate-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-slate-50',
                              unread ? 'bg-teal-50/40' : '',
                            )}
                            onClick={() => {
                              if (!n.isRead) markReadMutation.mutate(n.id);
                              setNoticeOpen(false);
                            }}
                          >
                            <div className="flex items-start gap-2">
                              <span
                                className={cn(
                                  'mt-1 h-2 w-2 shrink-0 rounded-full',
                                  unread ? 'bg-teal-500' : 'bg-slate-300',
                                )}
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                                  <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', priorityClass(n.priority))}>
                                    {n.priority}
                                  </span>
                                </div>
                                <p className="mt-0.5 truncate text-xs text-slate-600">{n.message}</p>
                                <p className="mt-1 text-[11px] text-slate-400">{relativeTime(n.createdAt)}</p>
                              </div>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                  <div className="border-t border-slate-100 px-4 py-2">
                    <Link
                      href="/patient/bookings"
                      className="text-xs font-semibold text-teal-700 hover:underline"
                      onClick={() => setNoticeOpen(false)}
                    >
                      Xem tất cả tại Lịch hẹn →
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>

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
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

