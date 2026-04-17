'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { authApi, usersApi } from '@/lib/api';
import { syncAuthToLegacyStorage, useAuthStore } from '@/stores/auth.store';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const pickRedirect = (roles: string[], next: string | null) => {
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
  };

  const loginMutation = useMutation({
    mutationFn: ({ email: e, password: p }: { email: string; password: string }) =>
      authApi.login(e, p),
    onSuccess: async () => {
      const me = await usersApi.me();
      setSession({ user: me });
      syncAuthToLegacyStorage({ accessToken: null, user: me });
      const dest = pickRedirect(me.roles ?? [], nextParam);
      router.push(dest);
      router.refresh();
    },
  });

  const errorMessage =
    loginMutation.error instanceof Error
      ? loginMutation.error.message
      : loginMutation.isError
        ? 'Đăng nhập thất bại'
        : null;

  return (
    <div className="auth-page">
      {/* ── decorative blobs ── */}
      <div className="auth-blob auth-blob--1" />
      <div className="auth-blob auth-blob--2" />

      <div className="auth-card auth-card--login">
        {/* brand */}
        <Link className="auth-brand" href="/">
          <span className="auth-brand-icon material-symbols-outlined">clinical_notes</span>
          <span className="auth-brand-name">Clinical Precision</span>
        </Link>

        <div className="auth-header">
          <h1 className="auth-title">Chào mừng trở lại</h1>
          <p className="auth-subtitle">Đăng nhập để tiếp tục quản lý sức khỏe của bạn</p>
        </div>

        {errorMessage && (
          <div className="auth-error" role="alert">{errorMessage}</div>
        )}

        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            loginMutation.mutate({ email, password });
          }}
        >
          <div className="auth-field">
            <label className="auth-label" htmlFor="email">Email</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon material-symbols-outlined">mail</span>
              <input
                autoComplete="email"
                className="auth-input"
                id="email"
                name="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">Mật khẩu</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon material-symbols-outlined">lock</span>
              <input
                autoComplete="current-password"
                className="auth-input"
                id="password"
                name="password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
              />
              <button
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="auth-input-toggle"
                onClick={() => setShowPassword((v) => !v)}
                type="button"
              >
                <span className="material-symbols-outlined">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div className="auth-row-between">
            <label className="auth-check">
              <input type="checkbox" name="remember" />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <Link className="auth-link-accent" href="#">Quên mật khẩu?</Link>
          </div>

          <button
            className="auth-submit"
            disabled={loginMutation.isPending}
            type="submit"
          >
            {loginMutation.isPending ? (
              <>
                <span className="auth-spinner" />
                Đang đăng nhập…
              </>
            ) : (
              'Đăng nhập'
            )}
          </button>
        </form>

        <p className="auth-switch">
          Chưa có tài khoản?{' '}
          <Link className="auth-link-accent" href="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}
