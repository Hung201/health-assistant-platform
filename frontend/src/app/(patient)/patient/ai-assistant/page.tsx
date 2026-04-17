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
          <p className="text-sm text-muted-foreground">
            Tư vấn triệu chứng và tìm kiếm cơ sở y tế gần bạn.
          </p>
        </div>
        <button
          onClick={resetChat}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Làm mới hội thoại
        </button>
      </header>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Main Chat Area */}
        <div className="relative flex flex-1 flex-col rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-4 overflow-y-auto p-4 scroll-smooth"
          >
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center opacity-60">
                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
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
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${msg.role === 'user'
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-muted text-foreground rounded-tl-none border border-border'
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
                <div className="rounded-2xl bg-muted px-4 py-3 text-foreground rounded-tl-none border border-border">
                  <div className="flex gap-1">
                    <div className="size-1.5 animate-bounce rounded-full bg-muted-foreground"></div>
                    <div className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.2s]"></div>
                    <div className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-100 p-4 bg-slate-50/50">
            <div className="mb-1 flex items-center gap-2">
              {/* Thanh địa chỉ đã được loại bỏ để chuyển sang nhận diện qua chat */}
            </div>
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập triệu chứng tại đây..."
                className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-inner transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
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
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[20px]">medical_services</span>
                <span className="text-sm font-bold uppercase tracking-wider">Gợi ý từ AI</span>
              </div>
              <p className="mb-4 text-xs font-medium text-muted-foreground leading-relaxed">
                {hospitalSuggestion.invitation_text}
              </p>

              <div className="space-y-3">
                {hospitalSuggestion.hospitals.map((h, i) => (
                  <div key={i} className="rounded-xl border border-border bg-background/60 p-3 shadow-sm hover:shadow-md transition-shadow">
                    <p className="font-bold text-foreground text-sm">{h.name}</p>
                    <p className="mt-1 flex items-start gap-1 text-[11px] text-muted-foreground">
                      <span className="material-symbols-outlined text-[14px] mt-0.5 text-muted-foreground">location_on</span>
                      {h.address}
                    </p>
                    {h.phone && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <span className="material-symbols-outlined text-[14px] text-muted-foreground">phone</span>
                        {h.phone}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary uppercase">
                        {h.amenity_type || 'Bệnh viện'}
                      </span>
                      {h.specialty && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-bold text-foreground">
                          {h.specialty}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-[10px] italic text-muted-foreground">
                Tìm kiếm trong bán kính {hospitalSuggestion.search_radius_km}km.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-muted p-4 text-foreground text-xs">
              <p className="font-bold flex items-center gap-1 mb-1 text-primary">
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
