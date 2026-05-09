import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Transaction } from '@/types';
import { STORAGE_KEYS } from '@/constants';
import { generateId, getToday, isThisMonth } from '@/utils';
import { setTransactionStoreRef } from './budgetStore';

interface TransactionState {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  addTransactions: (transactionList: Omit<Transaction, 'id'>[]) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getTodayTransactions: () => Transaction[];
  getMonthTransactions: (month?: string) => Transaction[];
  getTodayTotal: () => { income: number; expense: number };
  getMonthTotal: (month?: string) => { income: number; expense: number };
  getCategoryTotal: (month?: string) => Record<string, number>;
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      
      addTransaction: (transaction) => {
        const newTransaction: Transaction = {
          ...transaction,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          transactions: [newTransaction, ...state.transactions],
        }));
      },

      addTransactions: (transactionList) => {
        const newTransactions: Transaction[] = transactionList.map(t => ({
          ...t,
          id: generateId(),
          createdAt: t.createdAt || new Date().toISOString(),
        }));
        set((state) => ({
          transactions: [...newTransactions, ...state.transactions],
        }));
      },
      
      updateTransaction: (id, transaction) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...transaction } : t
          ),
        }));
      },
      
      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));
      },
      
      getTodayTransactions: () => {
        const today = getToday();
        return get().transactions.filter((t) => t.date === today);
      },
      
      getMonthTransactions: (month) => {
        const targetMonth = month || new Date().toISOString().slice(0, 7);
        return get().transactions.filter((t) => {
          if (!t.date) return false;
          return t.date.startsWith(targetMonth);
        });
      },
      
      getTodayTotal: () => {
        const todayTransactions = get().getTodayTransactions();
        return todayTransactions.reduce(
          (acc, t) => {
            if (t.type === 'income') {
              acc.income += t.amount;
            } else {
              acc.expense += t.amount;
            }
            return acc;
          },
          { income: 0, expense: 0 }
        );
      },
      
      getMonthTotal: (month) => {
        const monthTransactions = get().getMonthTransactions(month);
        return monthTransactions.reduce(
          (acc, t) => {
            if (t.type === 'income') {
              acc.income += t.amount;
            } else {
              acc.expense += t.amount;
            }
            return acc;
          },
          { income: 0, expense: 0 }
        );
      },
      
      getCategoryTotal: (month) => {
        const monthTransactions = get().getMonthTransactions(month);
        return monthTransactions
          .filter((t) => t.type === 'expense')
          .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
          }, {} as Record<string, number>);
      },
    }),
    {
      name: STORAGE_KEYS.TRANSACTIONS,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

setTransactionStoreRef(() => useTransactionStore.getState());
