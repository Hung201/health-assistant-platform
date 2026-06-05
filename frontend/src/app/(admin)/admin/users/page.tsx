'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { adminApi, type AdminUserFeaturePermissions, type AdminUserRow } from '@/lib/api';

function rowFeaturePerms(u: AdminUserRow): AdminUserFeaturePermissions {
  return u.featurePermissions ?? { livestream: false };
}

function userIsDoctor(roles: string[]): boolean {
  return roles.includes('doctor');
}

function formatRole(role: string): string {
  if (role === 'admin') return 'Quản trị viên';
  if (role === 'doctor') return 'Bác sĩ';
  if (role === 'patient') return 'Bệnh nhân';
  return role;
}

function formatUserStatus(status: string): string {
  if (status === 'active') return 'Hoạt động';
  if (status === 'disabled') return 'Vô hiệu hoá';
  if (status === 'pending_email_verification') return 'Chờ xác minh email';
  return status;
}

function statusBadgeClass(status: string): string {
  if (status === 'active') return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
  if (status === 'disabled') return 'bg-red-500/10 text-red-700 dark:text-red-300';
  if (status === 'pending_email_verification') return 'bg-amber-500/15 text-amber-700 dark:text-amber-300';
  return 'bg-muted text-foreground';
}

function formatVerificationStatus(status: string): string {
  if (status === 'approved') return 'Đã duyệt';
  if (status === 'pending') return 'Chờ duyệt';
  if (status === 'rejected') return 'Từ chối';
  return status;
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'patient' | 'doctor' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'disabled' | 'pending_email_verification'
  >('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
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

  const updateFeaturesMutation = useMutation({
    mutationFn: ({ id, livestream }: { id: string; livestream: boolean }) =>
      adminApi.updateUser(id, { livestream }),
    onSuccess: async (_, v) => {
      await qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      await qc.invalidateQueries({ queryKey: ['admin', 'users', 'detail', v.id] });
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async (payload: {
      ids: string[];
      action: 'activate' | 'deactivate' | 'livestream_on' | 'livestream_off';
    }) => {
      const tasks = payload.ids.map((id) => {
        if (payload.action === 'activate') return adminApi.updateUser(id, { status: 'active' });
        if (payload.action === 'deactivate') return adminApi.updateUser(id, { status: 'disabled' });
        if (payload.action === 'livestream_on') return adminApi.updateUser(id, { livestream: true });
        return adminApi.updateUser(id, { livestream: false });
      });
      await Promise.all(tasks);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      await qc.invalidateQueries({ queryKey: ['admin', 'users', 'detail'] });
      setSelectedIds(new Set());
    },
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const tableColCount = 7 + Number(showPhone) + Number(showCreatedAt);

  useEffect(() => {
    setPage(1);
  }, [limit]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, limit]);

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

  const selectedUsers = useMemo(
    () => filteredItems.filter((u) => selectedIds.has(u.id)),
    [filteredItems, selectedIds],
  );

  const selectedDoctorCount = selectedUsers.filter((u) => userIsDoctor(u.roles)).length;
  const allFilteredSelected =
    filteredItems.length > 0 && filteredItems.every((u) => selectedIds.has(u.id));
  const someFilteredSelected =
    filteredItems.some((u) => selectedIds.has(u.id)) && !allFilteredSelected;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllFiltered() {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredItems.forEach((u) => next.delete(u.id));
        return next;
      });
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredItems.forEach((u) => next.add(u.id));
      return next;
    });
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Người dùng</h2>
          <p className="text-sm text-muted-foreground">
            Tìm kiếm, lọc và chọn nhiều tài khoản để kích hoạt / vô hiệu hoá hàng loạt. Cấp quyền livestream chỉ áp dụng
            cho <span className="font-medium text-foreground">bác sĩ</span> — bấm «Chi tiết & quyền» hoặc chọn nhiều bác sĩ rồi dùng
            thao tác hàng loạt.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
            onClick={() => setOpenCreate(true)}
            type="button"
          >
            + Tạo người dùng
          </button>
          <Link className="text-sm font-medium text-primary hover:underline" href="/admin">
            ← Bảng điều khiển
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
              placeholder="Email, họ tên, số điện thoại..."
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
              <option value="admin">Quản trị viên</option>
              <option value="doctor">Bác sĩ</option>
              <option value="patient">Bệnh nhân</option>
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
              <option value="active">Hoạt động</option>
              <option value="disabled">Vô hiệu hoá</option>
              <option value="pending_email_verification">Chờ xác minh email</option>
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
            Mật độ gọn
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={showPhone} onChange={(e) => setShowPhone(e.target.checked)} />
            Hiện cột số điện thoại
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
              <p className="text-sm text-muted-foreground">Tạo tài khoản mới và gán vai trò.</p>
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
                Vai trò
              </label>
              <select
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                id="c-role"
                onChange={(e) => setCreateRole(e.target.value as 'patient' | 'doctor' | 'admin')}
                value={createRole}
              >
                <option value="patient">Bệnh nhân</option>
                <option value="doctor">Bác sĩ</option>
                <option value="admin">Quản trị viên</option>
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
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Số điện thoại</p>
              <p className="mt-1 font-semibold text-foreground">{detail.phone ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Trạng thái</p>
              <div className="mt-1 flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(detail.status)}`}>
                  {formatUserStatus(detail.status)}
                </span>
                {(detail.status === 'active' || detail.status === 'disabled') ? (
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
                    {detail.status === 'active' ? 'Vô hiệu hoá' : 'Kích hoạt'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Vai trò</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {detail.roles.map((r) => (
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${roleBadgeClass(r)}`} key={r}>
                  {formatRole(r)}
                </span>
              ))}
            </div>
          </div>

          {userIsDoctor(detail.roles) ? (
            <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Quyền sử dụng chức năng (bác sĩ)</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Chỉ bác sĩ: khi bật «Phát trực tiếp» thì tài khoản mới được tạo phiên live / vào phòng LiveKit.
              </p>
              <label className="mt-4 flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3">
                <span>
                  <span className="block text-sm font-semibold text-foreground">Phát trực tiếp (Livestream)</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Tắt nếu chưa muốn mở live cho bác sĩ này.
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-primary"
                  checked={(detail.featurePermissions ?? { livestream: false }).livestream}
                  disabled={updateFeaturesMutation.isPending}
                  onChange={(e) =>
                    updateFeaturesMutation.mutate({ id: detail.id, livestream: e.target.checked })
                  }
                />
              </label>
              {updateFeaturesMutation.isError ? (
                <p className="mt-2 text-xs text-destructive">{(updateFeaturesMutation.error as Error).message}</p>
              ) : null}
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Quyền livestream</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Chỉ tài khoản có vai trò <span className="font-medium text-foreground">bác sĩ</span> mới được cấp quyền phát trực tiếp. Tài
                khoản này không có vai trò bác sĩ nên không hiển thị công tắc cấp quyền.
              </p>
            </div>
          )}

          {detail.doctorProfile ? (
            <div className="mt-6 rounded-lg border border-border bg-muted p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Hồ sơ bác sĩ</p>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">CCHN</p>
                  <p className="font-semibold text-foreground">{detail.doctorProfile.licenseNumber ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Xác minh hành nghề</p>
                  <p className="font-semibold text-foreground">
                    {formatVerificationStatus(detail.doctorProfile.verificationStatus)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {detail.patientProfile ? (
            <div className="mt-6 rounded-lg border border-border bg-muted p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Hồ sơ bệnh nhân</p>
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

      {selectedIds.size > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 shadow-sm">
          <span className="text-sm font-bold text-foreground">
            Đã chọn {selectedIds.size} người dùng
            {selectedDoctorCount > 0 ? (
              <span className="ml-1 font-normal text-muted-foreground">({selectedDoctorCount} bác sĩ)</span>
            ) : null}
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
              disabled={bulkMutation.isPending}
              onClick={() =>
                bulkMutation.mutate({
                  ids: Array.from(selectedIds),
                  action: 'activate',
                })
              }
            >
              Kích hoạt
            </button>
            <button
              type="button"
              className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-800 hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
              disabled={bulkMutation.isPending}
              onClick={() =>
                bulkMutation.mutate({
                  ids: Array.from(selectedIds),
                  action: 'deactivate',
                })
              }
            >
              Vô hiệu hoá
            </button>
            <button
              type="button"
              className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-800 hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200"
              disabled={bulkMutation.isPending || selectedDoctorCount === 0}
              title={selectedDoctorCount === 0 ? 'Chọn ít nhất một bác sĩ' : undefined}
              onClick={() =>
                bulkMutation.mutate({
                  ids: selectedUsers.filter((u) => userIsDoctor(u.roles)).map((u) => u.id),
                  action: 'livestream_on',
                })
              }
            >
              Bật livestream (BS)
            </button>
            <button
              type="button"
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-50"
              disabled={bulkMutation.isPending || selectedDoctorCount === 0}
              onClick={() =>
                bulkMutation.mutate({
                  ids: selectedUsers.filter((u) => userIsDoctor(u.roles)).map((u) => u.id),
                  action: 'livestream_off',
                })
              }
            >
              Tắt livestream (BS)
            </button>
            <button
              type="button"
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
              disabled={bulkMutation.isPending}
              onClick={() => setSelectedIds(new Set())}
            >
              Bỏ chọn
            </button>
          </div>
          {bulkMutation.isPending ? (
            <span className="text-xs text-muted-foreground">Đang cập nhật…</span>
          ) : null}
          {bulkMutation.isError ? (
            <span className="text-xs text-destructive">{(bulkMutation.error as Error).message}</span>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border accent-primary"
                    checked={allFilteredSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someFilteredSelected;
                    }}
                    aria-label="Chọn tất cả trên trang"
                    onChange={toggleSelectAllFiltered}
                    disabled={filteredItems.length === 0}
                  />
                </th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Họ tên</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Livestream</th>
                <th className="px-4 py-3">Trạng thái</th>
                {showPhone ? <th className="px-4 py-3">Số điện thoại</th> : null}
                {showCreatedAt ? <th className="px-4 py-3">Tạo lúc</th> : null}
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground" colSpan={tableColCount}>
                    Đang tải…
                  </td>
                </tr>
              ) : null}
              {!isLoading && filteredItems.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground" colSpan={tableColCount}>
                    Không có người dùng phù hợp bộ lọc trên trang hiện tại.
                  </td>
                </tr>
              ) : null}
              {filteredItems.map((u) => {
                const isSelected = selectedIds.has(u.id);
                return (
                <tr
                  className={`cursor-pointer hover:bg-muted ${isSelected ? 'bg-primary/5' : ''}`}
                  key={u.id}
                  onClick={() => setDetailId(u.id)}
                >
                  <td
                    className={`px-3 ${dense ? 'py-2' : 'py-3'}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border accent-primary"
                      checked={isSelected}
                      aria-label={`Chọn ${u.fullName}`}
                      onChange={() => toggleSelect(u.id)}
                    />
                  </td>
                  <td className={`px-4 ${dense ? 'py-2' : 'py-3'} font-mono text-xs`}>{u.email}</td>
                  <td className={`px-4 ${dense ? 'py-2' : 'py-3'}`}>{u.fullName}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleBadgeClass(r)}`}
                          key={r}
                        >
                          {formatRole(r)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className={`px-4 ${dense ? 'py-2' : 'py-3'} text-xs`}>
                    {userIsDoctor(u.roles) ? (
                      <span
                        className={
                          rowFeaturePerms(u).livestream
                            ? 'font-medium text-emerald-700 dark:text-emerald-300'
                            : 'text-muted-foreground'
                        }
                      >
                        {rowFeaturePerms(u).livestream ? 'Được phép' : 'Tắt'}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className={`px-4 ${dense ? 'py-2' : 'py-3'}`}>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(u.status)}`}>
                      {formatUserStatus(u.status)}
                    </span>
                  </td>
                  {showPhone ? <td className={`px-4 ${dense ? 'py-2' : 'py-3'} text-xs text-muted-foreground`}>{u.phone ?? '—'}</td> : null}
                  {showCreatedAt ? (
                    <td className={`px-4 ${dense ? 'py-2' : 'py-3'} text-xs text-muted-foreground`}>
                      {new Date(u.createdAt).toLocaleString('vi-VN')}
                    </td>
                  ) : null}
                  <td className={`px-4 ${dense ? 'py-2' : 'py-3'} text-right`}>
                    <button
                      type="button"
                      className="rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/15"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailId(u.id);
                      }}
                    >
                      Chi tiết & quyền
                    </button>
                  </td>
                </tr>
              );
              })}
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
