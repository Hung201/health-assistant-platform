'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import { adminApi } from '@/lib/api';

export default function AdminPendingQuestionsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const limit = 10;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'questions', 'pending', page, limit],
    queryFn: () => adminApi.listPendingQuestions(page, limit),
  });

  const approve = useMutation({
    mutationFn: (id: string) => adminApi.approveQuestion(id),
    onSuccess: () => {
      setMsg('Đã duyệt câu hỏi. Câu hỏi sẽ hiển thị ở trang công khai.');
      qc.invalidateQueries({ queryKey: ['admin', 'questions', 'pending'] });
      qc.invalidateQueries({ queryKey: ['qa', 'public'] });
    },
    onError: (e: Error) => setMsg(e.message),
  });

  const reject = useMutation({
    mutationFn: (payload: { id: string; reason?: string }) => adminApi.rejectQuestion(payload.id, payload.reason),
    onSuccess: () => {
      setMsg('Đã từ chối câu hỏi.');
      setRejectId(null);
      setReason('');
      qc.invalidateQueries({ queryKey: ['admin', 'questions', 'pending'] });
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
          <h2 className="text-2xl font-bold text-foreground">Câu hỏi chờ admin duyệt</h2>
          <p className="text-sm text-muted-foreground">
            Trạng thái <code className="rounded bg-muted px-1 text-xs">pending_review</code> sẽ không hiển thị ngoài trang chủ.
          </p>
        </div>
        <Link className="text-sm font-medium text-primary hover:underline" href="/admin">
          ← Dashboard
        </Link>
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
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-muted-foreground" colSpan={4}>
                  Đang tải…
                </td>
              </tr>
            ) : null}
            {rows.length === 0 && !isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-muted-foreground" colSpan={4}>
                  Hiện chưa có câu hỏi nào chờ duyệt.
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
                <td className="px-4 py-3 text-right">
                  {rejectId === q.id ? (
                    <div className="flex flex-col items-end gap-2">
                      <input
                        className="w-full max-w-xs rounded border border-border bg-card px-2 py-1 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Lý do từ chối (tuỳ chọn)"
                        value={reason}
                      />
                      <div className="flex gap-2">
                        <button
                          className="rounded bg-destructive px-2 py-1 text-xs text-primary-foreground"
                          onClick={() => reject.mutate({ id: q.id, reason })}
                          type="button"
                        >
                          Xác nhận từ chối
                        </button>
                        <button
                          className="text-xs text-muted-foreground hover:text-foreground"
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
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        disabled={approve.isPending || reject.isPending}
                        onClick={() => approve.mutate(q.id)}
                        type="button"
                      >
                        Duyệt
                      </button>
                      <button
                        className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-50"
                        disabled={approve.isPending || reject.isPending}
                        onClick={() => setRejectId(q.id)}
                        type="button"
                      >
                        Từ chối
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
