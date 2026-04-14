'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import { adminApi } from '@/lib/api';

export default function AdminPendingPostsPage() {
  const qc = useQueryClient();
  const [msg, setMsg] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'posts', 'pending', page, limit],
    queryFn: () => adminApi.listPendingPosts(page, limit),
  });

  const { data: selected, isLoading: isLoadingSelected } = useQuery({
    queryKey: ['admin', 'posts', 'detail', selectedId],
    queryFn: () => adminApi.getPost(selectedId as number),
    enabled: selectedId != null,
  });

  const approve = useMutation({
    mutationFn: (id: number) => adminApi.approvePost(id),
    onSuccess: () => {
      setMsg('Đã xuất bản bài viết.');
      qc.invalidateQueries({ queryKey: ['admin', 'posts', 'pending'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard', 'summary'] });
      if (selectedId != null) qc.invalidateQueries({ queryKey: ['admin', 'posts', 'detail', selectedId] });
    },
    onError: (e: Error) => setMsg(e.message),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason: r }: { id: number; reason?: string }) => adminApi.rejectPost(id, r),
    onSuccess: () => {
      setMsg('Đã từ chối bài viết.');
      setRejectId(null);
      setReason('');
      qc.invalidateQueries({ queryKey: ['admin', 'posts', 'pending'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard', 'summary'] });
      if (selectedId != null) qc.invalidateQueries({ queryKey: ['admin', 'posts', 'detail', selectedId] });
    },
    onError: (e: Error) => setMsg(e.message),
  });

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Bài viết chờ duyệt</h2>
          <p className="text-sm text-slate-500">
            Trạng thái <code className="rounded bg-slate-100 px-1 text-xs">pending_review</code> —{' '}
            <code className="rounded bg-slate-100 px-1 text-xs">GET /admin/posts/pending</code>
          </p>
        </div>
        <Link className="text-sm font-medium text-primary hover:underline" href="/admin">
          ← Dashboard
        </Link>
      </div>

      {msg ? (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
          {msg}
        </div>
      ) : null}

      {isError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(error as Error).message}
        </div>
      ) : null}

      {selectedId != null ? (
        <div className="sticky top-4 z-10 mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Chi tiết bài viết</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">
                {isLoadingSelected ? 'Đang tải…' : selected?.title ?? '—'}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {selected?.authorName ?? '—'} • {selected?.authorEmail ?? '—'} •{' '}
                {selected?.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'}
              </p>
            </div>
            <button
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
              onClick={() => setSelectedId(null)}
              type="button"
            >
              Đóng
            </button>
          </div>

          {selected?.excerpt ? <p className="mb-4 text-sm text-slate-700">{selected.excerpt}</p> : null}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                  {selected?.content ?? (isLoadingSelected ? 'Đang tải…' : '')}
                </pre>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Thông tin</p>
                <div className="mt-2 space-y-2 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold">Trạng thái:</span> {selected?.status ?? '—'}
                  </p>
                  <p>
                    <span className="font-semibold">Loại:</span> {selected?.postType ?? '—'}
                  </p>
                  <p className="break-all text-xs text-slate-500">
                    <span className="font-semibold text-slate-600">Slug:</span> {selected?.slug ?? '—'}
                  </p>
                  {selected?.thumbnailUrl ? (
                    <a className="text-primary hover:underline" href={selected.thumbnailUrl} target="_blank" rel="noreferrer">
                      Xem thumbnail
                    </a>
                  ) : null}
                  {selected?.rejectionReason ? (
                    <p className="text-red-700">
                      <span className="font-semibold">Lý do từ chối:</span> {selected.rejectionReason}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-3 flex items-center justify-between text-sm text-slate-600">
        <p>
          Tổng: <span className="font-semibold text-slate-900">{total}</span> • Trang{' '}
          <span className="font-semibold text-slate-900">{page}</span>/{totalPages}
        </p>
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            type="button"
          >
            ← Trước
          </button>
          <button
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            type="button"
          >
            Sau →
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase text-slate-500">
              <th className="px-4 py-3">Tiêu đề</th>
              <th className="px-4 py-3">Tác giả</th>
              <th className="px-4 py-3">Loại</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={4}>
                  Đang tải…
                </td>
              </tr>
            ) : null}
            {rows.length === 0 && !isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={4}>
                  Chưa có bài ở trạng thái chờ duyệt. (Bác sĩ cần gửi bài với status pending_review.)
                </td>
              </tr>
            ) : null}
            {rows.map((p) => {
              const idNum = Number(p.id);
              return (
                <tr
                  className={selectedId === idNum ? 'bg-primary/5' : 'hover:bg-slate-50'}
                  key={p.id}
                  onClick={() => setSelectedId(idNum)}
                  role="button"
                  tabIndex={0}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-slate-400">{p.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{p.authorName ?? '—'}</p>
                    <p className="text-xs text-slate-500">{p.authorEmail}</p>
                  </td>
                  <td className="px-4 py-3">{p.postType}</td>
                  <td className="px-4 py-3 text-right">
                    {rejectId === idNum ? (
                      <div className="flex flex-col items-end gap-2">
                        <input
                          className="w-full max-w-xs rounded border border-slate-200 px-2 py-1 text-xs"
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Lý do từ chối (tuỳ chọn)"
                          value={reason}
                        />
                        <div className="flex gap-2">
                          <button
                            className="rounded bg-red-600 px-2 py-1 text-xs text-white"
                            onClick={() => reject.mutate({ id: idNum, reason })}
                            type="button"
                          >
                            Xác nhận từ chối
                          </button>
                          <button
                            className="text-xs text-slate-600"
                            onClick={() => {
                              setRejectId(null);
                              setReason('');
                            }}
                            type="button"
                          >
                            Huỷ
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-50"
                          disabled={approve.isPending || reject.isPending}
                          onClick={(e) => {
                            e.stopPropagation();
                            approve.mutate(idNum);
                          }}
                          type="button"
                        >
                          Duyệt
                        </button>
                        <button
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          disabled={approve.isPending || reject.isPending}
                          onClick={(e) => {
                            e.stopPropagation();
                            setRejectId(idNum);
                          }}
                          type="button"
                        >
                          Từ chối
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
