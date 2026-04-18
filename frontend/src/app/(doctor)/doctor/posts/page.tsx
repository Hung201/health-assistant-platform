'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
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
    }
  });

  const rows = data?.items || [];
  const totalItems = data?.total || 0;
  const totalPages = Math.ceil(totalItems / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Bài viết của tôi</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Quản lý và xuất bản các bài viết chuyên môn y tế.
          </p>
        </div>
        <Link 
          href="/doctor/posts/create" 
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
        >
          <Plus size={16} />
          Viết bài mới
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Tiêu đề bài viết</th>
                <th className="px-6 py-4 font-medium">Phân loại</th>
                <th className="px-6 py-4 font-medium">Trạng thái</th>
                <th className="px-6 py-4 font-medium text-right">Lượt xem</th>
                <th className="px-6 py-4 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Đang tải danh sách bài viết...
                  </td>
                </tr>
              )}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-muted-foreground mb-4">Bạn chưa viết bài nào.</p>
                    <Link 
                      href="/doctor/posts/create" 
                      className="text-primary hover:underline text-sm font-medium"
                    >
                      Bắt đầu viết bài đầu tiên
                    </Link>
                  </td>
                </tr>
              )}
              {rows.map((post) => (
                <tr key={post.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground max-w-[300px] truncate">{post.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 max-w-[300px] truncate">{post.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-secondary/30 px-2 py-1 text-xs font-medium text-secondary-foreground">
                      {post.postType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={post.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    {Number(post.viewCount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <Link
                          href={`/doctor/posts/${post.id}`}
                          className="p-2 text-muted-foreground hover:bg-muted rounded-md transition-colors tooltip"
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
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-muted/20">
            <p className="text-sm text-muted-foreground">
               Trang <span className="font-medium text-foreground">{page}</span> trong <span className="font-medium text-foreground">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button 
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-border rounded text-sm hover:bg-muted disabled:opacity-50"
              >
                Trước
              </button>
              <button 
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 border border-border rounded text-sm hover:bg-muted disabled:opacity-50"
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
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    pending_review: 'bg-amber-100 text-amber-800 border-amber-200',
    published: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    rejected: 'bg-rose-100 text-rose-800 border-rose-200',
  };

  const labels: Record<string, string> = {
    draft: 'Bản nháp',
    pending_review: 'Chờ duyệt',
    published: 'Đã xuất bản',
    rejected: 'Bị từ chối',
  };

  const css = styles[status] || styles.draft;
  const label = labels[status] || status;

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${css}`}>
      {label}
    </span>
  );
}
