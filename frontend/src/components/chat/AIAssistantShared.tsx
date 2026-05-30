'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatMessage, RecommendationOption, useChatStore } from '@/stores/chat.store';
import {
  Send, AlertTriangle, History, FileText, ChevronRight,
  Bot, User as UserIcon, PlusCircle, MapPin, Phone, Building2,
  ArrowRight, Stethoscope, X, Lock
} from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';

/* ── Quick symptom chips shown before first message ── */
const QUICK_SYMPTOMS = [
  { emoji: '🤕', label: 'Đau đầu' },
  { emoji: '🌡️', label: 'Sốt cao' },
  { emoji: '😮‍💨', label: 'Ho khan' },
  { emoji: '😴', label: 'Mệt mỏi' },
  { emoji: '🤢', label: 'Buồn nôn' },
  { emoji: '💊', label: 'Đau bụng' },
];

export function AIAssistantShared() {
  const [input, setInput] = useState('');
  const [location] = useState('');
  const [bottomSheetTab, setBottomSheetTab] = useState<'closed' | 'diagnosis' | 'history'>('closed');
  const [atBottom, setAtBottom] = useState(true);

  const user = useAuthStore((s) => s.user);

  const messages     = useChatStore((s) => s.messages);
  const isLoading    = useChatStore((s) => s.isLoading);
  const sendMessage  = useChatStore((s) => s.sendMessage);
  const finalResult  = useChatStore((s) => s.finalResult);
  const doctorRecommendations = useChatStore((s) => s.doctorRecommendations);
  const hospitalSuggestion    = useChatStore((s) => s.hospitalSuggestion);
  const resetChat    = useChatStore((s) => s.resetChat);
  const sessions     = useChatStore((s) => s.sessions);
  const fetchSessions = useChatStore((s) => s.fetchSessions);
  const loadSession  = useChatStore((s) => s.loadSession);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only fetch sessions if logged in
    if (user) {
      fetchSessions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /* Auto-scroll only when user is near bottom */
  useEffect(() => {
    if (atBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, atBottom]);

  /* Lock body scroll when bottom sheet is open */
  useEffect(() => {
    if (bottomSheetTab !== 'closed') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [bottomSheetTab]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setAtBottom(scrollHeight - scrollTop - clientHeight < 60);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput('');
    setAtBottom(true);
    await sendMessage(text, location);
  };

  const handleQuickChip = async (label: string) => {
    if (isLoading) return;
    setAtBottom(true);
    await sendMessage(label, location);
  };

  const handleRecommendationOptionClick = async (option: RecommendationOption) => {
    if (isLoading) return;
    setAtBottom(true);
    await sendMessage(option.message, location);
  };

  const displayMessages: ChatMessage[] = messages.length > 0 ? messages : [
    {
      role: 'assistant',
      content: 'Chào bạn! Tôi là Clinical AI 👋\n\nHãy mô tả triệu chứng bạn đang gặp phải — tôi sẽ hỗ trợ phân tích và gợi ý bác sĩ chuyên khoa phù hợp.',
      timestamp: new Date().toISOString(),
    },
  ];

  const formatRating = (value?: number) => {
    const rating = Number(value ?? 0);
    if (!Number.isFinite(rating) || rating <= 0) return 'Chưa có';
    return rating.toFixed(1);
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  const hasDiagnosis = Boolean(finalResult);

  /* ── Shared panel: Diagnosis ── */
  const DiagnosisContent = () => {
    if (!user) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0D9E75]/8 mb-4">
            <Lock size={32} className="text-[#0D9E75]/40" />
          </div>
          <h3 className="text-sm font-bold text-[#1a3353]">Mở khóa chẩn đoán</h3>
          <p className="text-xs text-slate-400 mt-1.5 max-w-[200px] leading-relaxed mb-4">
            Đăng nhập để xem kết quả phân tích sơ bộ từ AI chuyên gia.
          </p>
          <Link href="/login" className="rounded-xl bg-[#0D9E75] px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#0B8A65] shadow-sm">
            Đăng nhập ngay
          </Link>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        {finalResult ? (
          <>
            <div className="space-y-4">
              {finalResult.top_diseases.map((disease, idx) => {
                const pct = Math.round(disease.match_score * 100);
                const colors: [string, string][] = [
                  ['#0D9E75', '#1BAF7C'],
                  ['#1a3353', '#254b7a'],
                  ['#94A3B8', '#CBD5E1'],
                ];
                const [c1, c2] = colors[idx % colors.length];
                return (
                  <div key={idx}>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-bold text-slate-800">{disease.disease}</span>
                      <span className="text-base font-bold" style={{ color: c1 }}>{pct}%</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${c1}, ${c2})` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl border border-red-100 bg-red-50 p-3 flex gap-2.5">
              <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={15} />
              <p className="text-xs font-semibold text-red-700 leading-relaxed italic">
                {finalResult.disclaimer || 'Kết quả chỉ mang tính tham khảo. AI không thay thế chẩn đoán của bác sĩ.'}
              </p>
            </div>

            {doctorRecommendations && doctorRecommendations.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Bác sĩ gợi ý</p>
                <div className="space-y-2.5">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {doctorRecommendations.map((doc: any, idx: number) => (
                    <Link
                      key={idx}
                      href={`/patient/doctors/${doc.userId}`}
                      onClick={() => setBottomSheetTab('closed')}
                      className="group flex items-center justify-between rounded-xl border border-[#E8EDF2] p-3 bg-[#F7FAFB] hover:border-[#0D9E75]/30 hover:bg-[#E8F8F2]/50 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#1a3353] group-hover:text-[#0D9E75] transition-colors">
                          {doc.fullName}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {doc.professionalTitle || doc.specialties?.[0]?.name || 'Bác sĩ'}
                        </p>
                        {doc.workplaceName && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{doc.workplaceName}</p>
                        )}
                        <p className="text-xs text-amber-500 mt-1">
                          ★ {formatRating(doc.ratingAverage)} ({doc.ratingCount ?? 0} đánh giá)
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5 ml-2">
                        <span className="rounded-lg bg-[#0D9E75] px-3 py-1.5 text-xs font-bold text-white">
                          Đặt lịch
                        </span>
                        <ArrowRight size={13} className="text-slate-400 group-hover:text-[#0D9E75] transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0D9E75]/8 mb-4">
              <Bot size={32} className="text-[#0D9E75]/40" />
            </div>
            <h3 className="text-sm font-bold text-slate-500">Chưa có kết quả chẩn đoán</h3>
            <p className="text-xs text-slate-400 mt-1.5 max-w-[200px] leading-relaxed">
              Hãy tiếp tục trò chuyện để AI thu thập thêm thông tin.
            </p>
          </div>
        )}
      </div>
    );
  };

  /* ── Shared panel: History ── */
  const HistoryContent = () => {
    if (!user) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0D9E75]/8 mb-4">
            <Lock size={32} className="text-[#0D9E75]/40" />
          </div>
          <h3 className="text-sm font-bold text-[#1a3353]">Mở khóa lịch sử</h3>
          <p className="text-xs text-slate-400 mt-1.5 max-w-[200px] leading-relaxed mb-4">
            Đăng nhập để tự động lưu và xem lại lịch sử các phiên hỏi.
          </p>
          <Link href="/login" className="rounded-xl bg-[#0D9E75] px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#0B8A65] shadow-sm">
            Đăng nhập ngay
          </Link>
        </div>
      );
    }

    return (
      <div className="space-y-2.5">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => { loadSession(session.id); setBottomSheetTab('closed'); }}
              className="w-full group flex items-center justify-between rounded-xl border border-[#E8EDF2] p-3 transition-all hover:border-[#0D9E75]/20 hover:bg-[#F7FAFB] cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F8F2] text-[#0D9E75] group-hover:bg-[#0D9E75]/15 transition-colors">
                  <FileText size={15} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1a3353] line-clamp-1">{session.title || 'Phiên trò chuyện'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(session.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
              <ChevronRight size={15} className="text-slate-300 group-hover:text-[#0D9E75] transition-colors shrink-0" />
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <History size={36} className="text-slate-200 mb-3" />
            <p className="text-xs text-slate-400">Chưa có lịch sử phiên hỏi.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="ai-assistant-wrapper flex flex-col lg:flex-row gap-5">
      {/* ══════════════════════════════════════════
          LEFT / MAIN: Chat Area
      ══════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-[2] h-[580px] lg:h-auto rounded-2xl bg-white shadow-sm border border-[#E8EDF2] overflow-hidden min-w-0">

        {/* ── Chat Header ── */}
        <div className="flex items-center justify-between border-b border-[#E8EDF2] px-4 py-3 sm:px-5 shrink-0 bg-white/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {/* Animated bot avatar */}
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0D9E75] to-[#0B8A65] text-white shadow-md shrink-0">
              <Bot size={17} />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-[#1a3353] text-sm leading-tight">AI Assistant Trực Tuyến</h2>
              <p className="text-[10px] text-[#0D9E75] font-semibold tracking-wide">● Đang hoạt động</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile: Panel buttons — show diagnosis & history sheets */}
            <button
              onClick={() => setBottomSheetTab(bottomSheetTab === 'diagnosis' ? 'closed' : 'diagnosis')}
              className={`relative lg:hidden flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                bottomSheetTab === 'diagnosis'
                  ? 'bg-[#0D9E75] border-[#0D9E75] text-white'
                  : 'border-[#E8EDF2] bg-white text-slate-600 hover:border-[#0D9E75]/30 hover:text-[#0D9E75]'
              }`}
              aria-label="Chẩn đoán"
            >
              <Stethoscope size={13} />
              <span className="hidden xs:inline sm:inline">Chẩn đoán</span>
              {hasDiagnosis && bottomSheetTab !== 'diagnosis' && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#0D9E75] text-[9px] font-bold text-white ring-2 ring-white">
                  !
                </span>
              )}
            </button>
            <button
              onClick={() => setBottomSheetTab(bottomSheetTab === 'history' ? 'closed' : 'history')}
              className={`lg:hidden flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                bottomSheetTab === 'history'
                  ? 'bg-[#1a3353] border-[#1a3353] text-white'
                  : 'border-[#E8EDF2] bg-white text-slate-600 hover:border-[#0D9E75]/30 hover:text-[#0D9E75]'
              }`}
              aria-label="Lịch sử"
            >
              <History size={13} />
              <span className="hidden xs:inline sm:inline">Lịch sử</span>
            </button>

            {/* New session */}
            <button
              onClick={() => resetChat()}
              className="flex items-center gap-1.5 rounded-xl border border-[#E8EDF2] bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition-all hover:bg-[#E8F8F2] hover:border-[#0D9E75]/30 hover:text-[#0D9E75]"
            >
              <PlusCircle size={13} />
              <span className="hidden sm:inline">Phiên mới</span>
            </button>
          </div>
        </div>

        {/* ── Messages area ── */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5"
        >
          {displayMessages.map((msg, idx) => (
            <div key={idx} className={`flex gap-2.5 sm:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-[#E8F8F2] text-[#0D9E75]'
                    : 'bg-gradient-to-br from-[#0D9E75] to-[#0B8A65] text-white'
                }`}
              >
                {msg.role === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
              </div>

              {/* Bubble */}
              <div className={`flex flex-col gap-1 max-w-[82%] sm:max-w-[76%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'ai-bubble-user text-white rounded-tr-md'
                      : 'ai-bubble-bot rounded-tl-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Recommendation chips inside message */}
                  {msg.role === 'assistant' && msg.recommendationOptions && msg.recommendationOptions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.recommendationOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleRecommendationOptionClick(opt)}
                          disabled={isLoading}
                          className="quick-chip"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Timestamp */}
                {msg.timestamp && (
                  <span className="text-[10px] text-slate-400 px-1 select-none">{formatTime(msg.timestamp)}</span>
                )}
              </div>
            </div>
          ))}

          {/* Hospital suggestion card inline */}
          {hospitalSuggestion && hospitalSuggestion.hospitals?.length > 0 && !isLoading && (
            <div className="flex gap-2.5 sm:gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0D9E75] to-[#0B8A65] text-white shadow-sm">
                <Building2 size={14} />
              </div>
              <div className="rounded-2xl rounded-tl-md px-4 py-4 text-sm max-w-[88%] shadow-sm bg-gradient-to-br from-[#E8F8F2] to-white border border-[#0D9E75]/20">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={13} className="text-[#0D9E75] shrink-0" />
                  <p className="font-bold text-[#1a3353] text-sm">Cơ sở y tế gần {hospitalSuggestion.location_used}</p>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Bán kính {hospitalSuggestion.search_radius_km}km • {hospitalSuggestion.hospitals.length} kết quả
                </p>
                <div className="space-y-2">
                  {hospitalSuggestion.hospitals.slice(0, 5).map((hospital, idx) => (
                    <div key={idx} className="rounded-xl border border-[#E8EDF2] bg-white p-2.5 hover:shadow-sm hover:border-[#0D9E75]/30 transition-all">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-[#1a3353]">{hospital.name}</p>
                          {hospital.address && (
                            <p className="text-xs text-slate-500 mt-0.5 flex items-start gap-1">
                              <MapPin size={10} className="shrink-0 mt-0.5 text-slate-400" />
                              {hospital.address}
                            </p>
                          )}
                          {hospital.phone && (
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <Phone size={10} className="shrink-0 text-slate-400" />
                              {hospital.phone}
                            </p>
                          )}
                        </div>
                        {hospital.amenity_type && (
                          <span className="shrink-0 rounded-full bg-[#0D9E75]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0D9E75] uppercase">
                            {hospital.amenity_type === 'hospital' ? 'BV'
                              : hospital.amenity_type === 'clinic' ? 'PK'
                              : hospital.amenity_type === 'dentist' ? 'NK'
                              : hospital.amenity_type}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {hospitalSuggestion.hospitals.length > 5 && (
                  <p className="text-xs text-slate-400 mt-2.5 text-center italic">
                    ... và {hospitalSuggestion.hospitals.length - 5} cơ sở khác
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Wave typing indicator */}
          {isLoading && (
            <div className="flex gap-2.5 sm:gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0D9E75] to-[#0B8A65] text-white shadow-sm">
                <Bot size={14} />
              </div>
              <div className="rounded-2xl rounded-tl-md ai-bubble-bot px-4 py-3.5 shadow-sm">
                <div className="typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}

          {/* Quick symptom chips — only before first real message */}
          {messages.length === 0 && !isLoading && (
            <div className="pt-2 pb-1">
              <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider mb-3">
                Chọn nhanh triệu chứng
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_SYMPTOMS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => handleQuickChip(s.label)}
                    disabled={isLoading}
                    className="quick-chip-lg"
                  >
                    <span role="img" aria-label={s.label}>{s.emoji}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Input bar ── */}
        <div className="shrink-0 border-t border-[#E8EDF2] bg-white px-3 py-3 sm:px-4 sm:py-3.5"
          style={{ paddingBottom: 'max(0.875rem, env(safe-area-inset-bottom, 0px))' }}
        >
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Mô tả triệu chứng của bạn..."
              className="flex-1 rounded-2xl border border-[#E8EDF2] bg-[#F7FAFB] px-4 py-3 text-sm outline-none transition-all focus:border-[#0D9E75] focus:bg-white focus:ring-2 focus:ring-[#0D9E75]/12 placeholder:text-slate-400"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0D9E75] to-[#0B8A65] text-white shadow-md transition-all hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:shadow-sm active:scale-95"
              aria-label="Gửi"
            >
              <Send size={16} strokeWidth={2.5} />
            </button>
          </form>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT: Side panels (below chat on mobile, side-by-side on desktop)
      ══════════════════════════════════════════ */}
      <div className="flex flex-col gap-4 min-w-0 w-full lg:flex-[1]">

        {/* Diagnosis card */}
        <div className="rounded-2xl bg-white shadow-sm border border-[#E8EDF2] p-5 flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100/80">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0D9E75]/15 to-[#0D9E75]/5">
              <Stethoscope size={17} className="text-[#0D9E75]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1a3353]">Kết quả chẩn đoán</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Dựa trên triệu chứng của bạn</p>
            </div>
            {hasDiagnosis && user && (
              <span className="ml-auto flex h-5 items-center rounded-full bg-[#0D9E75] px-2 text-[9px] font-bold text-white uppercase tracking-wider">
                Mới
              </span>
            )}
          </div>
          <DiagnosisContent />
        </div>

        {/* History card */}
        <div className="rounded-2xl bg-white shadow-sm border border-[#E8EDF2] p-5 flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100/80 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50">
              <History size={16} className="text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-[#1a3353]">Lịch sử phiên hỏi</h3>
            {sessions.length > 0 && user && (
              <span className="ml-auto text-xs font-bold text-slate-400">{sessions.length}</span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            <HistoryContent />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MOBILE BOTTOM SHEET (diagnosis + history)
      ══════════════════════════════════════════ */}
      {bottomSheetTab !== 'closed' && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Đóng"
            className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[2px]"
            onClick={() => setBottomSheetTab('closed')}
          />

          {/* Sheet panel */}
          <div
            className="lg:hidden fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl bg-white shadow-2xl bottom-sheet-slide-up"
            style={{ maxHeight: '82dvh' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-0 shrink-0">
              <div className="h-1.5 w-12 rounded-full bg-slate-200" />
            </div>

            {/* Sheet header with tabs */}
            <div className="flex items-center justify-between px-5 pt-3 pb-3 shrink-0 border-b border-slate-100">
              <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
                <button
                  onClick={() => setBottomSheetTab('diagnosis')}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                    bottomSheetTab === 'diagnosis'
                      ? 'bg-white text-[#0D9E75] shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Stethoscope size={12} />
                  Chẩn đoán
                  {hasDiagnosis && user && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0D9E75]" />
                  )}
                </button>
                <button
                  onClick={() => setBottomSheetTab('history')}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                    bottomSheetTab === 'history'
                      ? 'bg-white text-[#1a3353] shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <History size={12} />
                  Lịch sử
                </button>
              </div>
              <button
                onClick={() => setBottomSheetTab('closed')}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Sheet scrollable content */}
            <div
              className="flex-1 overflow-y-auto p-5"
              style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
            >
              {bottomSheetTab === 'diagnosis' ? <DiagnosisContent /> : <HistoryContent />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
