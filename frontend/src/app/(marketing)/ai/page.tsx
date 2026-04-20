'use client';

import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Activity, CheckCircle2, Shield, Sparkles, Send, Lock, Bot, User as UserIcon, Clock, FileText } from 'lucide-react';

import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

export default function AIDiagnosticPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

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

  useEffect(() => {
    if (user) {
      router.replace(aiHref);
    }
  }, [user, router, aiHref]);

  return (
    <div className="min-h-screen bg-[#fafafb] text-slate-900 font-sans flex flex-col">
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-2" href="/">
            <div className="rounded-lg bg-teal-500 p-1.5 text-white">
              <Activity size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Clinical Precision</h1>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link className="text-sm font-semibold text-teal-600 transition-colors hover:text-teal-700" href={aiHref}>
              AI
            </Link>
            <Link className="text-sm font-semibold text-slate-600 transition-colors hover:text-teal-600" href="/doctors">
              Bác sĩ
            </Link>
            <Link className="text-sm font-semibold text-slate-600 transition-colors hover:text-teal-600" href="/#blog">
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

      <main className="flex-1 flex flex-col justify-center">
        {/* AI Diagnostic Section */}
        <section className="bg-[#fafafb] py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Phân Tích Triệu Chứng AI</h2>
              <p className="text-slate-500 max-w-2xl mx-auto text-base">
                Chào mừng bạn đến với hệ thống chẩn đoán sơ bộ thông minh. Hãy mô tả triệu chứng của bạn để nhận phân tích y tế tức thì từ AI chuyên gia.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
                  <h3 className="font-bold text-teal-700 uppercase tracking-wider text-sm mb-4">Hướng dẫn</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="text-teal-600 mt-0.5 shrink-0" size={18} />
                      <span className="text-sm text-slate-600">Mô tả chi tiết vị trí và mức độ đau nhức.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="text-teal-600 mt-0.5 shrink-0" size={18} />
                      <span className="text-sm text-slate-600">Cung cấp thời gian triệu chứng bắt đầu.</span>
                    </li>
                  </ul>
                </div>
                <div className="rounded-2xl bg-teal-700 p-6 shadow-md relative overflow-hidden">
                  <div className="absolute right-0 top-0 opacity-10">
                    <Shield size={100} />
                  </div>
                  <h3 className="font-bold text-white text-base mb-2 relative z-10">Quyền riêng tư</h3>
                  <p className="text-sm text-teal-100 relative z-10 leading-relaxed">
                    Dữ liệu được ẩn danh hoàn toàn theo tiêu chuẩn HIPAA.
                  </p>
                </div>
              </div>

              {/* Middle Column (Chat UI) */}
              <div className="lg:col-span-2 rounded-2xl bg-white shadow-xl shadow-slate-200/50 flex flex-col border border-slate-100 overflow-hidden">
                <div className="flex items-center gap-3 p-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white">
                    <Bot size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Trợ lý Clinical AI</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                      <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Hoạt động</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 p-6 space-y-6 bg-slate-50/30">
                  {/* AI Message */}
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                      <Bot size={16} />
                    </div>
                    <div className="rounded-2xl rounded-tl-none bg-slate-100 px-5 py-3.5 text-sm text-slate-700 max-w-[85%]">
                      Chào bạn. Tôi là AI hỗ trợ chẩn đoán lâm sàng. Bạn đang gặp phải những triệu chứng khó chịu nào?
                    </div>
                  </div>
                  
                  {/* User Message */}
                  <div className="flex gap-3 justify-end">
                    <div className="rounded-2xl rounded-tr-none bg-[#003f87] px-5 py-3.5 text-sm text-white max-w-[85%] shadow-sm">
                      Tôi cảm thấy đau nhức âm ỉ ở vùng thắt lưng khoảng 3 ngày nay.
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e6f0fa] text-[#003f87]">
                      <UserIcon size={16} />
                    </div>
                  </div>
                  
                  {/* AI Diagnosis Result */}
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                      <Bot size={16} />
                    </div>
                    <div className="rounded-2xl rounded-tl-none bg-[#f4fcfb] border border-teal-100 p-5 text-sm text-slate-800 max-w-[85%] w-full shadow-sm">
                      <h4 className="font-bold text-teal-700 mb-2">Kết quả phân tích sơ bộ:</h4>
                      <p className="text-slate-600 mb-4 leading-relaxed">
                        Có dấu hiệu căng cơ thắt lưng. Cần kiểm tra sâu hơn để loại trừ thoát vị đĩa đệm.
                      </p>
                      <div className="rounded-xl bg-slate-100 px-4 py-3 flex items-center gap-2">
                        <Lock size={14} className="text-slate-500" />
                        <span className="text-xs font-bold text-slate-600">Đăng nhập để xem phác đồ chi tiết.</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border-t border-slate-100 bg-white">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Nhập thêm triệu chứng..." 
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 py-3.5 pl-4 pr-12 text-sm outline-none transition-colors focus:border-teal-400 focus:bg-white focus:ring-1 focus:ring-teal-400"
                    />
                    <button className="absolute right-2 top-2 h-10 w-10 flex items-center justify-center rounded-lg text-teal-600 hover:bg-teal-50 transition-colors">
                      <Send size={18} className="mr-0.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="rounded-2xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50 p-6 lg:p-8 flex flex-col">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/20 mb-6">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Mở khóa phân tích chuyên sâu</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-8">
                  Tạo tài khoản ngay để nhận bản báo cáo bệnh lý đầy đủ, lưu trữ lịch sử chẩn đoán và kết nối trực tiếp với bác sĩ chuyên khoa.
                </p>
                
                <div className="space-y-3 mb-8">
                  <Link href="/register" className="flex w-full items-center justify-center rounded-xl bg-[#003f87] py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#0056b3] hover:shadow-md">
                    Đăng ký miễn phí
                  </Link>
                  <Link href="/login" className="flex w-full items-center justify-center rounded-xl bg-slate-100 py-3.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200">
                    Đăng nhập
                  </Link>
                </div>
                
                <ul className="mt-auto space-y-3">
                  <li className="flex items-center gap-3">
                    <Clock size={16} className="text-teal-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-600">Lưu trữ lịch sử y tế</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Shield size={16} className="text-teal-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-600">Bảo mật dữ liệu 100%</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <FileText size={16} className="text-teal-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-600">Phác đồ điều trị cá nhân</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-100 py-8 border-t border-slate-200">
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
