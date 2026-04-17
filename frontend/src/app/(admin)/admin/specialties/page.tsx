'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { adminApi } from '@/lib/api';

export default function AdminSpecialtiesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'specialties', page, limit],
    queryFn: () => adminApi.listSpecialties(page, limit),
  });

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const current = useMemo(() => rows.find((x) => x.id === editingId) ?? null, [editingId, rows]);

  const createMutation = useMutation({
    mutationFn: () =>
      adminApi.createSpecialty({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        iconUrl: iconUrl.trim() || undefined,
        status,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'specialties'] });
      setOpen(false);
      setEditingId(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      adminApi.updateSpecialty(editingId as string, {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        iconUrl: iconUrl.trim() || undefined,
        status,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'specialties'] });
      setOpen(false);
      setEditingId(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: 'active' | 'inactive' }) => adminApi.setSpecialtyStatus(id, next),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'specialties'] });
    },
  });

  function openCreate() {
    setEditingId(null);
    setName('');
    setSlug('');
    setDescription('');
    setIconUrl('');
    setStatus('active');
    setOpen(true);
  }

  function openEdit(id: string) {
    const s = rows.find((x) => x.id === id);
    if (!s) return;
    setEditingId(id);
    setName(s.name);
    setSlug(s.slug);
    setDescription(s.description ?? '');
    setIconUrl(s.iconUrl ?? '');
    setStatus(s.status === 'inactive' ? 'inactive' : 'active');
    setOpen(true);
  }

  const saveDisabled =
    !name.trim() || !slug.trim() || createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Chuyên khoa</h2>
          <p className="text-sm text-muted-foreground">
            CRUD — <code className="rounded bg-muted px-1 text-xs">/admin/specialties</code> (bảng{' '}
            <code className="text-xs">specialties</code>).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
            onClick={openCreate}
            type="button"
          >
            + Thêm chuyên khoa
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

      {open ? (
        <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {editingId ? 'Sửa chuyên khoa' : 'Thêm chuyên khoa'}
              </h3>
              <p className="text-sm text-muted-foreground">Nhập thông tin và lưu.</p>
            </div>
            <button
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
              onClick={() => setOpen(false)}
              type="button"
            >
              Đóng
            </button>
          </div>

          {(createMutation.isError || updateMutation.isError) ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {((createMutation.error ?? updateMutation.error) as Error).message}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold" htmlFor="name">
                Tên
              </label>
              <input
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                id="name"
                onChange={(e) => setName(e.target.value)}
                placeholder="Tim mạch"
                value={name}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold" htmlFor="slug">
                Slug
              </label>
              <input
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                id="slug"
                onChange={(e) => setSlug(e.target.value)}
                placeholder="tim-mach"
                value={slug}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-semibold" htmlFor="desc">
                Mô tả
              </label>
              <textarea
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                id="desc"
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Chẩn đoán và điều trị bệnh lý tim mạch…"
                rows={3}
                value={description}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-semibold" htmlFor="icon">
                Icon URL
              </label>
              <input
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                id="icon"
                onChange={(e) => setIconUrl(e.target.value)}
                placeholder="https://…"
                value={iconUrl}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold" htmlFor="status">
                Trạng thái
              </label>
              <select
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                id="status"
                onChange={(e) => setStatus(e.target.value === 'inactive' ? 'inactive' : 'active')}
                value={status}
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
              onClick={() => setOpen(false)}
              type="button"
            >
              Huỷ
            </button>
            <button
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saveDisabled}
              onClick={() => (editingId ? updateMutation.mutate() : createMutation.mutate())}
              type="button"
            >
              {editingId ? (updateMutation.isPending ? 'Đang lưu…' : 'Lưu') : (createMutation.isPending ? 'Đang tạo…' : 'Tạo')}
            </button>
          </div>
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
              <th className="px-4 py-3">Tên</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Trạng thái</th>
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
                  Chưa có chuyên khoa trong DB. Thêm dữ liệu vào bảng <code className="text-xs">specialties</code>.
                </td>
              </tr>
            ) : null}
            {rows.map((s) => (
              <tr className="hover:bg-muted" key={s.id}>
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.slug}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      s.status === 'active' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-foreground hover:bg-muted"
                      onClick={() => openEdit(s.id)}
                      type="button"
                    >
                      Sửa
                    </button>
                    <button
                      className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={statusMutation.isPending}
                      onClick={() =>
                        statusMutation.mutate({ id: s.id, next: s.status === 'active' ? 'inactive' : 'active' })
                      }
                      type="button"
                    >
                      {s.status === 'active' ? 'Tắt' : 'Bật'}
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
