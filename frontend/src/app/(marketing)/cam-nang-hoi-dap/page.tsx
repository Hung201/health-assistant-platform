'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Activity, BookOpenText, Search } from 'lucide-react';

import { publicPostsApi } from '@/lib/api';

export default function HandbookPage() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['cam-nang-hoi-dap', page],
    queryFn: () => publicPostsApi.list(page, 12),
  });

  const filtered = useMemo(() => {
    const items = data?.items ?? [];
    const q = keyword.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) => p.title.toLowerCase().includes(q) || (p.excerpt ?? '').toLowerCase().includes(q));
  }, [data?.items, keyword]);

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? 12)));

  return (
    <div className="min-h-screen bg-[#fafafb] text-slate-900 font-sans">
      <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-2" href="/">
            <div className="rounded-lg bg-teal-500 p-1.5 text-white">
              <Activity size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Clinical Precision</h1>
          </Link>
          <Link href="/" className="text-sm font-semibold text-teal-700 hover:underline">
            Về trang chủ
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="inline-flex items-center gap-2 text-3xl font-extrabold text-[#003f87]">
            <BookOpenText size={30} className="text-teal-600" />
            Cẩm nang hỏi đáp
          </h2>
          <p className="mt-2 max-w-3xl text-slate-600">
            Tổng hợp bài viết và kinh nghiệm thực tế được bác sĩ đăng tải để bạn tra cứu nhanh, dễ hiểu.
          </p>
          <div className="mt-4 relative max-w-lg">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm bài viết theo tiêu đề hoặc nội dung tóm tắt"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">Đang tải cẩm nang…</div>
        ) : filtered.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((article) => (
              <Link
                key={article.id}
                href={`/blog/${article.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-lg"
              >
                <div className="aspect-[16/10] w-full bg-slate-100">
                  <img
                    src={article.thumbnailUrl || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1170&auto=format&fit=crop'}
                    alt={article.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <span className="mb-2 inline-flex w-fit rounded-full bg-teal-50 px-2 py-0.5 text-xs font-bold uppercase text-teal-700">
                    {article.postType || 'Bài viết'}
                  </span>
                  <h3 className="line-clamp-2 text-lg font-extrabold text-slate-900 group-hover:text-teal-700">{article.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">{article.excerpt || 'Không có mô tả ngắn.'}</p>
                  <p className="mt-4 text-xs font-semibold text-slate-500">Bác sĩ: {article.authorName}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Không tìm thấy bài viết phù hợp.
          </div>
        )}

        {totalPages > 1 ? (
          <div className="mt-8 flex justify-center gap-2">
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trang trước
            </button>
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Trang sau
            </button>
          </div>
        ) : null}
      </main>
    </div>
  );
}
