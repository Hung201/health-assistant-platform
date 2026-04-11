'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import { adminApi } from '@/lib/api';

export default function AdminPendingDoctorsPage() {
  const qc = useQueryClient();
  const [msg, setMsg] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'doctors', 'pending'],
    queryFn: adminApi.listPendingDoctors,
  });

  const approve = useMutation({
    mutationFn: (userId: string) => adminApi.approveDoctor(userId),
    onSuccess: () => {
      setMsg('Đã duyệt bác sĩ.');
      qc.invalidateQueries({ queryKey: ['admin', 'doctors', 'pending'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard', 'summary'] });
    },
    onError: (e: Error) => setMsg(e.message),
  });

  const reject = useMutation({
    mutationFn: (userId: string) => adminApi.rejectDoctor(userId),
    onSuccess: () => {
      setMsg('Đã từ chối hồ sơ.');
      qc.invalidateQueries({ queryKey: ['admin', 'doctors', 'pending'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard', 'summary'] });
    },
    onError: (e: Error) => setMsg(e.message),
  });

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Bác sĩ chờ duyệt</h2>
          <p className="text-sm text-slate-500">
            <code className="rounded bg-slate-100 px-1 text-xs">GET /admin/doctors/pending</code> —{' '}
            <code className="rounded bg-slate-100 px-1 text-xs">PATCH …/approve|reject</code>
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
              <th className="px-4 py-3">Bác sĩ</th>
              <th className="px-4 py-3">Chức danh</th>
              <th className="px-4 py-3">Số CCHN</th>
              <th className="px-4 py-3">Cơ sở</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
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
            {data?.length === 0 && !isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                  Không có bác sĩ chờ duyệt.
                </td>
              </tr>
            ) : null}
            {data?.map((d) => (
              <tr className="hover:bg-slate-50" key={d.userId}>
                <td className="px-4 py-3">
                  <p className="font-medium">{d.fullName ?? '—'}</p>
                  <p className="text-xs text-slate-500">{d.email}</p>
                </td>
                <td className="px-4 py-3">{d.professionalTitle ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs">{d.licenseNumber ?? '—'}</td>
                <td className="px-4 py-3">{d.workplaceName ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                      disabled={approve.isPending || reject.isPending}
                      onClick={() => approve.mutate(d.userId)}
                      type="button"
                    >
                      Duyệt
                    </button>
                    <button
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      disabled={approve.isPending || reject.isPending}
                      onClick={() => reject.mutate(d.userId)}
                      type="button"
                    >
                      Từ chối
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
