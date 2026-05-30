'use client';

import { useMemo, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MessageCircleQuestion,
  Send,
  CalendarClock,
  CheckCircle2,
  Clock,
  HelpCircle,
  Search,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

import { qaApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useAuthStore } from '@/stores/auth.store';

export default function PatientQaPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [form, setForm] = useState({ title: '', content: '', category: '' });

  // Store patient's own asked questions in local storage to give them a "My Questions" view since backend doesn't have an owner filter
  const [myQuestionIds, setMyQuestionIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`patient_qa_ids_${user?.id || 'guest'}`);
      if (stored) {
        try {
          setMyQuestionIds(JSON.parse(stored));
        } catch (e) {
          // ignore
        }
      }
    }
  }, [user?.id]);

  const saveMyQuestionId = (id: string) => {
    const updated = [id, ...myQuestionIds];
    setMyQuestionIds(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`patient_qa_ids_${user?.id || 'guest'}`, JSON.stringify(updated));
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['qa', 'public', page, selectedCategory],
    queryFn: () => qaApi.listPublic(page, 15, selectedCategory === 'all' ? undefined : selectedCategory),
  });

  const askMutation = useMutation({
    mutationFn: () =>
      qaApi.ask({
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category.trim() || undefined,
      }),
    onSuccess: async (newQuestion) => {
      toast.show({
        variant: 'success',
        title: 'Gửi thành công',
        message: 'Câu hỏi đã được gửi! Chờ quản trị viên duyệt để hiển thị công khai.',
      });
      if (newQuestion?.id) {
        saveMyQuestionId(newQuestion.id);
      }
      setForm({ title: '', content: '', category: '' });
      await qc.invalidateQueries({ queryKey: ['qa', 'public'] });
    },
    onError: (error: any) => {
      toast.show({
        variant: 'error',
        title: 'Gửi thất bại',
        message: error?.message || 'Có lỗi xảy ra khi gửi câu hỏi.',
      });
    },
  });

  const CATEGORIES = [
    { key: 'all', label: 'Tất cả chuyên khoa' },
    { key: 'Tiêu hoá', label: 'Tiêu hoá' },
    { key: 'Tim mạch', label: 'Tim mạch' },
    { key: 'Hô hấp', label: 'Hô hấp' },
    { key: 'Nhi khoa', label: 'Nhi khoa' },
    { key: 'Da liễu', label: 'Da liễu' },
    { key: 'Xương khớp', label: 'Xương khớp' },
  ];

  // Filter items by search query
  const filteredQuestions = useMemo(() => {
    const items = data?.items ?? [];
    let result = items;

    if (activeTab === 'my') {
      // Show questions asked by current patient (by name or saved local IDs)
      result = items.filter(
        (q) => myQuestionIds.includes(q.id) || q.patient.id === user?.id
      );
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.content.toLowerCase().includes(q) ||
          (item.category && item.category.toLowerCase().includes(q))
      );
    }
    return result;
  }, [data?.items, searchTerm, activeTab, myQuestionIds, user?.id]);

  const totalPages = useMemo(() => {
    const total = data?.total ?? 0;
    const limit = data?.limit ?? 15;
    return Math.max(1, Math.ceil(total / limit));
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.show({
        variant: 'error',
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập đầy đủ tiêu đề và nội dung câu hỏi.',
      });
      return;
    }
    askMutation.mutate();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-16">
      {/* Premium Gradient Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-[#0D9E75]/10 bg-gradient-to-br from-[#0D9E75] to-[#086349] p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10">
          <MessageCircleQuestion size={320} />
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <Sparkles size={12} /> Tư vấn trực tiếp từ chuyên gia y tế
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Hỏi đáp Bác sĩ miễn phí</h1>
          <p className="text-sm sm:text-base font-medium text-emerald-50/90 leading-relaxed max-w-2xl">
            Nhận lời khuyên chuyên môn đáng tin cậy về tình trạng sức khỏe của bạn. 
            Mọi thắc mắc sẽ được các bác sĩ giàu kinh nghiệm phản hồi nhanh chóng và bảo mật.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Submit Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-20 rounded-[2rem] border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F8F2] text-[#0D9E75]">
                <HelpCircle size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Đặt câu hỏi mới</h2>
                <p className="text-xs font-medium text-slate-500">Mô tả chi tiết để bác sĩ tư vấn chính xác nhất</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Tiêu đề câu hỏi</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đau đầu âm ỉ kèm buồn nôn vào buổi sáng..."
                  value={form.title}
                  onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-[#0D9E75] focus:bg-white focus:ring-4 focus:ring-[#0D9E75]/10 placeholder:text-slate-400"
                  disabled={askMutation.isPending}
                />
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Chuyên mục / Chuyên khoa</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-[#0D9E75] focus:bg-white focus:ring-4 focus:ring-[#0D9E75]/10"
                  disabled={askMutation.isPending}
                >
                  <option value="">Chọn chuyên mục (không bắt buộc)</option>
                  {CATEGORIES.slice(1).map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Mô tả triệu chứng & tiền sử</label>
                <textarea
                  rows={6}
                  placeholder="Cung cấp thêm thông tin: thời gian xuất hiện triệu chứng, mức độ đau, loại thuốc đang sử dụng, hoặc tiền sử bệnh lý liên quan..."
                  value={form.content}
                  onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-[#0D9E75] focus:bg-white focus:ring-4 focus:ring-[#0D9E75]/10 placeholder:text-slate-400 resize-none"
                  disabled={askMutation.isPending}
                />
              </div>

              <button
                type="submit"
                disabled={askMutation.isPending || !form.title.trim() || !form.content.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0D9E75] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#0D9E75]/20 transition-all hover:bg-[#0B8A65] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:transform-none"
              >
                <Send size={16} />
                {askMutation.isPending ? 'Đang gửi câu hỏi...' : 'Gửi câu hỏi tới bác sĩ'}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Search, Filters & List */}
        <div className="lg:col-span-7 space-y-6">
          {/* Controls Card */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-6 shadow-sm space-y-4">
            {/* Tab Swapper */}
            <div className="flex border-b border-slate-100 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
                  activeTab === 'all'
                    ? 'border-[#0D9E75] text-[#0D9E75]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Cộng đồng hỏi đáp
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('my')}
                className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
                  activeTab === 'my'
                    ? 'border-[#0D9E75] text-[#0D9E75]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Câu hỏi của tôi {myQuestionIds.length > 0 && `(${myQuestionIds.length})`}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm câu hỏi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-[#0D9E75] focus:bg-white"
                />
              </div>

              {/* Category Selector */}
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-[#0D9E75] focus:bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* List Area */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-[#0D9E75] border-r-transparent" />
                <p className="text-sm font-medium text-slate-400">Đang tải danh sách câu hỏi...</p>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
                <MessageCircleQuestion size={44} className="mx-auto text-slate-300" />
                <h3 className="text-base font-bold text-slate-700">Chưa có câu hỏi nào</h3>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                  {activeTab === 'my'
                    ? 'Bạn chưa gửi câu hỏi nào trong phiên làm việc này.'
                    : 'Không tìm thấy câu hỏi phù hợp với bộ lọc tìm kiếm.'}
                </p>
              </div>
            ) : (
              filteredQuestions.map((q) => {
                const isAnswered = q.status === 'answered';
                return (
                  <article
                    key={q.id}
                    className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-[#0D9E75]/20 hover:shadow-md"
                  >
                    {/* Header line info */}
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          isAnswered
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/50'
                        }`}
                      >
                        {isAnswered ? (
                          <>
                            <CheckCircle2 size={12} /> Đã trả lời
                          </>
                        ) : (
                          <>
                            <Clock size={12} /> Chờ bác sĩ
                          </>
                        )}
                      </span>

                      {q.category && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                          {q.category}
                        </span>
                      )}

                      <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                        <CalendarClock size={12} />
                        {new Date(q.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    {/* Question Title & Content */}
                    <h3 className="text-base font-extrabold text-slate-900 mb-2 leading-snug group-hover:text-[#0D9E75] transition-colors">
                      {q.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-4">
                      {q.content}
                    </p>

                    {/* Answer section inside card */}
                    {isAnswered && q.answerContent ? (
                      <div className="rounded-xl border border-emerald-100/50 bg-[#E8F8F2]/40 p-4 space-y-2 mt-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-[#0D9E75]/10 flex items-center justify-center text-[#0D9E75] text-[10px] font-bold shrink-0">
                            {q.doctor?.avatarUrl ? (
                              <img
                                src={q.doctor.avatarUrl}
                                alt={q.doctor.fullName}
                                className="h-full w-full object-cover rounded-full"
                              />
                            ) : (
                              'Dr'
                            )}
                          </div>
                          <span className="text-xs font-bold text-[#086349]">
                            Bác sĩ phản hồi: {q.doctor?.fullName || 'Chuyên gia y tế'}
                          </span>
                        </div>
                        <p className="text-sm text-[#065F46] leading-relaxed whitespace-pre-wrap">
                          {q.answerContent}
                        </p>
                      </div>
                    ) : (
                      <div className="border-t border-slate-50 pt-3 flex items-center gap-2 text-xs font-medium text-slate-400">
                        <span>Gửi bởi: <span className="font-semibold text-slate-600">{q.patient?.fullName || 'Bệnh nhân'}</span></span>
                      </div>
                    )}
                  </article>
                );
              })
            )}

            {/* Pagination */}
            {totalPages > 1 && activeTab === 'all' && (
              <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50"
                >
                  Trang trước
                </button>
                <span className="text-xs font-bold text-slate-400">
                  Trang {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50"
                >
                  Trang sau
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
