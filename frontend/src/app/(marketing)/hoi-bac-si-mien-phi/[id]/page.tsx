'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowLeft, CalendarClock, CircleUserRound, Stethoscope } from 'lucide-react';

import { qaApi } from '@/lib/api';

export default function QaDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['qa', 'public', 'detail', id],
    queryFn: () => qaApi.detailPublic(id),
    enabled: Boolean(id),
  });

  return (
    <div className="min-h-screen bg-[#fafafb] text-slate-900 font-sans">
      <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-2" href="/">
            <div className="rounded-lg bg-teal-500 p-1.5 text-white">
              <Activity size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Clinical Precision</h1>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {isLoading ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">Đang tải…</div> : null}
        {isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700">
            {(error as Error).message}
          </div>
        ) : null}
        {data ? (
          <div className="space-y-6">
            <Link href="/hoi-bac-si-mien-phi" className="inline-flex items-center gap-1 text-sm font-bold text-slate-600 hover:text-teal-700">
              <ArrowLeft size={16} /> Quay lại danh sách câu hỏi
            </Link>

            <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${data.status === 'answered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                >
                  {data.status === 'answered' ? 'Đã trả lời' : 'Đã duyệt, chờ bác sĩ trả lời'}
                </span>
                {data.category ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{data.category}</span> : null}
              </div>
              <h1 className="text-3xl font-extrabold leading-tight text-[#003f87]">{data.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1"><CircleUserRound size={14} />{data.patient.fullName}</span>
                <span className="inline-flex items-center gap-1"><CalendarClock size={14} />{new Date(data.createdAt).toLocaleString('vi-VN')}</span>
              </div>
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700 whitespace-pre-wrap">
                {data.content}
              </div>
            </article>

            <article className="rounded-3xl border border-teal-200 bg-white p-7 shadow-sm">
              <h2 className="inline-flex items-center gap-2 text-2xl font-extrabold text-teal-700">
                <Stethoscope size={22} />
                Trả lời từ bác sĩ
              </h2>
              {data.answerContent ? (
                <>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {data.doctor ? `Bác sĩ: ${data.doctor.fullName}` : 'Bác sĩ'}
                    {data.answeredAt ? ` • ${new Date(data.answeredAt).toLocaleString('vi-VN')}` : ''}
                  </p>
                  <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50 p-5 text-sm leading-7 text-slate-800 whitespace-pre-wrap">
                    {data.answerContent}
                  </div>
                </>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                  Câu hỏi đang chờ bác sĩ phản hồi. Bạn vui lòng quay lại sau.
                </div>
              )}
            </article>
          </div>
        ) : null}
      </main>
    </div>
  );
}
