'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/stores/chat.store';

export default function AIAssistantPage() {
  const [input, setInput] = useState('');
  const [location, setLocation] = useState('');
  const messages = useChatStore((s) => s.messages);
  const isLoading = useChatStore((s) => s.isLoading);
  const hospitalSuggestion = useChatStore((s) => s.hospitalSuggestion);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const resetChat = useChatStore((s) => s.resetChat);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const text = input;
    setInput('');
    await sendMessage(text, location);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col gap-4 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Trợ lý sức khỏe AI
          </h2>
          <p className="text-sm text-slate-500">
            Tư vấn triệu chứng và tìm kiếm cơ sở y tế gần bạn.
          </p>
        </div>
        <button
          onClick={resetChat}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Làm mới hội thoại
        </button>
      </header>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Main Chat Area */}
        <div className="relative flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 space-y-4 overflow-y-auto p-4 scroll-smooth"
          >
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center opacity-60">
                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <span className="material-symbols-outlined text-4xl">chat_bubble</span>
                </div>
                <h3 className="text-lg font-semibold">Bắt đầu trò chuyện</h3>
                <p className="max-w-xs text-sm">
                  Hãy mô tả các triệu chứng bạn đang gặp phải (VD: "Tôi bị đau đầu và ho kéo dài").
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                    <p className={`mt-1 text-[10px] opacity-70 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-slate-100 px-4 py-3 text-slate-800 rounded-tl-none border border-slate-200">
                  <div className="flex gap-1">
                    <div className="size-1.5 animate-bounce rounded-full bg-slate-400"></div>
                    <div className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.2s]"></div>
                    <div className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-100 p-4 bg-slate-50/50">
            <div className="mb-3 flex items-center gap-2">
               <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">location_on</span>
                  <input
                    type="text"
                    placeholder="Vị trí của bạn (VD: Quận 1, TP.HCM)..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
               </div>
            </div>
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập triệu chứng tại đây..."
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-inner transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex size-11 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar Suggestions Area */}
        {hospitalSuggestion && (
          <div className="w-80 space-y-4 overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-blue-700">
                <span className="material-symbols-outlined text-[20px]">medical_services</span>
                <span className="text-sm font-bold uppercase tracking-wider">Gợi ý từ AI 🏥</span>
              </div>
              <p className="mb-4 text-xs font-medium text-slate-600 leading-relaxed">
                {hospitalSuggestion.invitation_text}
              </p>
              
              <div className="space-y-3">
                {hospitalSuggestion.hospitals.map((h, i) => (
                  <div key={i} className="rounded-xl border border-white bg-white/80 p-3 shadow-sm hover:shadow-md transition-shadow">
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
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 uppercase">
                        {h.amenity_type || 'Bệnh viện'}
                      </span>
                      {h.specialty && (
                        <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700">
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
            
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-900 text-xs">
              <p className="font-bold flex items-center gap-1 mb-1 text-amber-700">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                Lưu ý quan trọng:
              </p>
              Gợi ý của AI chỉ mang tính tham khảo sơ bộ. Nếu bạn gặp các triệu chứng cấp cứu (đau ngực, khó thở...), hãy gọi ngay 115 hoặc đến cơ sở y tế gần nhất.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
