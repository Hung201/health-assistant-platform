'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatMessage, RecommendationOption, useChatStore } from '@/stores/chat.store';
import { Paperclip, Send, AlertTriangle, History, FileText, ChevronRight, Bot, User as UserIcon, PlusCircle, MapPin, Phone, Building2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const FALLBACK_RECOMMENDATION_OPTIONS: RecommendationOption[] = [
  {
    id: 'doctor',
    label: 'Gợi ý bác sĩ uy tín',
    message: 'Tôi muốn được gợi ý bác sĩ uy tín phù hợp với tình trạng hiện tại.',
  },
  {
    id: 'facility',
    label: 'Bệnh viện/phòng khám gần tôi',
    message: 'Tôi muốn xem các bệnh viện, phòng khám gần tôi.',
  },
];

export default function AIAssistantPage() {
  const [input, setInput] = useState('');
  const [location, setLocation] = useState('');
  const messages = useChatStore((s) => s.messages);
  const isLoading = useChatStore((s) => s.isLoading);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const finalResult = useChatStore((s) => s.finalResult);
  const doctorRecommendations = useChatStore((s) => s.doctorRecommendations);
  const hospitalSuggestion = useChatStore((s) => s.hospitalSuggestion);
  const resetChat = useChatStore((s) => s.resetChat);
  const sessions = useChatStore((s) => s.sessions);
  const fetchSessions = useChatStore((s) => s.fetchSessions);
  const loadSession = useChatStore((s) => s.loadSession);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleRecommendationOptionClick = async (option: RecommendationOption) => {
    if (isLoading) return;
    await sendMessage(option.message, location);
  };

  const displayMessages: ChatMessage[] = messages.length > 0 ? messages : [
    {
      role: 'assistant',
      content: 'Chào bạn, tôi là Clinical AI. Hãy mô tả các triệu chứng bạn đang gặp phải để tôi có thể hỗ trợ phân tích và gợi ý bác sĩ chuyên khoa phù hợp cho bạn.',
      timestamp: new Date().toISOString(),
    },
  ];
  // Fallback buttons đã được backend quản lý thời điểm hiện (chỉ sau khi có location)
  // Frontend chỉ hiện khi backend gửi recommendation_options trong message
  const shouldShowFallbackRecommendationPrompt = false;

  const formatRating = (value?: number) => {
    const rating = Number(value ?? 0);
    if (!Number.isFinite(rating) || rating <= 0) return 'Chưa có';
    return rating.toFixed(1);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6">
      {/* ── Left Column: Chat Area ── */}
      <div className="flex flex-[2] flex-col rounded-2xl bg-white shadow-sm border border-[#E8EDF2] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8EDF2] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#0D9E75] animate-pulse" />
            <h2 className="font-bold text-[#1a3353]">AI Assistant Trực Tuyến</h2>
          </div>
          <button
            onClick={() => resetChat()}
            className="flex items-center gap-2 rounded-xl border border-[#E8EDF2] bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-all hover:bg-[#E8F8F2] hover:border-[#0D9E75]/30 hover:text-[#0D9E75]"
          >
            <PlusCircle size={18} />
            Phiên mới
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {displayMessages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                  msg.role === 'user' ? 'bg-[#E8F8F2] text-[#0D9E75]' : 'bg-[#0D9E75] text-white'
                }`}
              >
                {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
              </div>
              <div
                className={`rounded-2xl px-5 py-4 text-sm max-w-[80%] shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-[#1a3353] text-white rounded-tr-none'
                    : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                {msg.role === 'assistant' && msg.recommendationOptions && msg.recommendationOptions.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {msg.recommendationOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleRecommendationOptionClick(option)}
                        disabled={isLoading}
                        className="rounded-full border border-[#0D9E75]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#0D9E75] transition-colors hover:bg-[#0D9E75] hover:text-white disabled:opacity-50"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {shouldShowFallbackRecommendationPrompt && (
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0D9E75] text-white">
                <Bot size={16} />
              </div>
              <div className="rounded-2xl px-5 py-4 text-sm max-w-[80%] shadow-sm bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-none">
                <p className="whitespace-pre-wrap leading-relaxed">
                  Bạn muốn tôi gợi ý Bác sĩ uy tín (kèm thông tin bác sĩ và địa chỉ khám) hay các bệnh viện, phòng khám gần bạn?
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {FALLBACK_RECOMMENDATION_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleRecommendationOptionClick(option)}
                      disabled={isLoading}
                      className="rounded-full border border-[#0D9E75]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#0D9E75] transition-colors hover:bg-[#0D9E75] hover:text-white disabled:opacity-50"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Hospital Suggestion Inline trong Chat ── */}
          {hospitalSuggestion && hospitalSuggestion.hospitals?.length > 0 && !isLoading && (
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0D9E75] text-white">
                <Building2 size={16} />
              </div>
              <div className="rounded-2xl px-5 py-4 text-sm max-w-[85%] shadow-sm bg-gradient-to-br from-[#E8F8F2] to-white border border-[#0D9E75]/20 rounded-tl-none">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={14} className="text-[#0D9E75]" />
                  <p className="font-bold text-[#1a3353] text-sm">Cơ sở y tế gần {hospitalSuggestion.location_used}</p>
                </div>
                <p className="text-xs text-slate-500 mb-4">Bán kính tìm kiếm: {hospitalSuggestion.search_radius_km}km • {hospitalSuggestion.hospitals.length} kết quả</p>
                <div className="space-y-2.5">
                  {hospitalSuggestion.hospitals.slice(0, 5).map((hospital, idx) => (
                    <div key={idx} className="rounded-xl border border-[#E8EDF2] bg-white p-3 transition-all hover:shadow-md hover:border-[#0D9E75]/30">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-[#1a3353] leading-tight">{hospital.name}</p>
                          {hospital.address && (
                            <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                              <MapPin size={11} className="shrink-0 mt-0.5 text-slate-400" />
                              {hospital.address}
                            </p>
                          )}
                          {hospital.phone && (
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <Phone size={11} className="shrink-0 text-slate-400" />
                              {hospital.phone}
                            </p>
                          )}
                        </div>
                        {hospital.amenity_type && (
                          <span className="shrink-0 rounded-full bg-[#0D9E75]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0D9E75] uppercase">
                            {hospital.amenity_type === 'hospital' ? 'Bệnh viện' : hospital.amenity_type === 'clinic' ? 'Phòng khám' : hospital.amenity_type === 'dentist' ? 'Nha khoa' : hospital.amenity_type}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {hospitalSuggestion.hospitals.length > 5 && (
                  <p className="text-xs text-slate-400 mt-3 text-center italic">... và {hospitalSuggestion.hospitals.length - 5} cơ sở khác</p>
                )}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0D9E75] text-white">
                <Bot size={16} />
              </div>
              <div className="rounded-2xl rounded-tl-none bg-slate-50 border border-slate-100 px-5 py-4">
                <div className="flex gap-1.5">
                  <div className="size-1.5 animate-bounce rounded-full bg-slate-400" />
                  <div className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.2s]" />
                  <div className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-[#E8EDF2] p-4 bg-[#F7FAFB]">
          <form onSubmit={handleSend} className="relative flex items-center">
            <button type="button" className="absolute left-4 text-slate-400 hover:text-[#0D9E75] transition-colors">
              <Paperclip size={20} />
            </button>
            <input
              type="text"
              placeholder="Nhập triệu chứng của bạn..."
              className="w-full rounded-xl border border-[#E8EDF2] bg-white py-4 pl-12 pr-24 text-sm outline-none transition-all focus:border-[#0D9E75] focus:ring-2 focus:ring-[#0D9E75]/15 shadow-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 flex items-center gap-2 rounded-lg bg-[#0D9E75] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#0B8A65] disabled:opacity-50"
            >
              Gửi <Send size={16} className="ml-1" />
            </button>
          </form>
        </div>
      </div>

      {/* ── Right Column: Diagnostics & History ── */}
      <div className="flex flex-[1] flex-col gap-6">
        {/* Diagnostics Card */}
        {finalResult ? (
          <div className="rounded-2xl bg-white shadow-sm border-l-4 border-l-[#0D9E75] border border-[#E8EDF2] p-6 flex flex-col">
            <h3 className="text-lg font-bold text-[#1a3353] mb-1">Kết quả chẩn đoán dự kiến</h3>
            <p className="text-xs text-slate-500 mb-6">Dựa trên các triệu chứng được cung cấp</p>
            <div className="space-y-5 mb-8">
              {finalResult.top_diseases.map((disease, idx) => {
                const percentage = Math.round(disease.match_score * 100);
                const bars = ['bg-[#0D9E75]', 'bg-[#1a3353]/50', 'bg-slate-300'];
                return (
                  <div key={idx}>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-bold text-slate-800">{disease.disease}</span>
                      <span className={`text-lg font-bold ${idx === 0 ? 'text-[#0D9E75]' : 'text-slate-500'}`}>{percentage}%</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${bars[idx % bars.length]}`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex gap-3 mb-4">
              <AlertTriangle className="text-red-500 shrink-0" size={20} />
              <p className="text-xs font-semibold text-red-700 leading-relaxed italic">
                {finalResult.disclaimer || 'Kết quả chỉ mang tính tham khảo. AI không thay thế chẩn đoán chuyên môn của bác sĩ.'}
              </p>
            </div>
            {doctorRecommendations && doctorRecommendations.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-bold text-[#1a3353] mb-3">Bác sĩ chuyên khoa gợi ý:</h4>
                <div className="space-y-3">
                  {doctorRecommendations.map((doc: any, idx: number) => (
                    <Link
                      key={idx}
                      href={`/patient/doctors/${doc.userId}`}
                      className="group flex items-center justify-between rounded-xl border border-[#E8EDF2] p-3 bg-[#F7FAFB] hover:border-[#0D9E75]/30 hover:bg-[#E8F8F2]/50 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#1a3353] group-hover:text-[#0D9E75] transition-colors">{doc.fullName}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{doc.professionalTitle || doc.specialties?.[0]?.name || 'Bác sĩ'}</p>
                        {doc.workplaceName && <p className="text-xs text-slate-500 mt-1 truncate">{doc.workplaceName}</p>}
                        <p className="text-xs text-amber-600 mt-1">★ {formatRating(doc.ratingAverage)} ({doc.ratingCount ?? 0} đánh giá)</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5 ml-2">
                        <span className="rounded-lg bg-[#0D9E75] px-3 py-1.5 text-xs font-bold text-white group-hover:bg-[#0B8A65] transition-colors">
                          Đặt lịch
                        </span>
                        <ArrowRight size={14} className="text-slate-400 group-hover:text-[#0D9E75] group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-white shadow-sm border border-[#E8EDF2] p-6 flex flex-col items-center justify-center text-center h-48">
            <Bot size={40} className="text-[#0D9E75]/30 mb-3" />
            <h3 className="text-sm font-bold text-slate-500">Chưa có kết quả chẩn đoán</h3>
            <p className="text-xs text-slate-400 mt-1">Hãy tiếp tục trò chuyện để AI thu thập thêm thông tin.</p>
          </div>
        )}

        {/* History Card */}
        <div className="rounded-2xl bg-white shadow-sm border border-[#E8EDF2] p-6 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1a3353]">LỊCH SỬ PHIÊN HỎI</h3>
            <History size={18} className="text-[#0D9E75]" />
          </div>
          <div className="space-y-3 overflow-y-auto pr-1">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => loadSession(session.id)}
                  className="group flex items-center justify-between rounded-xl border border-[#E8EDF2] p-4 transition-all hover:border-[#0D9E75]/20 hover:bg-[#F7FAFB] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E8F8F2] text-[#0D9E75] group-hover:bg-[#0D9E75]/15 transition-colors">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1a3353] line-clamp-1">{session.title || 'Phiên trò chuyện'}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{new Date(session.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-[#0D9E75] transition-colors" />
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
