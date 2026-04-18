'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { doctorPostsApi } from '@/lib/api';
import TipTapEditor from '@/components/TipTapEditor';

export default function CreateDoctorPostPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    postType: 'medical_article',
    thumbnailUrl: '',
    content: '',
  });

  const createPost = useMutation({
    mutationFn: (status: 'draft' | 'pending_review') => {
      return doctorPostsApi.create({ ...formData, status });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor', 'posts'] });
      alert('Tạo bài viết thành công!');
      router.push('/doctor/posts');
    },
    onError: (e: any) => {
      alert(e.message || 'Có lỗi xảy ra');
    }
  });

  const handleSubmit = (status: 'draft' | 'pending_review') => {
    if (!formData.title.trim()) return alert('Vui lòng nhập tiêu đề bài viết');
    if (!formData.content.trim()) return alert('Vui lòng nhập nội dung bài viết');
    createPost.mutate(status);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/doctor/posts" 
          className="p-2 border border-border rounded-lg bg-card text-muted-foreground hover:bg-muted"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Viết bài mới</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Chia sẻ kiến thức y khoa, cảnh báo dịch bệnh hoặc các ca lâm sàng.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground block">
            Tiêu đề bài viết
          </label>
          <input 
            type="text"
            className="w-full text-lg px-4 py-3 border border-border bg-card rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Ví dụ: Dấu hiệu nhận biết và cách phòng ngừa sốt xuất huyết..."
            value={formData.title}
            onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Post Type */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground block">
              Phân loại bài viết
            </label>
            <select 
              className="w-full px-4 py-2 border border-border bg-card rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={formData.postType}
              onChange={(e) => setFormData(f => ({ ...f, postType: e.target.value }))}
            >
              <option value="medical_article">Bài viết Y khoa</option>
              <option value="health_tip">Mẹo sức khỏe</option>
              <option value="case_study">Ca lâm sàng</option>
              <option value="announcement">Thông báo</option>
            </select>
          </div>

           {/* Thumbnail */}
           <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground block">
              Ảnh bìa (URL)
            </label>
            <input 
              type="text"
              className="w-full px-4 py-2 border border-border bg-card rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="https://example.com/image.jpg"
              value={formData.thumbnailUrl}
              onChange={(e) => setFormData(f => ({ ...f, thumbnailUrl: e.target.value }))}
            />
          </div>
        </div>

        {/* Excerpt */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground block">
            Trích dẫn (Hiển thị ở trang ngoài)
          </label>
          <textarea 
            rows={2}
            className="w-full px-4 py-2 border border-border bg-card rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            placeholder="Viết một đoạn ngắn gọn mô tả bài viết của bạn..."
            value={formData.excerpt}
            onChange={(e) => setFormData(f => ({ ...f, excerpt: e.target.value }))}
          />
        </div>

        {/* Content using TipTap */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground block">
            Nội dung bài viết
          </label>
          <TipTapEditor 
            content={formData.content}
            onChange={(html) => setFormData(f => ({ ...f, content: html }))}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <button
            onClick={() => handleSubmit('draft')}
            disabled={createPost.isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-border bg-card font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            Lưu bản nháp
          </button>
          <button
            onClick={() => handleSubmit('pending_review')}
            disabled={createPost.isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
          >
            <Send size={16} />
            Gửi duyệt bài
          </button>
        </div>
      </div>
    </div>
  );
}
