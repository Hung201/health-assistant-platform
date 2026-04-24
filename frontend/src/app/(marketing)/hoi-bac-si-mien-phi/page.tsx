'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, CalendarClock, MessageCircleQuestion, Send } from 'lucide-react';

import { authApi, qaApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export default function FreeAskDoctorPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [page, setPage] = useState(1);
  const [openAsk, setOpenAsk] = useState(false);
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', category: '' });

  const appHref = user?.roles?.includes('admin')
    ? '/admin'
    : user?.roles?.includes('doctor')
      ? '/doctor'
      : user
        ? '/patient'
        : '/login';
  const aiHref = user ? '/patient/ai-assistant' : '/ai';

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      logout();
      router.refresh();
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['qa', 'public', page],
    queryFn: () => qaApi.listPublic(page, 10),
  });

  const askMutation = useMutation({
    mutationFn: () => qaApi.ask({ title: form.title, content: form.content, category: form.category || undefined }),
    onSuccess: async () => {
      setOpenAsk(false);
      setForm({ title: '', content: '', category: '' });
      setSubmitNotice('Đã gửi câu hỏi. Admin sẽ duyệt trước khi hiển thị công khai.');
      await qc.invalidateQueries({ queryKey: ['qa', 'public'] });
    },
  });

  const totalPages = useMemo(() => {
    const total = data?.total ?? 0;
    const limit = data?.limit ?? 10;
    return Math.max(1, Math.ceil(total / limit));
  }, [data]);

  return (
    <div className="min-h-screen bg-[#fafafb] text-slate-900 font-sans">
      <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-2" href="/">
            <div className="rounded-lg bg-teal-500 p-1.5 text-white">
              <Activity size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Clinical Precision</h1>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link className="text-sm font-semibold text-slate-600 transition-colors hover:text-teal-600" href={aiHref}>
              AI
            </Link>
            <Link className="text-sm font-semibold text-slate-600 transition-colors hover:text-teal-600" href="/doctors">
              Bác sĩ
            </Link>
            <Link className="text-sm font-semibold text-teal-600 transition-colors hover:text-teal-700" href="/hoi-bac-si-mien-phi">
              Hỏi bác sĩ miễn phí
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link className="rounded-full px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100" href={appHref}>
                  Vào ứng dụng
                </Link>
                <button
                  className="rounded-full bg-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-teal-700 disabled:opacity-60"
                  disabled={logoutMutation.isPending}
                  onClick={() => logoutMutation.mutate()}
                  type="button"
                >
                  {logoutMutation.isPending ? 'Đang đăng xuất…' : 'Đăng xuất'}
                </button>
              </>
            ) : (
              <>
                <Link className="rounded-full px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100" href="/login">
                  Đăng nhập
                </Link>
                <Link className="rounded-full bg-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-teal-700" href="/register">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-[#003f87]">Hỏi bác sĩ miễn phí</h2>
            <p className="mt-2 max-w-3xl text-slate-600">
              Chuyên mục chia sẻ kiến thức và giải đáp thắc mắc sức khỏe từ bác sĩ của nền tảng. Câu trả lời giúp tham khảo,
              không thay thế khám trực tiếp.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!user) {
                router.push('/login?next=/hoi-bac-si-mien-phi');
                return;
              }
              if (!user.roles.includes('patient')) {
                alert('Tính năng gửi câu hỏi hiện dành cho tài khoản bệnh nhân.');
                return;
              }
              setOpenAsk(true);
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#003f87] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-[#003f87]/20 transition-all hover:bg-[#002b5e]"
          >
            <MessageCircleQuestion size={18} />
            Đặt câu hỏi
          </button>
        </div>
        {submitNotice ? (
          <div className="mb-5 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-700">
            {submitNotice}
          </div>
        ) : null}

        <div className="space-y-4">
          {isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">Đang tải câu hỏi…</div>
          ) : data?.items.length ? (
            data.items.map((q) => (
              <Link
                key={q.id}
                href={`/hoi-bac-si-mien-phi/${q.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-teal-300 hover:shadow-md"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${q.status === 'answered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                  >
                    {q.status === 'answered' ? 'Đã trả lời' : 'Đã duyệt, chờ bác sĩ'}
                  </span>
                  {q.category ? <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{q.category}</span> : null}
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">{q.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{q.content}</p>
                <div className="mt-3 flex items-center gap-5 text-xs font-semibold text-slate-500">
                  <span>Bởi: {q.patient.fullName}</span>
                  <span className="inline-flex items-center gap-1"><CalendarClock size={14} />{new Date(q.createdAt).toLocaleDateString('vi-VN')}</span>
                  {q.doctor ? <span>Bác sĩ trả lời: {q.doctor.fullName}</span> : null}
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi.
            </div>
          )}
        </div>

        {totalPages > 1 ? (
          <div className="mt-8 flex justify-center gap-2">
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trang trước
            </button>
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Trang sau
            </button>
          </div>
        ) : null}
      </main>

      {openAsk ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 backdrop-blur-[2px]">
          <div className="mx-auto mt-12 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-2xl font-extrabold text-[#003f87]">Gửi câu hỏi cho bác sĩ</h3>
            <p className="mt-1 text-sm text-slate-500">Càng chi tiết thì bác sĩ càng dễ trả lời đúng trọng tâm.</p>
            <div className="mt-5 space-y-4">
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                placeholder="Tiêu đề câu hỏi"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#003f87] focus:ring-2 focus:ring-[#003f87]/20"
              />
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
                placeholder="Chuyên mục (tuỳ chọn), ví dụ: Tiêu hoá"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#003f87] focus:ring-2 focus:ring-[#003f87]/20"
              />
              <textarea
                value={form.content}
                onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))}
                rows={6}
                placeholder="Mô tả triệu chứng, thời gian xuất hiện, tiền sử liên quan..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#003f87] focus:ring-2 focus:ring-[#003f87]/20"
              />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpenAsk(false)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Huỷ
              </button>
              <button
                type="button"
                disabled={askMutation.isPending || !form.title.trim() || !form.content.trim()}
                onClick={() => askMutation.mutate()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#003f87] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                <Send size={16} />
                {askMutation.isPending ? 'Đang gửi…' : 'Gửi câu hỏi'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
