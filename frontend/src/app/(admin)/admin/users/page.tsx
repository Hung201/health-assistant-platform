'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import { adminApi } from '@/lib/api';

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'users', page, limit],
    queryFn: () => adminApi.listUsers(page, limit),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Người dùng</h2>
          <p className="text-sm text-slate-500">
            <code className="rounded bg-slate-100 px-1 text-xs">GET /admin/users?page=&limit=</code>
          </p>
        </div>
        <Link className="text-sm font-medium text-primary hover:underline" href="/admin">
          ← Dashboard
        </Link>
      </div>

      {isError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(error as Error).message}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Họ tên</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Tạo lúc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                    Đang tải…
                  </td>
                </tr>
              ) : null}
              {data?.items.map((u) => (
                <tr className="hover:bg-slate-50" key={u.id}>
                  <td className="px-4 py-3 font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-3">{u.fullName}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <span
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                          key={r}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">{u.status}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(u.createdAt).toLocaleString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
            <span className="text-slate-500">
              Trang {data.page} / {totalPages} — {data.total} tài khoản
            </span>
            <div className="flex gap-2">
              <button
                className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                type="button"
              >
                Trước
              </button>
              <button
                className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                type="button"
              >
                Sau
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
