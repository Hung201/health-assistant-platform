'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircleQuestion, Send } from 'lucide-react';

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
    mutationFn: (payload: { id: string; content: string }) => qaApi.answer(payload.id, { content: payload.content }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['doctor-qa-inbox'] });
      await qc.invalidateQueries({ queryKey: ['qa', 'public'] });
    },
  });

  const rows = useMemo(() => data?.items ?? [], [data?.items]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h1 className="text-2xl font-extrabold text-foreground inline-flex items-center gap-2">
          <MessageCircleQuestion className="h-6 w-6 text-primary" />
          Hỏi bác sĩ miễn phí
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Trả lời câu hỏi cộng đồng để hỗ trợ bệnh nhân và tăng độ tin cậy hồ sơ bác sĩ.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['pending', 'answered', 'all'] as FilterStatus[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setStatus(k)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${status === k ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-muted'}`}
          >
            {k === 'pending' ? 'Chờ trả lời' : k === 'answered' ? 'Đã trả lời' : 'Tất cả'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">Đang tải câu hỏi…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
          Không có câu hỏi phù hợp bộ lọc hiện tại.
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((q) => (
            <article key={q.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-2 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${q.status === 'answered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {q.status === 'answered' ? 'Đã trả lời' : 'Chờ trả lời'}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">Bệnh nhân: {q.patient.fullName}</span>
              </div>
              <h3 className="text-lg font-extrabold text-foreground">{q.title}</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{q.content}</p>

              {q.answerContent ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <p className="mb-1 text-xs font-semibold uppercase">Nội dung trả lời</p>
                  {q.answerContent}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-border bg-background p-4">
                  <textarea
                    rows={4}
                    placeholder="Nhập nội dung tư vấn cho bệnh nhân..."
                    value={draftAnswerById[q.id] ?? ''}
                    onChange={(e) => setDraftAnswerById((s) => ({ ...s, [q.id]: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => answerMutation.mutate({ id: q.id, content: draftAnswerById[q.id] ?? '' })}
                      disabled={answerMutation.isPending || !(draftAnswerById[q.id] ?? '').trim()}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
                    >
                      <Send size={14} />
                      Gửi trả lời
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
