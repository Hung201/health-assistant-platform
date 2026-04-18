'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { publicPostsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useState } from 'react';
import { Heart, MessageCircle, Reply, Send } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils'; // Assumed exists, normal in shadcn

export default function BlogPostDetailPage({ params }: { params: { slug: string } }) {
  const qc = useQueryClient();
  const slug = params.slug;
  const { user } = useAuthStore();
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{id: number, name: string} | null>(null);

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

  if (isLoading) return <div className="text-center py-20">Đang tải nội dung...</div>;
  if (!post) return <div className="text-center py-20">Không tìm thấy bài viết</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Article Header */}
      <div className="mb-10 text-center">
        <span className="inline-flex items-center rounded-full bg-secondary/30 px-3 py-1 text-sm font-medium text-secondary-foreground mb-6">
          {post.postType === 'medical_article' ? 'Y Khoa' : post.postType}
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl mb-6">
          {post.title}
        </h1>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
           <span className="font-semibold text-foreground">{post.authorName}</span>
           <span>•</span>
           <span>{new Date(post.publishedAt).toLocaleDateString('vi-VN')}</span>
           <span>•</span>
           <span>{Number(post.viewCount).toLocaleString()} lượt xem</span>
        </div>
      </div>

      {post.thumbnailUrl && (
        <div className="aspect-video w-full rounded-2xl overflow-hidden mb-12 shadow-lg border border-border">
          <img src={post.thumbnailUrl} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Article Content */}
      <div 
        className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto max-w-none text-foreground prose-headings:text-foreground prose-a:text-primary mb-16"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <hr className="my-10 border-border" />

      {/* Comments Section */}
      <div className="max-w-3xl mx-auto" id="comments">
        <h3 className="text-2xl font-bold mb-8 flex items-center gap-2 text-foreground">
          <MessageCircle />
          Bình luận
        </h3>

        {/* Comment Box */}
        <div className="mb-10 rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
          {!user ? (
            <div className="text-center py-6">
               <p className="text-muted-foreground mb-4">Vui lòng đăng nhập để tham gia bình luận.</p>
               <Link href={`/login?next=/blog/${slug}`} className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                 Đăng nhập ngay
               </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {replyTo && (
                <div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg text-sm text-muted-foreground">
                   <span>Đang trả lời: <span className="font-semibold text-foreground">{replyTo.name}</span></span>
                   <button onClick={() => setReplyTo(null)} className="hover:text-foreground text-xs hover:underline">Hủy</button>
                </div>
              )}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm uppercase shrink-0">
                  {user.fullName?.[0] || 'U'}
                </div>
                <div className="flex-1 w-full">
                  <textarea
                    rows={replyTo ? 2 : 3}
                    className="w-full rounded-lg border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none placeholder:text-muted-foreground"
                    placeholder="Viết bình luận của bạn..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      disabled={!commentText.trim() || addComment.isPending}
                      onClick={() => addComment.mutate(commentText)}
                      className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition"
                    >
                      <Send size={16} />
                      Gửi bình luận
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
            <div className="text-center text-muted-foreground py-10">Đang tải bình luận...</div>
          ) : comments?.length === 0 ? (
            <div className="text-center text-muted-foreground py-10 bg-muted/20 border border-border rounded-xl">
              Chưa có bình luận nào. Hãy là người đầu tiên!
            </div>
          ) : (
            comments?.map((comment: any) => (
              <CommentItem 
                key={comment.id} 
                comment={comment} 
                onReply={(id, name) => {
                  setReplyTo({ id, name });
                  // Scroll to comment box
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
  );
}

function CommentItem({ comment, onReply, onReact }: { comment: any; onReply: (id: number, name: string) => void; onReact: (id: string) => void }) {
  return (
    <div className="flex gap-4 p-4 border border-border rounded-xl bg-card shadow-sm hover:border-primary/20 transition-colors">
       <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm uppercase shrink-0">
        {comment.user.fullName?.[0] || 'U'}
       </div>
       <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-baseline justify-between gap-4">
             <span className="font-semibold text-foreground truncate">{comment.user.fullName}</span>
             <span className="text-xs text-muted-foreground shrink-0">{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
          <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
          <div className="mt-3 flex items-center gap-4">
            <button 
              onClick={() => onReact(comment.id)}
              className={cn("flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer", comment.isLikedByMe ? "text-rose-500" : "text-muted-foreground hover:text-rose-500")}
            >
              <Heart size={14} className={cn(comment.isLikedByMe ? "fill-rose-500" : "")} />
              {comment.likesCount > 0 ? comment.likesCount : 'Thích'}
            </button>
            <button 
              onClick={() => onReply(Number(comment.id), comment.user.fullName)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              <Reply size={14} />
              Trả lời
            </button>
          </div>

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
             <div className="mt-4 space-y-4 border-l-2 border-border pl-4">
               {comment.replies.map((reply: any) => (
                 <CommentItem key={reply.id} comment={reply} onReply={onReply} onReact={onReact} />
               ))}
             </div>
          )}
       </div>
    </div>
  );
}
