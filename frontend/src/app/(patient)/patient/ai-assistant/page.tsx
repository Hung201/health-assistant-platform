'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { useChatStore } from '@/stores/chat.store';

export default function AIAssistantDashboardPage() {
  const user = useAuthStore((s) => s.user);
  
  const [input, setInput] = useState('');
  const messages = useChatStore((s) => s.messages);
  const isLoading = useChatStore((s) => s.isLoading);
  const hospitalSuggestion = useChatStore((s) => s.hospitalSuggestion);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const resetChat = useChatStore((s) => s.resetChat);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput('');
    await sendMessage(text, '');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 mb-3">
            <span className="material-symbols-outlined text-[16px] text-primary">auto_awesome</span>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">AI Chẩn đoán</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Phân Tích Triệu Chứng AI</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-xl">Hệ thống chẩn đoán sơ bộ thông minh. Hãy mô tả triệu chứng của bạn để nhận phân tích y tế tức thì.</p>
        </div>
        <button
          onClick={resetChat}
          className="relative z-10 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors shadow-sm mt-4 sm:mt-0"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Làm mới
        </button>
      </header>

      {/* 3 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col */}
        <div className="lg:col-span-3 space-y-6">
          {hospitalSuggestion ? (
             <div className="bg-primary/5 rounded-2xl border border-primary/20 p-5 shadow-sm animate-in fade-in slide-in-from-left-4 duration-500">
               <div className="mb-4 flex items-center gap-2 text-primary">
                 <span className="material-symbols-outlined text-[20px]">medical_services</span>
                 <span className="text-sm font-bold uppercase tracking-wider">Gợi ý cơ sở y tế</span>
               </div>
               <p className="mb-4 text-xs font-medium text-slate-700 leading-relaxed">
                 {hospitalSuggestion.invitation_text}
               </p>

               <div className="space-y-3">
                 {hospitalSuggestion.hospitals.map((h, i) => (
                   <div key={i} className="rounded-xl border border-primary/10 bg-white p-3 shadow-sm hover:shadow-md transition-shadow">
                     <p className="font-bold text-slate-900 text-sm">{h.name}</p>
                     <p className="mt-1 flex items-start gap-1 text-[11px] text-slate-500">
                       <span className="material-symbols-outlined text-[14px] mt-0.5">location_on</span>
                       {h.address}
                     </p>
                     {h.phone && (
                       <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                         <span className="material-symbols-outlined text-[14px]">phone</span>
                         {h.phone}
                       </p>
                     )}
                     <div className="mt-3 flex flex-wrap items-center gap-1.5">
                       <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary uppercase">
                         {h.amenity_type || 'Bệnh viện'}
                       </span>
                       {h.specialty && (
                         <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                           {h.specialty}
                         </span>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
               <p className="mt-4 text-[10px] italic text-slate-400">
                 Tìm kiếm trong bán kính {hospitalSuggestion.search_radius_km}km.
               </p>
             </div>
          ) : (
             <>
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
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

                <div className="bg-primary rounded-2xl p-6 text-white relative overflow-hidden shadow-md shadow-primary/20">
                  <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-1/2 translate-y-1/2" />
                  <h3 className="font-bold mb-2">Quyền riêng tư</h3>
                  <p className="text-[13px] text-white/80 leading-relaxed">
                    Dữ liệu được bảo mật và ẩn danh theo tiêu chuẩn y tế quốc tế.
                  </p>
                </div>
             </>
          )}
        </div>

        {/* Middle Col (Chat) */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 flex flex-col h-[650px] overflow-hidden">
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

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50" ref={scrollRef}>
              {messages.length === 0 ? (
                 <div className="flex h-full flex-col items-center justify-center text-center opacity-60">
                   <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                     <span className="material-symbols-outlined text-4xl">chat_bubble</span>
                   </div>
                   <h3 className="text-lg font-bold text-slate-800">Bắt đầu trò chuyện</h3>
                   <p className="max-w-xs text-sm text-slate-500 mt-2">
                     Hãy mô tả các triệu chứng bạn đang gặp phải (VD: "Tôi bị đau đầu và ho kéo dài").
                   </p>
                 </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white mt-1 ${msg.role === 'user' ? 'bg-slate-800' : 'bg-primary/20 text-primary'}`}>
                      <span className="material-symbols-outlined text-[16px]">{msg.role === 'user' ? 'person' : 'smart_toy'}</span>
                    </div>
                    <div className={`p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm border ${
                      msg.role === 'user' 
                        ? 'bg-primary text-white border-primary rounded-tr-sm' 
                        : 'bg-white border-slate-200 text-slate-700 rounded-tl-sm whitespace-pre-wrap'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}

              {isLoading && (
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

            <div className="p-4 bg-white border-t border-slate-100">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập thêm triệu chứng..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-[15px]"
                  disabled={isLoading}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-3 text-slate-400 hover:text-primary transition-colors disabled:opacity-50 disabled:hover:text-slate-400 p-2"
                >
                  <span className="material-symbols-outlined text-[24px]">send</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Col */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm border-l-4 border-l-primary relative overflow-hidden">
            <h3 className="font-bold text-lg text-slate-900 mb-1">Kết quả chẩn đoán dự kiến</h3>
            <p className="text-xs text-slate-500 mb-6">Dựa trên các triệu chứng được cung cấp</p>
            
            {messages.length === 0 ? (
               <div className="py-8 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                     <span className="material-symbols-outlined">analytics</span>
                  </div>
                  <p className="text-sm text-slate-500">Hãy bắt đầu trò chuyện để nhận phân tích.</p>
               </div>
            ) : (
               <div className="space-y-5 mb-6 animate-in fade-in duration-700">
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
            )}

            <div className="bg-red-50 text-red-700 p-4 rounded-xl flex gap-3 items-start mb-6 border border-red-100">
               <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">warning</span>
               <p className="text-[11px] font-medium italic leading-relaxed">
                 Kết quả chỉ mang tính tham khảo. AI không thay thế chẩn đoán chuyên môn của bác sĩ. Vui lòng đến cơ sở y tế gần nhất nếu triệu chứng trầm trọng.
               </p>
            </div>

            <Link href="/patient/doctors" className="flex items-center justify-center gap-2 w-full bg-primary/10 text-primary font-bold py-3.5 rounded-xl hover:bg-primary hover:text-white transition-colors text-sm">
              <span className="material-symbols-outlined text-[18px]">person_search</span>
              Tìm bác sĩ phù hợp
            </Link>
          </div>

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

      </div>
    </div>
  );
}
