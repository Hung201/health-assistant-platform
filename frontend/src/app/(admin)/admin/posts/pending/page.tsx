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

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'posts', 'pending'],
    queryFn: adminApi.listPendingPosts,
  });

  const approve = useMutation({
    mutationFn: (id: number) => adminApi.approvePost(id),
    onSuccess: () => {
      setMsg('Đã xuất bản bài viết.');
      qc.invalidateQueries({ queryKey: ['admin', 'posts', 'pending'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard', 'summary'] });
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
    },
    onError: (e: Error) => setMsg(e.message),
  });

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
            {data?.length === 0 && !isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={4}>
                  Chưa có bài ở trạng thái chờ duyệt. (Bác sĩ cần gửi bài với status pending_review.)
                </td>
              </tr>
            ) : null}
            {data?.map((p) => {
              const idNum = Number(p.id);
              return (
                <tr className="hover:bg-slate-50" key={p.id}>
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
                          onClick={() => approve.mutate(idNum)}
                          type="button"
                        >
                          Duyệt
                        </button>
                        <button
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          disabled={approve.isPending || reject.isPending}
                          onClick={() => setRejectId(idNum)}
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
