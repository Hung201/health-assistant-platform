'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { adminApi } from '@/lib/api';

export default function AdminSpecialtiesPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'specialties'],
    queryFn: adminApi.listSpecialties,
  });

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Chuyên khoa</h2>
          <p className="text-sm text-slate-500">
            Chỉ đọc — <code className="rounded bg-slate-100 px-1 text-xs">GET /admin/specialties</code> (bảng{' '}
            <code className="text-xs">specialties</code>). Thêm/sửa có thể làm API riêng sau.
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
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase text-slate-500">
              <th className="px-4 py-3">Tên</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={3}>
                  Đang tải…
                </td>
              </tr>
            ) : null}
            {data?.length === 0 && !isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={3}>
                  Chưa có chuyên khoa trong DB. Thêm dữ liệu vào bảng <code className="text-xs">specialties</code>.
                </td>
              </tr>
            ) : null}
            {data?.map((s) => (
              <tr className="hover:bg-slate-50" key={s.id}>
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.slug}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{s.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
