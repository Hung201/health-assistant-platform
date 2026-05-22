'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircleQuestion, Send, CheckCircle2, Clock } from 'lucide-react';

import { qaApi } from '@/lib/api';

type FilterStatus = 'all' | 'pending' | 'answered';

export default function DoctorQaInboxPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<FilterStatus>('pending');
  const [draftAnswerById, setDraftAnswerById] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['doctor-qa-inbox', status],
    queryFn: () => qaApi.doctorInbox(status, 1, 50),
  });

  const answerMutation = useMutation({
    mutationFn: (payload: { id: string; content: string }) =>
      qaApi.answer(payload.id, { content: payload.content }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['doctor-qa-inbox'] });
      await qc.invalidateQueries({ queryKey: ['qa', 'public'] });
    },
  });

  const rows = useMemo(() => data?.items ?? [], [data?.items]);

  const FILTERS: { key: FilterStatus; label: string }[] = [
    { key: 'pending', label: 'Chờ trả lời' },
    { key: 'answered', label: 'Đã trả lời' },
    { key: 'all', label: 'Tất cả' },
  ];

  return (
    <div className="space-y-6 doctor-page-enter">
      {/* ── Header card ── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F8F2]">
            <MessageCircleQuestion className="h-5 w-5 text-[#0D9E75]" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">Hỏi bác sĩ miễn phí</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500 pl-[52px]">
          Trả lời câu hỏi cộng đồng để hỗ trợ bệnh nhân và tăng độ tin cậy hồ sơ bác sĩ.
        </p>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatus(key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold border transition-all ${
              status === key
                ? 'border-[#0D9E75] bg-[#0D9E75] text-white shadow-sm shadow-[#0D9E75]/20'
                : 'border-border bg-card text-foreground hover:bg-[#E8F8F2] dark:hover:bg-[#0D9E75]/10 hover:border-[#0D9E75]/30 hover:text-[#0D9E75]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-[3px] border-solid border-[#0D9E75] border-r-transparent" />
          <p className="text-sm text-slate-400">Đang tải câu hỏi…</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <MessageCircleQuestion size={40} className="mx-auto mb-3 text-[#0D9E75]/30" />
          <p className="text-sm font-medium text-slate-400">Không có câu hỏi phù hợp bộ lọc hiện tại.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((q) => (
            <article key={q.id} className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-[#0D9E75]/20 transition-all">
              {/* Meta */}
              <div className="mb-3 flex items-center gap-2 flex-wrap">
                {q.status === 'answered' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F8F2] px-2.5 py-0.5 text-xs font-bold text-[#0D9E75] border border-[#0D9E75]/20">
                    <CheckCircle2 size={11} /> Đã trả lời
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
                    <Clock size={11} /> Chờ trả lời
                  </span>
                )}
                <span className="text-xs font-medium text-slate-400">
                  Bệnh nhân: <span className="font-semibold text-slate-600">{q.patient.fullName}</span>
                </span>
              </div>

              {/* Question */}
              <h3 className="text-base font-extrabold text-foreground mb-2">{q.title}</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">{q.content}</p>

              {/* Answer section */}
              {q.answerContent ? (
                <div className="mt-4 rounded-xl border border-[#0D9E75]/20 bg-[#E8F8F2] p-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#0D9E75]">Nội dung trả lời</p>
                  <p className="text-sm text-[#065F46] leading-relaxed">{q.answerContent}</p>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-border bg-muted/50 p-4">
                  <textarea
                    rows={4}
                    placeholder="Nhập nội dung tư vấn cho bệnh nhân..."
                    value={draftAnswerById[q.id] ?? ''}
                    onChange={(e) => setDraftAnswerById((s) => ({ ...s, [q.id]: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-[#0D9E75] focus:ring-2 focus:ring-[#0D9E75]/15 resize-none"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        answerMutation.mutate({ id: q.id, content: draftAnswerById[q.id] ?? '' })
                      }
                      disabled={answerMutation.isPending || !(draftAnswerById[q.id] ?? '').trim()}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0D9E75] px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-[#0D9E75]/20 transition-all hover:bg-[#0B8A65] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <Send size={14} />
                      {answerMutation.isPending ? 'Đang gửi…' : 'Gửi trả lời'}
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
