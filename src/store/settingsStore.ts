import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings } from '@/types';
import { STORAGE_KEYS } from '@/constants';

interface SettingsState extends Settings {
  setTheme: (theme: 'light' | 'dark') => void;
  setReminderEnabled: (enabled: boolean) => void;
  setReminderFrequency: (frequency: 'weekly' | 'monthly') => void;
  setApiKey: (apiKey: string) => void;
  clearApiKey: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      reminderEnabled: false,
      reminderFrequency: 'weekly',
      deepseekApiKey: '',
      
      setTheme: (theme) => {
        set({ theme });
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      
      setReminderEnabled: (reminderEnabled) => {
        set({ reminderEnabled });
      },
      
      setReminderFrequency: (reminderFrequency) => {
        set({ reminderFrequency });
      },
      
      setApiKey: (deepseekApiKey) => {
        set({ deepseekApiKey });
      },
      
      clearApiKey: () => {
        set({ deepseekApiKey: '' });
      },
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
    }
  )
);
