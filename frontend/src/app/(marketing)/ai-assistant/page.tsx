'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { doctorsApi } from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string | React.ReactNode;
}

export default function PublicAIAssistantPage() {
  const user = useAuthStore((s) => s.user);

  const { data: doctorsData } = useQuery({
    queryKey: ['ai-doctors'],
    queryFn: () => doctorsApi.list({ limit: 2 }),
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Chào bạn. Tôi là AI hỗ trợ chẩn đoán lâm sàng. Bạn đang gặp phải những triệu chứng khó chịu nào?',
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: (
            <div className="space-y-3">
              <p className="font-bold text-slate-900">Kết quả phân tích sơ bộ:</p>
              <p>Có dấu hiệu căng cơ thắt lưng. Cần kiểm tra sâu hơn để loại trừ thoát vị đĩa đệm.</p>
              {!user && (
                <div className="mt-3 bg-primary/10 rounded-lg p-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary">lock</span>
                  <span className="text-sm font-semibold text-primary">Đăng nhập để xem phác đồ chi tiết.</span>
                </div>
              )}
            </div>
          ),
        }
      ]);
    }, 1500);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f8f9fa] text-slate-900 font-sans pb-24">
      {/* Header */}
      <section className="py-16 text-center px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">Phân Tích Triệu Chứng AI</h1>
        <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Chào mừng bạn đến với hệ thống chẩn đoán sơ bộ thông minh. Hãy mô tả triệu chứng của bạn để nhận phân tích y tế tức thì từ AI chuyên gia.
        </p>
      </section>

      {/* 3 Column Layout */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Col */}
        <div className="lg:col-span-3 space-y-6">
          {/* Guide Card */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-sm mb-6">Hướng dẫn</h3>
            <ul className="space-y-5">
              <li className="flex gap-3 text-sm text-slate-700 font-medium">
                <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[12px]">check</span>
                </div>
                Mô tả chi tiết vị trí và mức độ đau nhức.
              </li>
              <li className="flex gap-3 text-sm text-slate-700 font-medium">
                <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[12px]">check</span>
                </div>
                Cung cấp thời gian triệu chứng bắt đầu.
              </li>
            </ul>
          </div>

          {/* Privacy Card */}
          <div className="bg-primary rounded-2xl p-6 text-white relative overflow-hidden shadow-md shadow-primary/20">
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-1/2 translate-y-1/2" />
            <h3 className="font-bold mb-2">Quyền riêng tư</h3>
            <p className="text-[13px] text-white/80 leading-relaxed">
              Dữ liệu được ẩn danh hoàn toàn theo tiêu chuẩn HIPAA.
            </p>
          </div>
        </div>

        {/* Middle Col (Chat) */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 flex flex-col h-[650px] overflow-hidden">
            {/* Chat Header */}
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm">
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">Trợ lý Clinical AI</h2>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Hoạt động</span>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50" ref={scrollRef}>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white mt-1 ${msg.role === 'user' ? 'bg-slate-800' : 'bg-primary/20 text-primary'}`}>
                    <span className="material-symbols-outlined text-[16px]">{msg.role === 'user' ? 'person' : 'smart_toy'}</span>
                  </div>
                  <div className={`p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm border ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white border-primary rounded-tr-sm' 
                      : 'bg-white border-slate-200 text-slate-700 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 max-w-[85%]">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary mt-1">
                    <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 rounded-tl-sm flex items-center gap-1.5 h-12 shadow-sm">
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white border-t border-slate-100">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập thêm triệu chứng..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-[15px]"
                  disabled={isTyping}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="absolute right-3 text-slate-400 hover:text-primary transition-colors disabled:opacity-50 disabled:hover:text-slate-400 p-2"
                >
                  <span className="material-symbols-outlined text-[24px]">send</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Col */}
        <div className="lg:col-span-3">
          {user ? (
            <div className="space-y-6">
              {/* Diagnosis Result Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm border-l-4 border-l-primary relative overflow-hidden">
                <h3 className="font-bold text-lg text-slate-900 mb-1">Kết quả chẩn đoán dự kiến</h3>
                <p className="text-xs text-slate-500 mb-6">Dựa trên các triệu chứng được cung cấp</p>
                
                <div className="space-y-5 mb-6">
                  <div>
                    <div className="flex justify-between text-sm font-bold text-slate-800 mb-1.5">
                      <span>Đau thắt ngực (Angina)</span>
                      <span className="text-primary">65%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full transition-all duration-1000" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-bold text-slate-800 mb-1.5">
                      <span>Rối loạn lo âu</span>
                      <span className="text-slate-600">25%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-slate-500 h-2 rounded-full transition-all duration-1000" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-bold text-slate-800 mb-1.5">
                      <span>Trào ngược dạ dày</span>
                      <span className="text-slate-600">10%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-slate-300 h-2 rounded-full transition-all duration-1000" style={{ width: '10%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 text-red-700 p-4 rounded-xl flex gap-3 items-start mb-6 border border-red-100">
                   <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">warning</span>
                   <p className="text-[11px] font-medium italic leading-relaxed">
                     Kết quả chỉ mang tính tham khảo. AI không thay thế chẩn đoán chuyên môn của bác sĩ. Vui lòng đến cơ sở y tế gần nhất nếu triệu chứng trầm trọng.
                   </p>
                </div>

                <Link href="/doctors" className="flex items-center justify-center gap-2 w-full bg-primary/10 text-primary font-bold py-3.5 rounded-xl hover:bg-primary hover:text-white transition-colors text-sm">
                  <span className="material-symbols-outlined text-[18px]">person_search</span>
                  Tìm bác sĩ phù hợp
                </Link>
              </div>

              {/* Chat History Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900">Lịch sử phiên hỏi</h3>
                  <span className="material-symbols-outlined text-primary text-[18px]">history</span>
                </div>
                <div className="space-y-4">
                  {[
                    { title: "Đau ngực & Khó thở", date: "15/03/2024" },
                    { title: "Nhức đầu kéo dài", date: "12/03/2024" },
                    { title: "Ho khan về đêm", date: "28/02/2024" }
                  ].map((history, idx) => (
                    <div key={idx} className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center transition-colors">
                            <span className="material-symbols-outlined text-[16px]">description</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{history.title}</p>
                            <p className="text-[11px] text-slate-500">{history.date}</p>
                          </div>
                      </div>
                      <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors text-[16px]">chevron_right</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white mb-6 shadow-md shadow-primary/20">
                <span className="material-symbols-outlined">auto_awesome</span>
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-3 leading-tight">Mở khóa phân tích chuyên sâu</h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                Tạo tài khoản ngay để nhận bản báo cáo bệnh lý đầy đủ, lưu trữ lịch sử chẩn đoán và kết nối trực tiếp với bác sĩ chuyên khoa.
              </p>
              
              <div className="space-y-3 mb-8">
                <Link href="/register" className="flex items-center justify-center w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
                  Đăng ký miễn phí
                </Link>
                <Link href="/login" className="flex items-center justify-center w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-lg hover:bg-slate-200 transition-colors">
                  Đăng nhập
                </Link>
              </div>

              <ul className="space-y-4 border-t border-slate-100 pt-6">
                <li className="flex items-center gap-3 text-[13px] text-slate-700 font-medium">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">history</span> 
                  Lưu trữ lịch sử y tế
                </li>
                <li className="flex items-center gap-3 text-[13px] text-slate-700 font-medium">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">security</span> 
                  Bảo mật dữ liệu 100%
                </li>
                <li className="flex items-center gap-3 text-[13px] text-slate-700 font-medium">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">medical_information</span> 
                  Phác đồ điều trị cá nhân
                </li>
              </ul>
            </div>
          )}
        </div>

      </section>

      {/* Bottom Section */}
      <section className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 mt-32">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-10 text-center">Đội ngũ chuyên gia sẵn sàng hỗ trợ</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {doctorsData?.items.slice(0, 2).map((doctor) => (
            <div key={doctor.userId} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <img src={doctor.avatarUrl || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=200&auto=format&fit=crop'} alt={doctor.fullName} className="w-16 h-16 rounded-xl object-cover bg-slate-100" />
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">{doctor.professionalTitle ? `${doctor.professionalTitle} ` : ''}{doctor.fullName}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{doctor.specialties[0]?.name || 'Chuyên gia Y tế'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-amber-400 mb-6">
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
              </div>
              <Link href={`/doctors/${doctor.userId}`} className="block w-full text-center bg-primary/10 text-primary font-bold py-2.5 rounded-lg hover:bg-primary hover:text-white transition-colors text-sm">
                ĐẶT LỊCH TƯ VẤN
              </Link>
            </div>
          ))}

          {(!doctorsData || doctorsData.items.length < 2) && Array.from({length: 2 - (doctorsData?.items.length || 0)}).map((_, i) => (
            <div key={`skeleton-${i}`} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm animate-pulse">
               <div className="flex items-center gap-4 mb-4">
                 <div className="w-16 h-16 rounded-xl bg-slate-200" />
                 <div className="space-y-2 flex-1">
                   <div className="h-5 bg-slate-200 rounded w-3/4" />
                   <div className="h-3 bg-slate-200 rounded w-1/2" />
                 </div>
               </div>
               <div className="h-4 bg-slate-200 rounded w-1/2 mb-6" />
               <div className="h-10 bg-slate-200 rounded w-full" />
            </div>
          ))}

          {/* Location Banner */}
          <div className="bg-primary rounded-2xl p-6 text-white shadow-md shadow-primary/20 relative overflow-hidden flex flex-col justify-center">
            <div className="absolute right-0 bottom-0 opacity-20 translate-x-4 translate-y-4">
               <span className="material-symbols-outlined text-[120px]">map</span>
            </div>
            <div className="relative z-10">
               <h3 className="font-bold text-xl mb-3 leading-tight">Tìm kiếm bác sĩ theo vị trí?</h3>
               <p className="text-sm text-white/80 leading-relaxed mb-6">
                 Chúng tôi hỗ trợ kết nối hơn 5,000 phòng khám trên toàn quốc.
               </p>
               <span className="material-symbols-outlined text-[32px] opacity-80">map</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
