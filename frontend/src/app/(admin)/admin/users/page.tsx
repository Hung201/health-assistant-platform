'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import { adminApi } from '@/lib/api';

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const limit = 15;
  const qc = useQueryClient();

  const [detailId, setDetailId] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createFullName, setCreateFullName] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createRole, setCreateRole] = useState<'patient' | 'doctor' | 'admin'>('patient');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'users', page, limit],
    queryFn: () => adminApi.listUsers(page, limit),
  });

  const { data: detail } = useQuery({
    queryKey: ['admin', 'users', 'detail', detailId],
    queryFn: () => adminApi.getUser(detailId as string),
    enabled: Boolean(detailId),
    staleTime: 10_000,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      adminApi.createUser({
        email: createEmail,
        fullName: createFullName,
        password: createPassword,
        phone: createPhone.trim() || undefined,
        role: createRole,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      setOpenCreate(false);
      setCreateEmail('');
      setCreateFullName('');
      setCreatePassword('');
      setCreatePhone('');
      setCreateRole('patient');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'disabled' }) => adminApi.updateUser(id, { status }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      await qc.invalidateQueries({ queryKey: ['admin', 'users', 'detail'] });
    },
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
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary/90"
            onClick={() => setOpenCreate(true)}
            type="button"
          >
            + Tạo user
          </button>
          <Link className="text-sm font-medium text-primary hover:underline" href="/admin">
            ← Dashboard
          </Link>
        </div>
      </div>

      {isError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(error as Error).message}
        </div>
      ) : null}

      {openCreate ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Tạo người dùng</h3>
              <p className="text-sm text-slate-500">Tạo user mới và gán role.</p>
            </div>
            <button
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => setOpenCreate(false)}
              type="button"
            >
              Đóng
            </button>
          </div>

          {createMutation.isError ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {(createMutation.error as Error).message}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold" htmlFor="c-email">
                Email
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                id="c-email"
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="user@precision.vn"
                type="email"
                value={createEmail}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold" htmlFor="c-name">
                Họ tên
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                id="c-name"
                onChange={(e) => setCreateFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                value={createFullName}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold" htmlFor="c-pass">
                Mật khẩu
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                id="c-pass"
                minLength={6}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                type="password"
                value={createPassword}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold" htmlFor="c-phone">
                Số điện thoại (tuỳ chọn)
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                id="c-phone"
                onChange={(e) => setCreatePhone(e.target.value)}
                placeholder="0900 000 000"
                value={createPhone}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold" htmlFor="c-role">
                Role
              </label>
              <select
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                id="c-role"
                onChange={(e) => setCreateRole(e.target.value as 'patient' | 'doctor' | 'admin')}
                value={createRole}
              >
                <option value="patient">patient</option>
                <option value="doctor">doctor</option>
                <option value="admin">admin</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => setOpenCreate(false)}
              type="button"
            >
              Huỷ
            </button>
            <button
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={
                createMutation.isPending ||
                !createEmail.trim() ||
                !createFullName.trim() ||
                createPassword.trim().length < 6
              }
              onClick={() => createMutation.mutate()}
              type="button"
            >
              {createMutation.isPending ? 'Đang tạo…' : 'Tạo'}
            </button>
          </div>
        </div>
      ) : null}

      {detailId && detail ? (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Chi tiết người dùng</h3>
              <p className="text-sm text-slate-500">{detail.email}</p>
            </div>
            <button
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => setDetailId(null)}
              type="button"
            >
              Đóng
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Họ tên</p>
              <p className="mt-1 font-semibold text-slate-900">{detail.fullName}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Phone</p>
              <p className="mt-1 font-semibold text-slate-900">{detail.phone ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Trạng thái</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {detail.status}
                </span>
                <button
                  className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={updateStatusMutation.isPending}
                  onClick={() =>
                    updateStatusMutation.mutate({
                      id: detail.id,
                      status: detail.status === 'active' ? 'disabled' : 'active',
                    })
                  }
                  type="button"
                >
                  {detail.status === 'active' ? 'Disable' : 'Activate'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Roles</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {detail.roles.map((r) => (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary" key={r}>
                  {r}
                </span>
              ))}
            </div>
          </div>

          {detail.doctorProfile ? (
            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Doctor Profile</p>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">CCHN</p>
                  <p className="font-semibold text-slate-900">{detail.doctorProfile.licenseNumber ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Verification</p>
                  <p className="font-semibold text-slate-900">{detail.doctorProfile.verificationStatus}</p>
                </div>
              </div>
            </div>
          ) : null}

          {detail.patientProfile ? (
            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Patient Profile</p>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Liên hệ khẩn cấp</p>
                  <p className="font-semibold text-slate-900">{detail.patientProfile.emergencyContactName ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">SĐT khẩn cấp</p>
                  <p className="font-semibold text-slate-900">{detail.patientProfile.emergencyContactPhone ?? '—'}</p>
                </div>
              </div>
            </div>
          ) : null}
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
                <tr
                  className="cursor-pointer hover:bg-slate-50"
                  key={u.id}
                  onClick={() => setDetailId(u.id)}
                >
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
