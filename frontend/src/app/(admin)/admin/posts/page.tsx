'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { adminApi } from '@/lib/api';

const POST_TYPES = [
  { value: 'medical_article', label: 'Y khoa' },
  { value: 'health_tip', label: 'Mẹo sức khỏe' },
  { value: 'news', label: 'Tin tức' },
  { value: 'faq', label: 'FAQ' },
  { value: 'announcement', label: 'Thông báo' },
  { value: 'case_study', label: 'Ca bệnh' },
] as const;

function statusLabel(status: string) {
  if (status === 'published') return 'Đang hiển thị';
  if (status === 'hidden') return 'Đã ẩn';
  return status;
}

export default function AdminPostsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'published' | 'hidden'>('published');
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [postType, setPostType] = useState('medical_article');
  const limit = 10;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'posts', tab, page, limit],
    queryFn: () => adminApi.listPosts(page, limit, tab),
  });

  const { data: detail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['admin', 'posts', 'detail', editingId],
    queryFn: () => adminApi.getPost(editingId as number),
    enabled: editingId != null && open,
  });

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const current = useMemo(() => rows.find((x) => Number(x.id) === editingId) ?? null, [editingId, rows]);

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ['admin', 'posts'] });
    await qc.invalidateQueries({ queryKey: ['public', 'posts'] });
  };

  const hideMutation = useMutation({
    mutationFn: (id: number) => adminApi.hidePost(id),
    onSuccess: async () => {
      setMsg('Đã ẩn bài viết khỏi trang blog.');
      await invalidate();
    },
    onError: (e: Error) => setMsg(e.message),
  });

  const publishMutation = useMutation({
    mutationFn: (id: number) => adminApi.publishPost(id),
    onSuccess: async () => {
      setMsg('Đã hiện lại bài viết trên trang blog.');
      await invalidate();
    },
    onError: (e: Error) => setMsg(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      adminApi.updatePost(editingId as number, {
        title: title.trim(),
        excerpt: excerpt.trim() || undefined,
        content: content.trim(),
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        postType,
      }),
    onSuccess: async () => {
      setMsg('Đã cập nhật bài viết.');
      setOpen(false);
      setEditingId(null);
      await invalidate();
    },
    onError: (e: Error) => setMsg(e.message),
  });

  function openEdit(id: number) {
    setEditingId(id);
    setOpen(true);
  }

  function closeEdit() {
    setOpen(false);
    setEditingId(null);
  }

  useEffect(() => {
    if (!open || !detail) return;
    setTitle(detail.title);
    setExcerpt(detail.excerpt ?? '');
    setContent(detail.content);
    setThumbnailUrl(detail.thumbnailUrl ?? '');
    setPostType(detail.postType);
  }, [open, detail]);

  const saveDisabled = !title.trim() || !content.trim() || updateMutation.isPending;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Quản lý bài viết blog</h2>
          <p className="text-sm text-muted-foreground">
            Sửa hoặc ẩn/hiện các bài viết đã xuất bản trên{' '}
            <Link className="text-primary hover:underline" href="/blog">
              trang blog
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link className="text-sm font-medium text-primary hover:underline" href="/admin/posts/pending">
            Duyệt bài chờ →
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

      <div className="mb-4 flex gap-2">
        <button
          className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
            tab === 'published'
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-card text-foreground hover:bg-muted'
          }`}
          onClick={() => {
            setTab('published');
            setPage(1);
          }}
          type="button"
        >
          Đang hiển thị
        </button>
        <button
          className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
            tab === 'hidden'
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-card text-foreground hover:bg-muted'
          }`}
          onClick={() => {
            setTab('hidden');
            setPage(1);
          }}
          type="button"
        >
          Đã ẩn
        </button>
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
              <th className="px-4 py-3">Tác giả</th>
              <th className="px-4 py-3">Loại</th>
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
                  {tab === 'published' ? 'Chưa có bài viết nào đang hiển thị.' : 'Chưa có bài viết nào bị ẩn.'}
                </td>
              </tr>
            ) : null}
            {rows.map((p) => {
              const idNum = Number(p.id);
              return (
                <tr className="hover:bg-muted" key={p.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{p.authorName ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{p.authorEmail}</p>
                  </td>
                  <td className="px-4 py-3">{p.postType}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        p.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {statusLabel(p.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-50"
                        disabled={hideMutation.isPending || publishMutation.isPending}
                        onClick={() => {
                          setTitle('');
                          openEdit(idNum);
                        }}
                        type="button"
                      >
                        Sửa
                      </button>
                      {p.status === 'published' ? (
                        <button
                          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                          disabled={hideMutation.isPending || publishMutation.isPending}
                          onClick={() => hideMutation.mutate(idNum)}
                          type="button"
                        >
                          Ẩn
                        </button>
                      ) : (
                        <button
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                          disabled={hideMutation.isPending || publishMutation.isPending}
                          onClick={() => publishMutation.mutate(idNum)}
                          type="button"
                        >
                          Hiện lại
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Sửa bài viết</h3>
                <p className="text-sm text-muted-foreground">{current?.slug}</p>
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
                  <span className="text-xs font-bold uppercase text-muted-foreground">Loại bài</span>
                  <select
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    onChange={(e) => setPostType(e.target.value)}
                    value={postType}
                  >
                    {POST_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Tóm tắt</span>
                  <textarea
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                    onChange={(e) => setExcerpt(e.target.value)}
                    rows={2}
                    value={excerpt}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Ảnh bìa (URL)</span>
                  <input
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://..."
                    value={thumbnailUrl}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold uppercase text-muted-foreground">Nội dung</span>
                  <textarea
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                    onChange={(e) => setContent(e.target.value)}
                    rows={12}
                    value={content}
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
