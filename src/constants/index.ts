import type { Category } from '@/types';

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', name: '餐饮', icon: 'Utensils', type: 'expense' },
  { id: 'transport', name: '交通', icon: 'Car', type: 'expense' },
  { id: 'shopping', name: '购物', icon: 'ShoppingBag', type: 'expense' },
  { id: 'entertainment', name: '娱乐', icon: 'Gamepad2', type: 'expense' },
  { id: 'study', name: '学习', icon: 'Book', type: 'expense' },
  { id: 'daily', name: '日用', icon: 'Home', type: 'expense' },
  { id: 'other', name: '其他', icon: 'MoreHorizontal', type: 'expense' },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'salary', name: '工资', icon: 'Wallet', type: 'income' },
  { id: 'parttime', name: '兼职', icon: 'Briefcase', type: 'income' },
  { id: 'allowance', name: '生活费', icon: 'Gift', type: 'income' },
  { id: 'bonus', name: '奖金', icon: 'Award', type: 'income' },
  { id: 'other_income', name: '其他收入', icon: 'PlusCircle', type: 'income' },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export const getCategoryById = (id: string): Category | undefined => {
  return ALL_CATEGORIES.find(cat => cat.id === id);
};

export const getCategoryName = (id: string): string => {
  const category = getCategoryById(id);
  return category?.name || id;
};

export const COLORS = {
  primary: '#FFD700',
  secondary: '#FFA500',
  success: '#32CD32',
  danger: '#EF4444',
  warning: '#F59E0B',
  background: {
    light: '#FFFFFF',
    dark: '#1A1A1A',
  },
  text: {
    light: '#000000',
    dark: '#FFFFFF',
  },
  ai: {
    gradient: 'from-purple-500 to-indigo-600',
    bg: 'bg-gradient-to-r from-purple-500 to-indigo-600',
  },
};

export const STORAGE_KEYS = {
  TRANSACTIONS: 'bee_accounting_transactions',
  BUDGET: 'bee_accounting_budget',
  SETTINGS: 'bee_accounting_settings',
  CHAT_HISTORY: 'bee_accounting_chat_history',
};

export const DEEPSEEK_CONFIG = {
  baseURL: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat',
};
