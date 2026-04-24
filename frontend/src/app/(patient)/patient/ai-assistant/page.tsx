'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/stores/chat.store';
import { Paperclip, Send, AlertTriangle, UserSearch, History, FileText, ChevronRight, Bot, User as UserIcon, PlusCircle, RotateCcw } from 'lucide-react';

export default function AIAssistantPage() {
  const [input, setInput] = useState('');
  const [location, setLocation] = useState('');
  const messages = useChatStore((s) => s.messages);
  const isLoading = useChatStore((s) => s.isLoading);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const finalResult = useChatStore((s) => s.finalResult);
  const doctorRecommendations = useChatStore((s) => s.doctorRecommendations);
  const resetChat = useChatStore((s) => s.resetChat);
  const sessions = useChatStore((s) => s.sessions);
  const fetchSessions = useChatStore((s) => s.fetchSessions);
  const loadSession = useChatStore((s) => s.loadSession);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

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

  // Default mock messages if store is empty (to match design)
  // Initial welcome message if store is empty
  const displayMessages = messages.length > 0 ? messages : [
    {
      role: 'assistant',
      content: 'Chào bạn, tôi là Clinical AI. Hãy mô tả các triệu chứng bạn đang gặp phải để tôi có thể hỗ trợ phân tích và gợi ý bác sĩ chuyên khoa phù hợp cho bạn.',
      timestamp: new Date().toISOString()
    }
  ];

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6">
      {/* Left Column: Chat Area */}
      <div className="flex flex-[2] flex-col rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
            <h2 className="font-bold text-slate-800">AI Assistant Trực Tuyến</h2>
          </div>
          
          <button 
            onClick={() => resetChat()}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-[#003f87]/30 hover:text-[#003f87]"
          >
            <PlusCircle size={18} />
            Phiên mới
          </button>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {displayMessages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                msg.role === 'user' ? 'bg-[#eefaf8] text-teal-700' : 'bg-[#003f87] text-white'
              }`}>
                {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
              </div>
              <div className={`rounded-2xl px-5 py-4 text-sm max-w-[80%] shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-[#003f87] text-white rounded-tr-none' 
                  : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-none'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#003f87] text-white">
                <Bot size={16} />
              </div>
              <div className="rounded-2xl rounded-tl-none bg-slate-50 border border-slate-100 px-5 py-4">
                <div className="flex gap-1.5">
                  <div className="size-1.5 animate-bounce rounded-full bg-slate-400"></div>
                  <div className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.2s]"></div>
                  <div className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-slate-100 p-4 bg-slate-50/50">
          <form onSubmit={handleSend} className="relative flex items-center">
            <button type="button" className="absolute left-4 text-slate-400 hover:text-teal-600 transition-colors">
              <Paperclip size={20} />
            </button>
            <input
              type="text"
              placeholder="Nhập triệu chứng của bạn..."
              className="w-full rounded-xl border border-slate-200 bg-white py-4 pl-12 pr-24 text-sm outline-none transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-100 shadow-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 flex items-center gap-2 rounded-lg bg-[#003f87] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#0056b3] disabled:opacity-50"
            >
              Gửi <Send size={16} className="ml-1" />
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Diagnostics & History */}
      <div className="flex flex-[1] flex-col gap-6">
        {/* Diagnostics Card */}
        {finalResult ? (
          <div className="rounded-2xl bg-white shadow-sm border-l-4 border-l-[#003f87] border-y border-r border-slate-200 p-6 flex flex-col">
            <h3 className="text-lg font-bold text-[#003f87] mb-1">Kết quả chẩn đoán dự kiến</h3>
            <p className="text-xs text-slate-500 mb-6">Dựa trên các triệu chứng được cung cấp</p>

            <div className="space-y-5 mb-8">
              {finalResult.top_diseases.map((disease, idx) => {
                const percentage = Math.round(disease.match_score * 100);
                const colors = ['bg-[#003f87]', 'bg-slate-400', 'bg-slate-300'];
                return (
                  <div key={idx}>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-bold text-slate-800">{disease.disease}</span>
                      <span className={`text-lg font-bold ${idx === 0 ? 'text-[#003f87]' : 'text-slate-600'}`}>{percentage}%</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${colors[idx % colors.length]}`} style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex gap-3 mb-6">
              <AlertTriangle className="text-red-500 shrink-0" size={20} />
              <p className="text-xs font-semibold text-red-700 leading-relaxed italic">
                {finalResult.disclaimer || 'Kết quả chỉ mang tính tham khảo. AI không thay thế chẩn đoán chuyên môn của bác sĩ.'}
              </p>
            </div>

            {doctorRecommendations && doctorRecommendations.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-bold text-slate-800 mb-3">Bác sĩ chuyên khoa gợi ý:</h4>
                <div className="space-y-3">
                  {doctorRecommendations.map((doc: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 bg-slate-50">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{doc.fullName}</p>
                        <p className="text-xs text-slate-500">{doc.specialties?.[0]?.name || 'Bác sĩ'}</p>
                      </div>
                      <a href={`/patient/doctors/${doc.userId}`} className="rounded-lg bg-[#003f87] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0056b3]">
                        Đặt lịch
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center h-48">
            <Bot size={40} className="text-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-slate-500">Chưa có kết quả chẩn đoán</h3>
            <p className="text-xs text-slate-400 mt-1">Hãy tiếp tục trò chuyện để AI thu thập thêm thông tin.</p>
          </div>
        )}

        {/* History Card */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Lịch sử phiên hỏi</h3>
            <History size={18} className="text-[#003f87]" />
          </div>

          <div className="space-y-3 overflow-y-auto pr-2">
            {sessions.length > 0 ? (
              sessions.map((session, idx) => (
                <div 
                  key={session.id} 
                  onClick={() => loadSession(session.id)}
                  className="group flex items-center justify-between rounded-xl border border-slate-100 p-4 transition-all hover:border-[#003f87]/20 hover:bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#003f87] group-hover:bg-[#003f87]/10 transition-colors">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{session.title || 'Phiên trò chuyện'}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(session.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-[#003f87] transition-colors" />
                </div>
              ))
            ) : (
              <div className="py-10 text-center">
                <p className="text-xs text-slate-400">Chưa có lịch sử phiên hỏi.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
