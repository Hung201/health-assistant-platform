'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { adminApi } from '@/lib/api';

type Tab = 'approved' | 'answered' | 'hidden';

function statusLabel(status: string) {
  if (status === 'approved') return 'Đã duyệt';
  if (status === 'answered') return 'Đã trả lời';
  if (status === 'hidden') return 'Đã ẩn';
  return status;
}

export default function AdminQuestionsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('answered');
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [answerContent, setAnswerContent] = useState('');
  const limit = 10;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'questions', 'managed', tab, page, limit],
    queryFn: () => adminApi.listQuestions(page, limit, tab),
  });

  const { data: detail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['admin', 'questions', 'detail', editingId],
    queryFn: () => adminApi.getQuestion(editingId as string),
    enabled: editingId != null && open,
  });

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const current = useMemo(() => rows.find((x) => x.id === editingId) ?? null, [editingId, rows]);

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ['admin', 'questions'] });
    await qc.invalidateQueries({ queryKey: ['qa', 'public'] });
  };

  const hideMutation = useMutation({
    mutationFn: (id: string) => adminApi.hideQuestion(id),
    onSuccess: async () => {
      setMsg('Đã ẩn câu hỏi khỏi trang hỏi đáp.');
      await invalidate();
    },
    onError: (e: Error) => setMsg(e.message),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => adminApi.publishQuestion(id),
    onSuccess: async () => {
      setMsg('Đã hiện lại câu hỏi trên trang hỏi đáp.');
      await invalidate();
    },
    onError: (e: Error) => setMsg(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      adminApi.updateQuestion(editingId as string, {
        title: title.trim(),
        content: content.trim(),
        category: category.trim() || undefined,
        answerContent: answerContent.trim() || undefined,
      }),
    onSuccess: async () => {
      setMsg('Đã cập nhật câu hỏi.');
      setOpen(false);
      setEditingId(null);
      await invalidate();
    },
    onError: (e: Error) => setMsg(e.message),
  });

  useEffect(() => {
    if (!open || !detail) return;
    setTitle(detail.title);
    setContent(detail.content);
    setCategory(detail.category ?? '');
    setAnswerContent(detail.answerContent ?? '');
  }, [open, detail]);

  function openEdit(id: string) {
    setEditingId(id);
    setOpen(true);
  }

  function closeEdit() {
    setOpen(false);
    setEditingId(null);
  }

  const saveDisabled = !title.trim() || !content.trim() || updateMutation.isPending;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Quản lý hỏi đáp</h2>
          <p className="text-sm text-muted-foreground">
            Sửa hoặc ẩn/hiện các câu hỏi đã duyệt trên trang công khai.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link className="text-sm font-medium text-primary hover:underline" href="/admin/questions/pending">
            Duyệt câu hỏi chờ →
          </Link>
          <Link className="text-sm font-medium text-muted-foreground hover:underline" href="/admin">
            ← Dashboard
          </Link>
        </div>
      </div>

      {msg ? (
        <div className="mb-4 rounded-lg border border-border bg-muted px-4 py-2 text-sm text-foreground">
          {msg}
        </div>
      ) : null}

      {isError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(error as Error).message}
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            { key: 'answered', label: 'Đã trả lời' },
            { key: 'approved', label: 'Chờ trả lời' },
            { key: 'hidden', label: 'Đã ẩn' },
          ] as const
        ).map((t) => (
          <button
            className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
              tab === t.key
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-card text-foreground hover:bg-muted'
            }`}
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setPage(1);
            }}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Tổng: <span className="font-semibold text-foreground">{total}</span> • Trang{' '}
          <span className="font-semibold text-foreground">{page}</span>/{totalPages}
        </p>
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-50"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            type="button"
          >
            ← Trước
          </button>
          <button
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-50"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            type="button"
          >
            Sau →
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted text-xs font-bold uppercase text-muted-foreground">
              <th className="px-4 py-3">Tiêu đề</th>
              <th className="px-4 py-3">Người hỏi</th>
              <th className="px-4 py-3">Chuyên mục</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>
                  Đang tải…
                </td>
              </tr>
            ) : null}
            {rows.length === 0 && !isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>
                  Không có câu hỏi nào trong mục này.
                </td>
              </tr>
            ) : null}
            {rows.map((q) => (
              <tr className="hover:bg-muted" key={q.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{q.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{q.content}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{q.patient.fullName}</p>
                  <p className="text-xs text-muted-foreground">{q.patient.email ?? '—'}</p>
                </td>
                <td className="px-4 py-3">{q.category || '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      q.status === 'hidden'
                        ? 'bg-amber-100 text-amber-800'
                        : q.status === 'answered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {statusLabel(q.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-50"
                      disabled={hideMutation.isPending || publishMutation.isPending}
                      onClick={() => openEdit(q.id)}
                      type="button"
                    >
                      Sửa
                    </button>
                    {q.status !== 'hidden' ? (
                      <button
                        className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                        disabled={hideMutation.isPending || publishMutation.isPending}
                        onClick={() => hideMutation.mutate(q.id)}
                        type="button"
                      >
                        Ẩn
                      </button>
                    ) : (
                      <button
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        disabled={hideMutation.isPending || publishMutation.isPending}
                        onClick={() => publishMutation.mutate(q.id)}
                        type="button"
                      >
                        Hiện lại
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Sửa câu hỏi</h3>
                <p className="text-sm text-muted-foreground">{current?.patient.fullName}</p>
              </div>
              <button className="text-sm text-muted-foreground hover:text-foreground" onClick={closeEdit} type="button">
                Đóng
              </button>
            </div>

            {isLoadingDetail ? (
              <p className="text-sm text-muted-foreground">Đang tải…</p>
            ) : (
              <div className="space-y-4">
                <label className="block">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Tiêu đề</span>
                  <input
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                    onChange={(e) => setTitle(e.target.value)}
                    value={title}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Chuyên mục</span>
                  <input
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                    onChange={(e) => setCategory(e.target.value)}
                    value={category}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Nội dung câu hỏi</span>
                  <textarea
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                    onChange={(e) => setContent(e.target.value)}
                    rows={5}
                    value={content}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Câu trả lời (nếu có)</span>
                  <textarea
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                    onChange={(e) => setAnswerContent(e.target.value)}
                    rows={6}
                    value={answerContent}
                  />
                </label>
                <div className="flex justify-end gap-2">
                  <button
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                    onClick={closeEdit}
                    type="button"
                  >
                    Huỷ
                  </button>
                  <button
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    disabled={saveDisabled}
                    onClick={() => updateMutation.mutate()}
                    type="button"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
