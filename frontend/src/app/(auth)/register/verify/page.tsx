'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';

import { useToast } from '@/components/ui/toast';
import { authApi, usersApi } from '@/lib/api';
import { syncAuthToLegacyStorage, useAuthStore } from '@/stores/auth.store';

function VerifyPatientEmailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const setSession = useAuthStore((s) => s.setSession);
  const email = useMemo(() => (searchParams.get('email') ?? '').trim().toLowerCase(), [searchParams]);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(
    email ? 'Mã xác thực đã được gửi về email của bạn. Vui lòng kiểm tra hộp thư.' : null,
  );

  const verifyMutation = useMutation({
    mutationFn: () => authApi.verifyPatientEmail({ email, code }),
    onSuccess: async () => {
      const me = await usersApi.me();
      setSession({ user: me });
      syncAuthToLegacyStorage({ accessToken: null, user: me });
      toast.show({
        title: 'Xác thực thành công',
        message: 'Tài khoản đã được kích hoạt. Chào mừng bạn quay lại!',
        variant: 'success',
      });
      window.setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 400);
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => authApi.resendPatientCode(email),
    onSuccess: () => {
      setMessage('Đã gửi lại mã xác thực. Vui lòng kiểm tra email của bạn.');
    },
  });

  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eefaf8] p-4">
        <div className="w-full max-w-md rounded-2xl border border-teal-100 bg-white p-6 text-center shadow-lg">
          <h1 className="text-xl font-bold text-slate-800">Thiếu email xác thực</h1>
          <p className="mt-2 text-sm text-slate-600">Vui lòng quay lại trang đăng ký để bắt đầu lại quy trình.</p>
          <Link
            href="/register"
            className="mt-4 inline-flex rounded-xl bg-[#71d4c8] px-4 py-2 text-sm font-bold text-white hover:bg-[#5bc2b6]"
          >
            Quay lại đăng ký
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eefaf8] p-4">
      <div className="w-full max-w-md rounded-2xl border border-teal-100 bg-white p-6 shadow-lg">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Xác thực email bệnh nhân</h1>
        <p className="mt-2 text-sm text-slate-600">
          Chúng tôi đã gửi mã 6 số đến <b>{email}</b>. Nhập mã để kích hoạt tài khoản.
        </p>

        {message ? <p className="mt-3 rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-700">{message}</p> : null}

        <div className="mt-4 space-y-3">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Nhập mã xác thực 6 số"
            className="w-full rounded-xl border border-teal-200 bg-white px-4 py-3 text-slate-900 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              className="rounded-xl bg-[#71d4c8] px-4 py-3 text-sm font-bold text-white transition-all hover:bg-[#5bc2b6] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={verifyMutation.isPending || code.length !== 6}
              onClick={() => verifyMutation.mutate()}
            >
              {verifyMutation.isPending ? 'Đang xác thực...' : 'Xác thực'}
            </button>
            <button
              type="button"
              className="rounded-xl border border-teal-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={resendMutation.isPending}
              onClick={() => resendMutation.mutate()}
            >
              {resendMutation.isPending ? 'Đang gửi...' : 'Gửi lại mã'}
            </button>
          </div>
        </div>

        {verifyMutation.error instanceof Error ? <p className="mt-2 text-xs text-red-600">{verifyMutation.error.message}</p> : null}

        <div className="mt-4 text-center">
          <Link href="/register" className="text-xs font-semibold text-slate-500 hover:text-slate-700 hover:underline">
            ← Quay lại trang đăng ký
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPatientEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#eefaf8] p-4">
          <div className="w-full max-w-md rounded-2xl border border-teal-100 bg-white p-6 text-center shadow-lg">
            <p className="text-sm font-semibold text-slate-600">Đang tải thông tin xác thực...</p>
          </div>
        </div>
      }
    >
      <VerifyPatientEmailPageContent />
    </Suspense>
  );
}
