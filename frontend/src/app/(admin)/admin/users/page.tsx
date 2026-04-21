'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { adminApi } from '@/lib/api';

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'patient' | 'doctor' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [dense, setDense] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showCreatedAt, setShowCreatedAt] = useState(true);

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

  useEffect(() => {
    setPage(1);
  }, [limit]);

  function roleBadgeClass(role: string) {
    if (role === 'admin') return 'bg-amber-500/20 text-amber-700 dark:text-amber-300';
    if (role === 'doctor') return 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300';
    if (role === 'patient') return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
    return 'bg-muted text-foreground';
  }

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.items ?? []).filter((u) => {
      if (roleFilter !== 'all' && !u.roles.includes(roleFilter)) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      if (!q) return true;
      const hay = `${u.email} ${u.fullName} ${u.phone ?? ''} ${u.roles.join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [data?.items, roleFilter, statusFilter, search]);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Người dùng</h2>
          <p className="text-sm text-muted-foreground">Quản lý tài khoản hệ thống, lọc nhanh và tuỳ biến bảng hiển thị.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
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

      <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tìm kiếm</label>
            <input
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
              placeholder="Email, họ tên, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vai trò</label>
            <select
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
            >
              <option value="all">Tất cả</option>
              <option value="admin">admin</option>
              <option value="doctor">doctor</option>
              <option value="patient">patient</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Trạng thái</label>
            <select
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            >
              <option value="all">Tất cả</option>
              <option value="active">active</option>
              <option value="disabled">disabled</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Số dòng / trang</label>
            <select
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          <span className="rounded-full bg-muted px-2.5 py-1 font-semibold text-muted-foreground">
            Trên trang này: {filteredItems.length}/{data?.items.length ?? 0}
          </span>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={dense} onChange={(e) => setDense(e.target.checked)} />
            Mật độ dày
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={showPhone} onChange={(e) => setShowPhone(e.target.checked)} />
            Hiện cột Phone
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={showCreatedAt} onChange={(e) => setShowCreatedAt(e.target.checked)} />
            Hiện cột Tạo lúc
          </label>
          <button
            className="rounded-lg border border-border bg-card px-2 py-1 font-semibold hover:bg-muted"
            type="button"
            onClick={() => {
              setSearch('');
              setRoleFilter('all');
              setStatusFilter('all');
              setDense(false);
              setShowPhone(false);
              setShowCreatedAt(true);
            }}
          >
            Reset bộ lọc
          </button>
        </div>
      </div>

      {openCreate ? (
        <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">Tạo người dùng</h3>
              <p className="text-sm text-muted-foreground">Tạo user mới và gán role.</p>
            </div>
            <button
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
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
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
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
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
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
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
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
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
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
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
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
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
              onClick={() => setOpenCreate(false)}
              type="button"
            >
              Huỷ
            </button>
            <button
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
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
        <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">Chi tiết người dùng</h3>
              <p className="text-sm text-muted-foreground">{detail.email}</p>
            </div>
            <button
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
              onClick={() => setDetailId(null)}
              type="button"
            >
              Đóng
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Họ tên</p>
              <p className="mt-1 font-semibold text-foreground">{detail.fullName}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Phone</p>
              <p className="mt-1 font-semibold text-foreground">{detail.phone ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Trạng thái</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                  {detail.status}
                </span>
                <button
                  className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
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
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Roles</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {detail.roles.map((r) => (
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${roleBadgeClass(r)}`} key={r}>
                  {r}
                </span>
              ))}
            </div>
          </div>

          {detail.doctorProfile ? (
            <div className="mt-6 rounded-lg border border-border bg-muted p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Doctor Profile</p>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">CCHN</p>
                  <p className="font-semibold text-foreground">{detail.doctorProfile.licenseNumber ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Verification</p>
                  <p className="font-semibold text-foreground">{detail.doctorProfile.verificationStatus}</p>
                </div>
              </div>
            </div>
          ) : null}

          {detail.patientProfile ? (
            <div className="mt-6 rounded-lg border border-border bg-muted p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Patient Profile</p>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Liên hệ khẩn cấp</p>
                  <p className="font-semibold text-foreground">{detail.patientProfile.emergencyContactName ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">SĐT khẩn cấp</p>
                  <p className="font-semibold text-foreground">{detail.patientProfile.emergencyContactPhone ?? '—'}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Họ tên</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Trạng thái</th>
                {showPhone ? <th className="px-4 py-3">Phone</th> : null}
                {showCreatedAt ? <th className="px-4 py-3">Tạo lúc</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground" colSpan={4 + Number(showPhone) + Number(showCreatedAt)}>
                    Đang tải…
                  </td>
                </tr>
              ) : null}
              {!isLoading && filteredItems.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground" colSpan={4 + Number(showPhone) + Number(showCreatedAt)}>
                    Không có người dùng phù hợp bộ lọc trên trang hiện tại.
                  </td>
                </tr>
              ) : null}
              {filteredItems.map((u) => (
                <tr
                  className="cursor-pointer hover:bg-muted"
                  key={u.id}
                  onClick={() => setDetailId(u.id)}
                >
                  <td className={`px-4 ${dense ? 'py-2' : 'py-3'} font-mono text-xs`}>{u.email}</td>
                  <td className={`px-4 ${dense ? 'py-2' : 'py-3'}`}>{u.fullName}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleBadgeClass(r)}`}
                          key={r}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className={`px-4 ${dense ? 'py-2' : 'py-3'}`}>{u.status}</td>
                  {showPhone ? <td className={`px-4 ${dense ? 'py-2' : 'py-3'} text-xs text-muted-foreground`}>{u.phone ?? '—'}</td> : null}
                  {showCreatedAt ? (
                    <td className={`px-4 ${dense ? 'py-2' : 'py-3'} text-xs text-muted-foreground`}>
                      {new Date(u.createdAt).toLocaleString('vi-VN')}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data ? (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              Trang {data.page} / {totalPages} — {data.total} tài khoản
            </span>
            <div className="flex gap-2">
              <button
                className="rounded-lg border border-border bg-card px-3 py-1 hover:bg-muted disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                type="button"
              >
                Trước
              </button>
              <button
                className="rounded-lg border border-border bg-card px-3 py-1 hover:bg-muted disabled:opacity-40"
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
