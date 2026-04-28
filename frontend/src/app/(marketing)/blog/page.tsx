'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Activity } from 'lucide-react';

import { publicPostsApi, authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export default function PublicBlogPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['public', 'posts', page],
    queryFn: () => publicPostsApi.list(page, limit),
  });

  const allPosts = data?.items || [];
  
  // Extract unique categories from posts
  const categories = useMemo(() => {
    const cats = new Set<string>();
    allPosts.forEach(p => {
      if (p.postType) cats.add(p.postType);
    });
    return Array.from(cats);
  }, [allPosts]);

  const filteredPosts = useMemo(() => {
    if (activeCategory === 'all') return allPosts;
    return allPosts.filter(p => p.postType === activeCategory);
  }, [allPosts, activeCategory]);

  const getCategoryName = (type: string) => {
    switch (type) {
      case 'medical_article': return 'Y Khoa';
      case 'health_tip': return 'Mẹo Sức Khỏe';
      case 'news': return 'Tin Tức';
      default: return type;
    }
  };

  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold tracking-tight text-[#003f87] sm:text-5xl">
              Tin tức & Kiến thức Y khoa
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-600">
              Cập nhật thông tin y tế, lời khuyên sức khỏe và các bài viết chuyên môn từ đội ngũ Bác sĩ hàng đầu.
            </p>
          </div>

          {/* Category Tabs */}
          {!isLoading && categories.length > 0 && (
            <div className="flex justify-center mb-10 overflow-x-auto hide-scrollbar pb-2">
              <div className="inline-flex bg-white p-1.5 rounded-full border border-slate-200 shadow-sm whitespace-nowrap">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                    activeCategory === 'all' 
                      ? 'bg-teal-600 text-white shadow-md' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Tất cả bài viết
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all capitalize ${
                      activeCategory === cat 
                        ? 'bg-teal-600 text-white shadow-md' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {getCategoryName(cat)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-20">
               <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent mb-4"></div>
               <p className="text-slate-500 font-medium">Đang tải bài viết...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center text-slate-500 py-20 bg-white rounded-3xl border border-dashed border-slate-300">
              Hiện tại chưa có bài viết nào trong chuyên mục này.
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group flex flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition-all hover:shadow-xl hover:border-teal-200 hover:-translate-y-1">
                  <div className="aspect-[16/10] w-full bg-slate-100 overflow-hidden relative">
                    {post.thumbnailUrl ? (
                      <img src={post.thumbnailUrl} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                        Chưa có ảnh bìa
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                       <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold text-teal-700 backdrop-blur-md shadow-sm">
                         {getCategoryName(post.postType)}
                       </span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-6 sm:p-8">
                    <div className="flex-1">
                      <h3 className="text-xl font-extrabold text-[#003f87] group-hover:text-teal-600 transition-colors line-clamp-2 leading-tight">
                        {post.title}
                      </h3>
                      <p className="mt-3 text-sm text-slate-600 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>
                    <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                           {post.authorName?.charAt(0) || 'A'}
                        </div>
                        <span className="font-bold text-sm text-slate-800">{post.authorName}</span>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Lượt xem</p>
                         <p className="font-extrabold text-[#003f87] text-sm">{Number(post.viewCount).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-16 flex justify-center gap-3">
               <button 
                 disabled={page <= 1}
                 onClick={() => setPage(p => Math.max(1, p - 1))}
                 className="px-5 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white font-bold transition-colors"
               >
                 Trang trước
               </button>
               <button 
                 disabled={page >= totalPages}
                 onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                 className="px-5 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white font-bold transition-colors"
               >
                 Trang sau
               </button>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </>
  );
}
