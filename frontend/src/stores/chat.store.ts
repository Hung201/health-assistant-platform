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

interface ChatState {
  messages: ChatMessage[];
  sessionId: string | null;
  isLoading: boolean;
  hospitalSuggestion: HospitalSuggestion | null;
  
  // Actions
  sendMessage: (message: string, location?: string) => Promise<void>;
  resetChat: () => void;
  setSessionId: (id: string) => void;
}

const API_URL = 'http://localhost:8000/api/v1/chat/';

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      sessionId: null,
      isLoading: false,
      hospitalSuggestion: null,

      setSessionId: (id) => set({ sessionId: id }),

      resetChat: () => set({ 
        messages: [], 
        sessionId: null, 
        hospitalSuggestion: null 
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
          hospitalSuggestion: null // Clear old suggestions
        });

        try {
          // 2. Call AI Service API
          const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              session_id: currentSessionId,
              message: message,
              history: [], // History is now managed by backend, but schema might still require it
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
