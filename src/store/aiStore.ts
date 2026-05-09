import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage } from '@/types';
import { STORAGE_KEYS } from '@/constants';
import { generateId } from '@/utils';

interface AIState {
  chatHistory: ChatMessage[];
  isLoading: boolean;
  addUserMessage: (content: string) => ChatMessage;
  addAssistantMessage: (content: string) => ChatMessage;
  setLoading: (loading: boolean) => void;
  clearHistory: () => void;
}

export const useAIStore = create<AIState>()(
  persist(
    (set) => ({
      chatHistory: [],
      isLoading: false,
      
      addUserMessage: (content) => {
        const message: ChatMessage = {
          id: generateId(),
          role: 'user',
          content,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          chatHistory: [...state.chatHistory, message],
        }));
        return message;
      },
      
      addAssistantMessage: (content) => {
        const message: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          chatHistory: [...state.chatHistory, message],
        }));
        return message;
      },
      
      setLoading: (isLoading) => {
        set({ isLoading });
      },
      
      clearHistory: () => {
        set({ chatHistory: [] });
      },
    }),
    {
      name: STORAGE_KEYS.CHAT_HISTORY,
    }
  )
);
