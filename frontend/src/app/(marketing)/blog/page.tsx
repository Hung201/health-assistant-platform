'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { publicPostsApi } from '@/lib/api';

export default function PublicBlogPage() {
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading } = useQuery({
    queryKey: ['public', 'posts', page],
    queryFn: () => publicPostsApi.list(page, limit),
  });

  const posts = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Kiến thức Y khoa
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-xl text-muted-foreground">
          Cập nhật thông tin y tế, lời khuyên sức khỏe và các bài viết chuyên môn từ đội ngũ Bác sĩ của chúng tôi.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-20">Đang tải bài viết...</div>
      ) : posts.length === 0 ? (
        <div className="text-center text-muted-foreground py-20">Hiện tại chưa có bài viết nào.</div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md hover:border-primary/50">
              <div className="aspect-video w-full bg-muted overflow-hidden relative">
                {post.thumbnailUrl ? (
                  <img src={post.thumbnailUrl} alt={post.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/50">
                    No Image
                  </div>
                )}
                <div className="absolute top-4 left-4">
                   <span className="inline-flex items-center rounded-full bg-primary/90 px-2.5 py-0.5 text-xs font-semibold text-primary-foreground backdrop-blur-sm">
                     {post.postType === 'medical_article' ? 'Y Khoa' : post.postType === 'health_tip' ? 'Mẹo SK' : post.postType}
                   </span>
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-between p-6">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border">
                  <div className="flex gap-2">
                    <span className="font-medium text-foreground">{post.authorName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <span>{new Date(post.publishedAt).toLocaleDateString('vi-VN')}</span>
                     <span>• {Number(post.viewCount).toLocaleString()} lượt xem</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-12 flex justify-center gap-2">
           <button 
             disabled={page <= 1}
             onClick={() => setPage(p => Math.max(1, p - 1))}
             className="px-4 py-2 border border-border rounded-md hover:bg-muted disabled:opacity-50 font-medium"
           >
             Trang trước
           </button>
           <button 
             disabled={page >= totalPages}
             onClick={() => setPage(p => Math.min(totalPages, p + 1))}
             className="px-4 py-2 border border-border rounded-md hover:bg-muted disabled:opacity-50 font-medium"
           >
             Trang sau
           </button>
        </div>
      )}
    </div>
  );
}
