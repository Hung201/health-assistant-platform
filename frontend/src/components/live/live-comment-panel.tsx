'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send } from 'lucide-react';

import { livestreamsApi, type LiveStreamCommentRow } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

type LiveCommentPanelProps = {
  streamId: string;
  enabled?: boolean;
};

function CommentItem({ comment }: { comment: LiveStreamCommentRow }) {
  const initial = comment.user.fullName?.trim()?.[0]?.toUpperCase() ?? '?';
  const time = comment.displayTime;
  const date = comment.displayDate;
  return (
    <li className="flex gap-2.5 py-2">
      {comment.user.avatarUrl ? (
        <img
          src={comment.user.avatarUrl}
          alt=""
          className="h-8 w-8 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">
          {initial}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
          <span className="text-xs font-bold text-slate-800">{comment.user.fullName}</span>
          <span className="shrink-0 text-right text-[10px] leading-tight text-slate-400">
            <span className="block">{time}</span>
            {date ? <span className="block">{date}</span> : null}
          </span>
        </div>
        <p className="mt-0.5 break-words text-sm text-slate-700">{comment.content}</p>
      </div>
    </li>
  );
}

export function LiveCommentPanel({ streamId, enabled = true }: LiveCommentPanelProps) {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const listRef = useRef<HTMLUListElement>(null);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['livestreams', streamId, 'comments'],
    queryFn: () => livestreamsApi.listComments(streamId),
    enabled: enabled && Boolean(streamId),
    refetchInterval: 3000,
  });

  const addMutation = useMutation({
    mutationFn: (content: string) => livestreamsApi.addComment(streamId, content),
    onSuccess: () => {
      setText('');
      void qc.invalidateQueries({ queryKey: ['livestreams', streamId, 'comments'] });
      void qc.invalidateQueries({ queryKey: ['public-livestreams-home'] });
    },
  });

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [comments.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || addMutation.isPending) return;
    addMutation.mutate(trimmed);
  };

  return (
    <div className="flex h-full min-h-[440px] flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <MessageCircle className="h-4 w-4 text-teal-600" aria-hidden />
        <h2 className="text-sm font-bold text-slate-900">Bình luận trực tiếp</h2>
        <span className="ml-auto text-xs text-slate-500">{comments.length}</span>
      </div>

      <ul
        ref={listRef}
        className="flex-1 space-y-0 overflow-y-auto px-3 py-2"
        aria-live="polite"
      >
        {isLoading ? (
          <li className="py-8 text-center text-sm text-slate-500">Đang tải bình luận…</li>
        ) : comments.length === 0 ? (
          <li className="py-8 text-center text-sm text-slate-500">
            Chưa có bình luận. Hãy là người đầu tiên!
          </li>
        ) : (
          comments.map((c) => <CommentItem key={c.id} comment={c} />)
        )}
      </ul>

      <div className="border-t border-slate-100 p-3">
        {user ? (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={500}
              placeholder="Viết bình luận…"
              className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={!text.trim() || addMutation.isPending}
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-teal-600 px-3 py-2 text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
              aria-label="Gửi bình luận"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <p className="text-center text-sm text-slate-600">
            <Link href="/login" className="font-semibold text-teal-700 hover:underline">
              Đăng nhập
            </Link>{' '}
            để bình luận
          </p>
        )}
        {addMutation.isError ? (
          <p className="mt-2 text-xs text-red-600">{(addMutation.error as Error).message}</p>
        ) : null}
      </div>
    </div>
  );
}
