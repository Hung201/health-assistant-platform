'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Plus, Edit2, Trash2, FileText } from 'lucide-react';
import { doctorPostsApi } from '@/lib/api';

export default function DoctorPostsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['doctor', 'posts', page],
    queryFn: () => doctorPostsApi.list(page, limit),
  });

  const deletePost = useMutation({
    mutationFn: (id: string) => doctorPostsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor', 'posts'] });
      alert('Đã xoá bài viết thành công!');
    },
    onError: (e: any) => {
      alert(e.message || 'Xoá thất bại');
    },
  });

  const rows = data?.items || [];
  const totalItems = data?.total || 0;
  const totalPages = Math.ceil(totalItems / limit);

  return (
    <div className="space-y-6 doctor-page-enter">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Bài viết của tôi</h1>
          <p className="mt-1 text-sm text-muted-foreground">Quản lý và xuất bản các bài viết chuyên môn y tế.</p>
        </div>
        <Link
          href="/doctor/posts/create"
          className="flex items-center gap-2 rounded-xl bg-[#0D9E75] px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-[#0D9E75]/20 hover:bg-[#0B8A65] transition-all hover:-translate-y-0.5"
        >
          <Plus size={16} />
          Viết bài mới
        </Link>
      </div>

      {/* ── Table card ── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Tiêu đề bài viết</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Phân loại</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Lượt xem</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-3 border-solid border-[#0D9E75] border-r-transparent" />
                    Đang tải danh sách bài viết...
                  </td>
                </tr>
              )}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F8F2]">
                      <FileText size={28} className="text-[#0D9E75]" />
                    </div>
                    <p className="text-slate-500 mb-3 font-medium">Bạn chưa viết bài nào.</p>
                    <Link
                      href="/doctor/posts/create"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0D9E75] px-4 py-2 text-sm font-bold text-white hover:bg-[#0B8A65] transition-colors"
                    >
                      <Plus size={14} /> Bắt đầu viết bài đầu tiên
                    </Link>
                  </td>
                </tr>
              )}
              {rows.map((post) => (
                <tr key={post.id} className="hover:bg-muted transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-foreground max-w-[300px] truncate group-hover:text-[#0D9E75] transition-colors">{post.title}</div>
                    <div className="text-xs text-slate-400 mt-1 max-w-[300px] truncate">{post.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {post.postType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={post.status} />
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-600">
                    {Number(post.viewCount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/doctor/posts/${post.id}`}
                        className="rounded-lg p-2 text-slate-400 hover:bg-[#E8F8F2] hover:text-[#0D9E75] transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={16} />
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) {
                            deletePost.mutate(post.id);
                          }
                        }}
                        disabled={post.status === 'published' || deletePost.isPending}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Xóa bài viết"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Trang <span className="font-bold text-foreground">{page}</span> trong{' '}
              <span className="font-bold text-foreground">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground hover:bg-[#E8F8F2] dark:hover:bg-[#0D9E75]/10 hover:text-[#0D9E75] hover:border-[#0D9E75]/30 disabled:opacity-40 transition-colors"
              >
                Trước
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground hover:bg-[#E8F8F2] dark:hover:bg-[#0D9E75]/10 hover:text-[#0D9E75] hover:border-[#0D9E75]/30 disabled:opacity-40 transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600 border border-slate-200',
    pending_review: 'bg-amber-100 text-amber-700 border border-amber-200',
    published: 'bg-[#E8F8F2] text-[#0D9E75] border border-[#0D9E75]/20',
    rejected: 'bg-rose-100 text-rose-700 border border-rose-200',
  };
  const labels: Record<string, string> = {
    draft: 'Bản nháp',
    pending_review: 'Chờ duyệt',
    published: 'Đã xuất bản',
    rejected: 'Bị từ chối',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status] || styles.draft}`}>
      {labels[status] || status}
    </span>
  );
}
