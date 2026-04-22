import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface HospitalResult {
  name: string;
  address: string;
  phone: string | null;
  specialty: string | null;
  amenity_type: string | null;
}

export interface HospitalSuggestion {
  invitation_text: string;
  hospitals: HospitalResult[];
  search_radius_km: number;
  location_used: string;
}

export interface DiseaseCandidate {
  rank: number;
  disease: string;
  match_score: number;
  reasoning: string;
  suggested_specialty: string;
}

export interface DiagnosticResult {
  disclaimer: string;
  top_diseases: DiseaseCandidate[];
  emergency_warning: string | null;
  general_advice: string;
}

interface ChatState {
  messages: ChatMessage[];
  sessionId: string | null;
  isLoading: boolean;
  hospitalSuggestion: HospitalSuggestion | null;
  finalResult: DiagnosticResult | null;
  doctorRecommendations: any[] | null;
  
  // Actions
  sendMessage: (message: string, location?: string) => Promise<void>;
  resetChat: () => void;
  setSessionId: (id: string) => void;
}

const API_URL = '/api/ai/chat';

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      sessionId: null,
      isLoading: false,
      hospitalSuggestion: null,
      finalResult: null,
      doctorRecommendations: null,

      setSessionId: (id) => set({ sessionId: id }),

      resetChat: () => set({ 
        messages: [], 
        sessionId: null, 
        hospitalSuggestion: null,
        finalResult: null,
        doctorRecommendations: null,
      }),

      sendMessage: async (message: string, location?: string) => {
        const currentMessages = get().messages;
        const currentSessionId = get().sessionId;
        
        // 1. Add user message locally
        const userMsg: ChatMessage = {
          role: 'user',
          content: message,
          timestamp: new Date().toISOString()
        };
        
        set({ 
          messages: [...currentMessages, userMsg],
          isLoading: true,
          hospitalSuggestion: null, // Clear old suggestions
          finalResult: null,
          doctorRecommendations: null,
        });

        try {
          // 2. Call backend AI proxy so the request carries the authenticated user cookie.
          const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              session_id: currentSessionId,
              message: message,
              user_location: location || null
            }),
          });

          if (!response.ok) {
            throw new Error('Không thể kết nối tới dịch vụ AI');
          }

          const data = await response.json();

          // 3. Update store with AI reply
          const aiMsg: ChatMessage = {
            role: 'assistant',
            content: data.reply,
            timestamp: new Date().toISOString()
          };

          set({
            messages: [...get().messages, aiMsg],
            sessionId: data.session_id,
            hospitalSuggestion: data.hospital_suggestion,
            finalResult: data.final_result,
            doctorRecommendations: data.doctor_recommendations,
            isLoading: false
          });
        } catch (error) {
          console.error('Lỗi khi gửi tin nhắn:', error);
          const errorMsg: ChatMessage = {
            role: 'assistant',
            content: 'Xin lỗi, tôi đang gặp trục trặc kỹ thuật. Vui lòng thử lại sau giây lát!',
            timestamp: new Date().toISOString()
          };
          set({
            messages: [...get().messages, errorMsg],
            isLoading: false
          });
        }
      },
    }),
    {
      name: 'health-assistant-chat', // Key to persist in localStorage
      partialize: (state) => ({ 
        messages: state.messages, 
        sessionId: state.sessionId 
      }),
    }
  )
);
