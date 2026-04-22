'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { usersApi } from '@/lib/api';
import { syncAuthToLegacyStorage, useAuthStore } from '@/stores/auth.store';

function pickRedirect(roles: string[], next: string | null) {
  const canGo =
    typeof next === 'string' &&
    next.startsWith('/') &&
    !next.startsWith('//') &&
    (() => {
      if (next.startsWith('/admin')) return roles.includes('admin');
      if (next.startsWith('/doctor')) return roles.includes('doctor');
      if (next.startsWith('/patient')) return roles.includes('patient');
      if (next.startsWith('/app')) return roles.some((r) => ['admin', 'doctor', 'patient'].includes(r));
      return true;
    })();

  if (canGo && next) return next;
  if (roles.includes('admin')) return '/admin';
  if (roles.includes('doctor')) return '/doctor';
  if (roles.includes('patient')) return '/patient';
  return '/';
}

function GoogleOauthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  const setSession = useAuthStore((s) => s.setSession);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const nextSafe = useMemo(() => (typeof nextParam === 'string' ? nextParam : null), [nextParam]);

  useEffect(() => {
    let mounted = true;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      try {
        let lastErr: unknown = null;
        // Small retry window: in dev, cookie persistence after 302 can be racy.
        for (let i = 0; i < 4; i += 1) {
          try {
            const me = await usersApi.me();
            if (!mounted) return;
            setSession({ user: me });
            syncAuthToLegacyStorage({ accessToken: null, user: me });
            router.replace(pickRedirect(me.roles ?? [], nextSafe));
            router.refresh();
            return;
          } catch (e) {
            lastErr = e;
            await sleep(200 * (i + 1));
          }
        }
        throw lastErr ?? new Error('Unauthorized');
        if (!mounted) return;
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Đăng nhập Google thất bại');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [nextSafe, router, setSession]);

  return (
    <div className="force-light flex min-h-screen items-center justify-center bg-background-light px-6 text-slate-700">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-lg font-semibold">Đang hoàn tất đăng nhập Google…</div>
        <div className="mt-2 text-sm text-slate-500">
          {loading ? 'Vui lòng đợi trong giây lát.' : error ? 'Có lỗi xảy ra.' : 'Đang chuyển hướng…'}
        </div>
        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function GoogleOauthCallbackPage() {
  return (
    <Suspense fallback={<div className="force-light flex min-h-screen items-center justify-center bg-background-light px-6 text-slate-700">Đang tải...</div>}>
      <GoogleOauthCallbackContent />
    </Suspense>
  );
}

