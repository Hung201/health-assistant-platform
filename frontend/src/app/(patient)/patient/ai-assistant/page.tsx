'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/stores/chat.store';
import { Paperclip, Send, AlertTriangle, UserSearch, History, FileText, ChevronRight, Bot, User as UserIcon } from 'lucide-react';

export default function AIAssistantPage() {
  const [input, setInput] = useState('');
  const [location, setLocation] = useState('');
  const messages = useChatStore((s) => s.messages);
  const isLoading = useChatStore((s) => s.isLoading);
  const sendMessage = useChatStore((s) => s.sendMessage);

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

  // Default mock messages if store is empty (to match design)
  const displayMessages = messages.length > 0 ? messages : [
    {
      role: 'assistant',
      content: 'Chào bạn, tôi là Clinical AI. Hãy mô tả các triệu chứng bạn đang gặp phải hoặc tải lên kết quả xét nghiệm để tôi hỗ trợ phân tích ban đầu.',
      timestamp: new Date().toISOString()
    },
    {
      role: 'user',
      content: 'Tôi cảm thấy đau tức ngực trái âm ỉ khoảng 2 ngày nay, thỉnh thoảng thấy khó thở khi leo cầu thang.',
      timestamp: new Date().toISOString()
    },
    {
      role: 'assistant',
      content: 'Cảm ơn thông tin của bạn. Ngoài đau ngực, bạn có thấy vã mồ hôi, buồn nôn hay đau lan ra cánh tay trái không? Độ tuổi hiện tại của bạn là bao nhiêu?',
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
            <span className="h-2 w-2 rounded-full bg-teal-500"></span>
            <h2 className="font-bold text-slate-800">AI Assistant Trực Tuyến</h2>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold tracking-wider text-slate-500">
            PHIÊN: #DX-2024
          </div>
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
        <div className="rounded-2xl bg-white shadow-sm border-l-4 border-l-[#003f87] border-y border-r border-slate-200 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-[#003f87] mb-1">Kết quả chẩn đoán dự kiến</h3>
          <p className="text-xs text-slate-500 mb-6">Dựa trên các triệu chứng được cung cấp</p>

          <div className="space-y-5 mb-8">
            {/* Progress Item 1 */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-slate-800">Đau thắt ngực (Angina)</span>
                <span className="text-lg font-bold text-[#003f87]">65%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-[#003f87]" style={{ width: '65%' }}></div>
              </div>
            </div>
            {/* Progress Item 2 */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-slate-800">Rối loạn lo âu</span>
                <span className="text-lg font-bold text-slate-600">25%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-slate-400" style={{ width: '25%' }}></div>
              </div>
            </div>
            {/* Progress Item 3 */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-slate-800">Trào ngược dạ dày</span>
                <span className="text-lg font-bold text-slate-600">10%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-slate-300" style={{ width: '10%' }}></div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex gap-3 mb-6">
            <AlertTriangle className="text-red-500 shrink-0" size={20} />
            <p className="text-xs font-semibold text-red-700 leading-relaxed italic">
              Kết quả chỉ mang tính tham khảo. AI không thay thế chẩn đoán chuyên môn của bác sĩ. Vui lòng đến cơ sở y tế gần nhất nếu triệu chứng trầm trọng.
            </p>
          </div>

          <button className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-100/50 py-3.5 text-sm font-bold text-[#003f87] transition-all hover:bg-indigo-100">
            <UserSearch size={18} />
            Tìm bác sĩ chuyên khoa phù hợp
          </button>
        </div>

        {/* History Card */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Lịch sử phiên hỏi</h3>
            <History size={18} className="text-[#003f87]" />
          </div>

          <div className="space-y-3 overflow-y-auto pr-2">
            {[
              { title: 'Đau ngực & Khó thở', date: '15/03/2024' },
              { title: 'Nhức đầu kéo dài', date: '12/03/2024' },
              { title: 'Ho khan về đêm', date: '08/03/2024' },
            ].map((item, idx) => (
              <div key={idx} className="group flex items-center justify-between rounded-xl border border-slate-100 p-4 transition-all hover:border-[#003f87]/20 hover:bg-slate-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#003f87] group-hover:bg-[#003f87]/10 transition-colors">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{item.date}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-[#003f87] transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
