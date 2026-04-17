'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import { adminApi } from '@/lib/api';

export default function AdminPendingDoctorsPage() {
  const qc = useQueryClient();
  const [msg, setMsg] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'doctors', 'pending', page, limit],
    queryFn: () => adminApi.listPendingDoctors(page, limit),
  });

  const { data: selected, isLoading: isLoadingSelected } = useQuery({
    queryKey: ['admin', 'users', 'detail', selectedUserId],
    queryFn: () => adminApi.getUser(selectedUserId as string),
    enabled: selectedUserId != null,
  });

  const approve = useMutation({
    mutationFn: (userId: string) => adminApi.approveDoctor(userId),
    onSuccess: () => {
      setMsg('Đã duyệt bác sĩ.');
      qc.invalidateQueries({ queryKey: ['admin', 'doctors', 'pending'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard', 'summary'] });
      if (selectedUserId) qc.invalidateQueries({ queryKey: ['admin', 'users', 'detail', selectedUserId] });
    },
    onError: (e: Error) => setMsg(e.message),
  });

  const reject = useMutation({
    mutationFn: (userId: string) => adminApi.rejectDoctor(userId),
    onSuccess: () => {
      setMsg('Đã từ chối hồ sơ.');
      qc.invalidateQueries({ queryKey: ['admin', 'doctors', 'pending'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard', 'summary'] });
      if (selectedUserId) qc.invalidateQueries({ queryKey: ['admin', 'users', 'detail', selectedUserId] });
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
          <h2 className="text-2xl font-bold text-foreground">Bác sĩ chờ duyệt</h2>
          <p className="text-sm text-muted-foreground">
            <code className="rounded bg-muted px-1 text-xs">GET /admin/doctors/pending</code> —{' '}
            <code className="rounded bg-muted px-1 text-xs">PATCH …/approve|reject</code>
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

      {selectedUserId ? (
        <div className="sticky top-4 z-10 mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chi tiết bác sĩ</p>
              <h3 className="mt-1 text-lg font-bold text-foreground">
                {isLoadingSelected ? 'Đang tải…' : selected?.fullName ?? '—'}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {selected?.email ?? '—'} • {selected?.phone ?? '—'} •{' '}
                {selected?.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'}
              </p>
            </div>
            <button
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedUserId(null)}
              type="button"
            >
              Đóng
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tài khoản</p>
              <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">Trạng thái:</span> {selected?.status ?? '—'}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Roles:</span> {selected?.roles?.join(', ') || '—'}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Giới tính:</span> {selected?.gender ?? '—'}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Ngày sinh:</span>{' '}
                  {selected?.dateOfBirth ? new Date(selected.dateOfBirth).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hồ sơ hành nghề</p>
              <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">Chức danh:</span> {selected?.doctorProfile?.professionalTitle ?? '—'}
                </p>
                <p>
                  <span className="font-semibold text-foreground">CCHN:</span>{' '}
                  <span className="font-mono text-xs">{selected?.doctorProfile?.licenseNumber ?? '—'}</span>
                </p>
                <p>
                  <span className="font-semibold text-foreground">Cơ sở:</span> {selected?.doctorProfile?.workplaceName ?? '—'}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Kinh nghiệm:</span>{' '}
                  {selected?.doctorProfile?.yearsOfExperience != null ? `${selected.doctorProfile.yearsOfExperience} năm` : '—'}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Phí tư vấn:</span> {selected?.doctorProfile?.consultationFee ?? '—'}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Xác thực:</span>{' '}
                  {selected?.doctorProfile
                    ? `${selected.doctorProfile.verificationStatus} (${selected.doctorProfile.isVerified ? 'verified' : 'not verified'})`
                    : '—'}
                </p>
                {selected?.doctorProfile?.bio ? (
                  <div>
                    <p className="font-semibold text-foreground">Giới thiệu:</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{selected.doctorProfile.bio}</p>
                  </div>
                ) : null}
              </div>
            </div>
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
              <th className="px-4 py-3">Bác sĩ</th>
              <th className="px-4 py-3">Chức danh</th>
              <th className="px-4 py-3">Số CCHN</th>
              <th className="px-4 py-3">Cơ sở</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>
                  Đang tải…
                </td>
              </tr>
            ) : null}
            {rows.length === 0 && !isLoading ? (
              <tr>
                <td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>
                  Không có bác sĩ chờ duyệt.
                </td>
              </tr>
            ) : null}
            {rows.map((d) => (
              <tr
                className={selectedUserId === d.userId ? 'bg-primary/5' : 'hover:bg-muted'}
                key={d.userId}
                onClick={() => setSelectedUserId(d.userId)}
                role="button"
                tabIndex={0}
              >
                <td className="px-4 py-3">
                  <p className="font-medium">{d.fullName ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{d.email}</p>
                </td>
                <td className="px-4 py-3">{d.professionalTitle ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs">{d.licenseNumber ?? '—'}</td>
                <td className="px-4 py-3">{d.workplaceName ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      disabled={approve.isPending || reject.isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        approve.mutate(d.userId);
                      }}
                      type="button"
                    >
                      Duyệt
                    </button>
                    <button
                      className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-destructive hover:bg-muted disabled:opacity-50"
                      disabled={approve.isPending || reject.isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        reject.mutate(d.userId);
                      }}
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
