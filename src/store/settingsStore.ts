import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings, CustomCategory, MerchantMapping } from '@/types';
import { STORAGE_KEYS } from '@/constants';
import { generateId } from '@/utils';

interface SettingsState extends Settings {
  customCategories: CustomCategory[];
  merchantMappings: MerchantMapping[];
  reminderTime: string;
  lastBackupDate: string;
  backupFrequency: 'never' | 'weekly' | 'monthly';
  deleteConfirmation: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  setReminderEnabled: (enabled: boolean) => void;
  setReminderFrequency: (frequency: 'weekly' | 'monthly') => void;
  setReminderTime: (time: string) => void;
  setApiKey: (apiKey: string) => void;
  clearApiKey: () => void;
  setDeleteConfirmation: (value: boolean) => void;
  addCustomCategory: (category: Omit<CustomCategory, 'id' | 'createdAt' | 'isCustom'>) => void;
  updateCustomCategory: (id: string, category: Partial<CustomCategory>) => void;
  deleteCustomCategory: (id: string) => void;
  addMerchantMapping: (mapping: Omit<MerchantMapping, 'id' | 'createdAt'>) => void;
  updateMerchantMapping: (id: string, mapping: Partial<MerchantMapping>) => void;
  deleteMerchantMapping: (id: string) => void;
  findMerchantMapping: (merchantName: string) => MerchantMapping | undefined;
  setLastBackupDate: (date: string) => void;
  setBackupFrequency: (freq: 'never' | 'weekly' | 'monthly') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      reminderEnabled: false,
      reminderFrequency: 'weekly',
      reminderTime: '09:00',
      deepseekApiKey: '',
      customCategories: [],
      merchantMappings: [],
      lastBackupDate: '',
      backupFrequency: 'never',
      deleteConfirmation: true,
      
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
      
      setReminderTime: (reminderTime) => {
        set({ reminderTime });
      },
      
      setApiKey: (deepseekApiKey) => {
        set({ deepseekApiKey });
      },
      
      clearApiKey: () => {
        set({ deepseekApiKey: '' });
      },
      
      setDeleteConfirmation: (deleteConfirmation) => {
        set({ deleteConfirmation });
      },
      
      addCustomCategory: (category) => {
        const newCategory: CustomCategory = {
          ...category,
          id: `custom_${generateId()}`,
          isCustom: true,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          customCategories: [...state.customCategories, newCategory],
        }));
      },
      
      updateCustomCategory: (id, category) => {
        set((state) => ({
          customCategories: state.customCategories.map((c) =>
            c.id === id ? { ...c, ...category } : c
          ),
        }));
      },
      
      deleteCustomCategory: (id) => {
        set((state) => ({
          customCategories: state.customCategories.filter((c) => c.id !== id),
        }));
      },
      
      addMerchantMapping: (mapping) => {
        const newMapping: MerchantMapping = {
          ...mapping,
          id: `merchant_${generateId()}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          merchantMappings: [...state.merchantMappings, newMapping],
        }));
      },
      
      updateMerchantMapping: (id, mapping) => {
        set((state) => ({
          merchantMappings: state.merchantMappings.map((m) =>
            m.id === id ? { ...m, ...mapping } : m
          ),
        }));
      },
      
      deleteMerchantMapping: (id) => {
        set((state) => ({
          merchantMappings: state.merchantMappings.filter((m) => m.id !== id),
        }));
      },
      
      findMerchantMapping: (merchantName) => {
        const { merchantMappings } = get();
        const normalizedName = merchantName.toLowerCase().trim();
        return merchantMappings.find((m) => 
          normalizedName.includes(m.merchantName.toLowerCase().trim()) ||
          m.merchantName.toLowerCase().trim().includes(normalizedName)
        );
      },
      
      setLastBackupDate: (lastBackupDate) => {
        set({ lastBackupDate });
      },
      
      setBackupFrequency: (backupFrequency) => {
        set({ backupFrequency });
      },
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
      onRehydrateStorage: () => (state) => {
        if (state?.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
    }
  )
);
