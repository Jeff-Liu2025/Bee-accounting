import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Transaction, MerchantMapping } from '@/types';
import { STORAGE_KEYS } from '@/constants';
import { generateId, getToday, isThisMonth } from '@/utils';
import { setTransactionStoreRef } from './budgetStore';

function matchMerchant(merchantName: string, transactionNote: string): boolean {
  if (!merchantName || !transactionNote) return false;
  const normalizedMerchant = merchantName.toLowerCase().trim();
  const normalizedNote = transactionNote.toLowerCase().trim();
  return normalizedNote.includes(normalizedMerchant) || normalizedMerchant.includes(normalizedNote);
}

interface TransactionState {
  transactions: Transaction[];
  deletedTransactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  addTransactions: (transactionList: Omit<Transaction, 'id'>[]) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  undoDeleteTransaction: () => void;
  permanentlyDeleteTransaction: (id: string) => void;
  clearDeletedAfterTimeout: (id: string, delay: number) => void;
  getTodayTransactions: () => Transaction[];
  getMonthTransactions: (month?: string) => Transaction[];
  getTodayTotal: () => { income: number; expense: number };
  getMonthTotal: (month?: string) => { income: number; expense: number };
  getCategoryTotal: (month?: string) => Record<string, number>;
  getTransactionsByPage: (page: number, pageSize: number) => Transaction[];
  getTotalPages: (pageSize: number) => number;
  applyMerchantMappings: (merchantMappings: MerchantMapping[]) => { updatedCount: number; matchedIds: string[] };
  findMatchingTransactions: (merchantName: string) => Transaction[];
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      deletedTransactions: [],
      
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
        set((state) => {
          const transactionToDelete = state.transactions.find((t) => t.id === id);
          if (!transactionToDelete) return state;
          return {
            transactions: state.transactions.filter((t) => t.id !== id),
            deletedTransactions: [transactionToDelete, ...state.deletedTransactions],
          };
        });
      },

      undoDeleteTransaction: () => {
        set((state) => {
          const [lastDeleted, ...rest] = state.deletedTransactions;
          if (!lastDeleted) return state;
          return {
            transactions: [lastDeleted, ...state.transactions],
            deletedTransactions: rest,
          };
        });
      },

      permanentlyDeleteTransaction: (id) => {
        set((state) => ({
          deletedTransactions: state.deletedTransactions.filter((t) => t.id !== id),
        }));
      },

      clearDeletedAfterTimeout: (id, delay) => {
        setTimeout(() => {
          get().permanentlyDeleteTransaction(id);
        }, delay);
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

      getTransactionsByPage: (page, pageSize) => {
        const sorted = [...get().transactions].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const start = (page - 1) * pageSize;
        return sorted.slice(start, start + pageSize);
      },

      getTotalPages: (pageSize) => {
        return Math.max(1, Math.ceil(get().transactions.length / pageSize));
      },
      
      findMatchingTransactions: (merchantName) => {
        const { transactions } = get();
        return transactions.filter((t) => matchMerchant(merchantName, t.note || ''));
      },
      
      applyMerchantMappings: (merchantMappings) => {
        const { transactions } = get();
        const matchedIds: string[] = [];
        let updatedCount = 0;
        
        const updatedTransactions = transactions.map((t) => {
          if (!t.note) return t;
          
          for (const mapping of merchantMappings) {
            if (matchMerchant(mapping.merchantName, t.note)) {
              if (t.category !== mapping.category || t.type !== mapping.type) {
                matchedIds.push(t.id);
                updatedCount++;
                return {
                  ...t,
                  category: mapping.category,
                  type: mapping.type,
                };
              }
              break;
            }
          }
          return t;
        });
        
        set({ transactions: updatedTransactions });
        return { updatedCount, matchedIds };
      },
    }),
    {
      name: STORAGE_KEYS.TRANSACTIONS,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        transactions: state.transactions,
      }),
    }
  )
);

setTransactionStoreRef(() => useTransactionStore.getState());
