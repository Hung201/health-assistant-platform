'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { publicPostsApi, authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useState } from 'react';
import { Heart, MessageCircle, Reply, Send, Calendar, Eye, Activity, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function BlogPostDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const qc = useQueryClient();
  const slug = params.slug;
  const { user, logout } = useAuthStore();
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{id: number, name: string} | null>(null);

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      logout();
      router.refresh();
    },
  });

  const appHref = user?.roles?.includes('admin')
    ? '/admin'
    : user?.roles?.includes('doctor')
      ? '/doctor'
      : user
        ? '/patient'
        : '/login';

  const aiHref = user ? '/patient/ai-assistant' : '/ai';

  const { data: post, isLoading } = useQuery({
    queryKey: ['public', 'post', slug],
    queryFn: () => publicPostsApi.detail(slug),
  });

  const { data: comments, isLoading: isLoadingComments } = useQuery({
    queryKey: ['public', 'post', slug, 'comments'],
    queryFn: () => publicPostsApi.comments(slug),
  });

  const addComment = useMutation({
    mutationFn: (content: string) => publicPostsApi.addComment(slug, { content, parentCommentId: replyTo?.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['public', 'post', slug, 'comments'] });
      setCommentText('');
      setReplyTo(null);
    },
    onError: (e: any) => alert(e.message || 'Lỗi gửi bình luận')
  });

  const reactComment = useMutation({
    mutationFn: (id: string) => publicPostsApi.reactComment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['public', 'post', slug, 'comments'] });
    }
  });

  const getCategoryName = (type: string) => {
    switch (type) {
      case 'medical_article': return 'Y Khoa';
      case 'health_tip': return 'Mẹo Sức Khỏe';
      case 'news': return 'Tin Tức';
      default: return type;
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#fafafb] flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
           <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#003f87] border-r-transparent mb-4"></div>
           <p className="text-slate-500 font-medium">Đang tải nội dung bài viết...</p>
        </div>
      </div>
    </div>
  );
  
  if (!post) return (
    <div className="min-h-screen bg-[#fafafb] flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center py-20">Không tìm thấy bài viết</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafb] font-sans flex flex-col">
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-2" href="/">
            <div className="rounded-lg bg-teal-500 p-1.5 text-white">
              <Activity size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Clinical Precision</h1>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link className="text-sm font-semibold text-slate-600 transition-colors hover:text-teal-600" href={aiHref}>
              AI
            </Link>
            <Link className="text-sm font-semibold text-slate-600 transition-colors hover:text-teal-600" href="/doctors">
              Bác sĩ
            </Link>
            <Link className="text-sm font-semibold text-teal-600 transition-colors hover:text-teal-700" href="/blog">
              Blog
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  className="rounded-full px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
                  href={appHref}
                >
                  Vào ứng dụng
                </Link>
                <button
                  className="rounded-full bg-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={logoutMutation.isPending}
                  onClick={() => logoutMutation.mutate()}
                  type="button"
                >
                  {logoutMutation.isPending ? 'Đang đăng xuất…' : 'Đăng xuất'}
                </button>
              </>
            ) : (
              <>
                <Link
                  className="rounded-full px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
                  href="/login"
                >
                  Đăng nhập
                </Link>
                <Link
                  className="rounded-full bg-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-teal-700"
                  href="/register"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24">
        {/* Hero Header Area */}
        <div className="bg-white border-b border-slate-200 py-12 md:py-20 mb-12 relative overflow-hidden">
          {/* Subtle decorative background */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] bg-teal-50/50 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-[600px] h-[600px] bg-[#003f87]/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="mb-6">
              <span className="inline-flex items-center rounded-full bg-teal-100 px-3 py-1 text-xs font-extrabold text-teal-800 uppercase tracking-widest shadow-sm">
                {getCategoryName(post.postType)}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#003f87] mb-8 leading-[1.15]">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 font-medium bg-slate-50/80 inline-flex px-6 py-3 rounded-2xl border border-slate-100">
               <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-teal-200 text-teal-800 flex items-center justify-center font-bold text-xs">
                    {post.authorName?.[0] || 'A'}
                  </div>
                  <span className="font-bold text-slate-800">{post.authorName}</span>
               </div>
               <div className="w-1 h-1 rounded-full bg-slate-300"></div>
               <div className="flex items-center gap-1.5">
                  <Calendar size={16} className="text-teal-600" />
                  <span>{new Date(post.publishedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
               </div>
               <div className="w-1 h-1 rounded-full bg-slate-300"></div>
               <div className="flex items-center gap-1.5">
                  <Eye size={16} className="text-teal-600" />
                  <span>{Number(post.viewCount).toLocaleString()} lượt đọc</span>
               </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {post.thumbnailUrl && (
            <div className="aspect-[21/9] w-full rounded-3xl overflow-hidden mb-16 shadow-xl border border-slate-200 bg-white">
              <img src={post.thumbnailUrl} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Article Content */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 sm:p-12 mb-16">
            <div 
              className="prose prose-slate prose-lg sm:prose-xl mx-auto max-w-none prose-headings:text-[#003f87] prose-headings:font-extrabold prose-a:text-teal-600 hover:prose-a:text-teal-700 prose-img:rounded-2xl prose-img:shadow-md"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 sm:p-12" id="comments">
            <h3 className="text-2xl font-extrabold mb-8 flex items-center gap-3 text-[#003f87]">
              <MessageCircle className="text-teal-500" size={28} />
              Bình luận ({comments?.length || 0})
            </h3>

            {/* Comment Box */}
            <div className="mb-12 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              {!user ? (
                <div className="text-center py-8">
                   <p className="text-slate-500 font-medium mb-6">Vui lòng đăng nhập để chia sẻ ý kiến của bạn.</p>
                   <Link href={`/login?next=/blog/${slug}`} className="inline-flex items-center rounded-xl bg-[#003f87] px-6 py-3 text-sm font-extrabold text-white hover:bg-[#002b5e] shadow-lg shadow-[#003f87]/20 transition-all">
                     Đăng nhập ngay
                   </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {replyTo && (
                    <div className="flex items-center justify-between bg-teal-50 border border-teal-100 px-4 py-3 rounded-xl text-sm text-teal-800">
                       <span>Đang trả lời: <span className="font-bold">{replyTo.name}</span></span>
                       <button onClick={() => setReplyTo(null)} className="hover:text-teal-900 font-bold text-xs bg-white px-2 py-1 rounded-md shadow-sm">Hủy bỏ</button>
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-lg uppercase shrink-0 border border-teal-200 shadow-sm">
                      {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover" /> : (user.fullName?.[0] || 'U')}
                    </div>
                    <div className="flex-1 w-full">
                      <textarea
                        rows={replyTo ? 3 : 4}
                        className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#003f87] resize-none placeholder:text-slate-400 font-medium shadow-sm"
                        placeholder="Viết bình luận của bạn tại đây..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                      />
                      <div className="mt-4 flex justify-end">
                        <button
                          disabled={!commentText.trim() || addComment.isPending}
                          onClick={() => addComment.mutate(commentText)}
                          className="flex items-center gap-2 rounded-xl bg-[#003f87] px-6 py-3 text-sm font-extrabold text-white hover:bg-[#002b5e] disabled:opacity-50 disabled:shadow-none transition-all shadow-lg shadow-[#003f87]/20"
                        >
                          <Send size={18} />
                          {addComment.isPending ? 'Đang gửi...' : 'Gửi bình luận'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Comment List */}
            <div className="space-y-6">
              {isLoadingComments ? (
                <div className="text-center text-slate-500 py-10">
                   <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-teal-600 border-r-transparent mb-3"></div>
                   <p>Đang tải bình luận...</p>
                </div>
              ) : comments?.length === 0 ? (
                <div className="text-center text-slate-500 py-12 bg-slate-50 border border-slate-200 border-dashed rounded-2xl font-medium">
                  Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ suy nghĩ!
                </div>
              ) : (
                comments?.map((comment: any) => (
                  <CommentItem 
                    key={comment.id} 
                    comment={comment} 
                    onReply={(id, name) => {
                      setReplyTo({ id, name });
                      document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' });
                    }} 
                    onReact={(id) => {
                      if(!user) return alert('Vui lòng đăng nhập để thả tim');
                      reactComment.mutate(id);
                    }} 
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-100 py-8 border-t border-slate-200 mt-auto">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-[#003f87]">Clinical Precision</h2>
            </div>
            
            <div className="flex gap-6 text-sm font-medium text-slate-600">
              <a href="#" className="hover:text-teal-600 transition-colors">Chính sách bảo mật</a>
              <a href="#" className="hover:text-teal-600 transition-colors">Điều khoản sử dụng</a>
              <a href="#" className="hover:text-teal-600 transition-colors">Liên hệ</a>
            </div>
            
            <p className="text-[10px] uppercase tracking-widest text-slate-400">
              © 2024 ETHOS CLINICAL SYSTEMS. ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CommentItem({ comment, onReply, onReact }: { comment: any; onReply: (id: number, name: string) => void; onReact: (id: string) => void }) {
  return (
    <div className="flex gap-4 p-5 border border-slate-100 rounded-2xl bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-teal-200 hover:shadow-md transition-all">
       <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm uppercase shrink-0 border border-teal-100">
        {comment.user.avatarUrl ? <img src={comment.user.avatarUrl} className="w-full h-full rounded-full object-cover" /> : (comment.user.fullName?.[0] || 'U')}
       </div>
       <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-baseline justify-between gap-4 mb-1">
             <span className="font-extrabold text-slate-800 truncate text-[15px]">{comment.user.fullName}</span>
             <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
          <p className="text-sm text-slate-600 whitespace-pre-wrap break-words leading-relaxed font-medium">
            {comment.content}
          </p>
          <div className="mt-4 flex items-center gap-6">
            <button 
              onClick={() => onReact(comment.id)}
              className={cn("flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer", comment.isLikedByMe ? "text-rose-500 scale-105" : "text-slate-400 hover:text-rose-500")}
            >
              <Heart size={16} className={cn(comment.isLikedByMe ? "fill-rose-500" : "")} />
              {comment.likesCount > 0 ? comment.likesCount : 'Thích'}
            </button>
            <button 
              onClick={() => onReply(Number(comment.id), comment.user.fullName)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#003f87] transition-colors cursor-pointer"
            >
              <Reply size={16} />
              Trả lời
            </button>
          </div>

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
             <div className="mt-5 space-y-4 border-l-2 border-teal-100 pl-5">
               {comment.replies.map((reply: any) => (
                 <CommentItem key={reply.id} comment={reply} onReply={onReply} onReact={onReact} />
               ))}
             </div>
          )}
       </div>
    </div>
  );
}
