export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  note?: string;
  date: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  totalAmount: number;
  month: string;
  categoryBudgets: CategoryBudget[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryBudget {
  id: string;
  category: string;
  amount: number;
}

export interface Settings {
  theme: 'light' | 'dark';
  reminderEnabled: boolean;
  reminderFrequency: 'weekly' | 'monthly';
  deepseekApiKey?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ParsedTransaction {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  note: string;
  date: string;
  confidence: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'income' | 'expense';
}

export type TransactionType = 'income' | 'expense';

export interface DailyStats {
  date: string;
  income: number;
  expense: number;
}

export interface CategoryStats {
  category: string;
  amount: number;
  percentage: number;
}
