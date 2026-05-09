import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Budget, CategoryBudget } from '@/types';
import { STORAGE_KEYS } from '@/constants';
import { generateId, getCurrentMonth } from '@/utils';

interface BudgetState {
  budgets: Budget[];
  getCurrentBudget: () => Budget | undefined;
  setBudget: (totalAmount: number, categoryBudgets: CategoryBudget[]) => void;
  getBudgetUsage: (month?: string) => { used: number; total: number; percentage: number };
  getCategoryBudgetUsage: (month?: string) => Record<string, { used: number; total: number; percentage: number }>;
}

let transactionStoreGetState: (() => { getMonthTotal: (month?: string) => { income: number; expense: number }; getCategoryTotal: (month?: string) => Record<string, number> }) | null = null;

export const setTransactionStoreRef = (getState: typeof transactionStoreGetState) => {
  transactionStoreGetState = getState;
};

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      budgets: [],
      
      getCurrentBudget: () => {
        const currentMonth = getCurrentMonth();
        return get().budgets.find((b) => b.month === currentMonth);
      },
      
      setBudget: (totalAmount, categoryBudgets) => {
        const currentMonth = getCurrentMonth();
        const existingBudget = get().budgets.find((b) => b.month === currentMonth);
        
        if (existingBudget) {
          set((state) => ({
            budgets: state.budgets.map((b) =>
              b.month === currentMonth
                ? {
                    ...b,
                    totalAmount,
                    categoryBudgets: categoryBudgets || [],
                    updatedAt: new Date().toISOString(),
                  }
                : b
            ),
          }));
        } else {
          const newBudget: Budget = {
            id: generateId(),
            totalAmount,
            month: currentMonth,
            categoryBudgets: categoryBudgets || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set((state) => ({
            budgets: [...state.budgets, newBudget],
          }));
        }
      },
      
      getBudgetUsage: (month) => {
        const targetMonth = month || getCurrentMonth();
        const budget = get().budgets.find((b) => b.month === targetMonth);
        if (!budget) {
          return { used: 0, total: 0, percentage: 0 };
        }
        
        let used = 0;
        if (transactionStoreGetState) {
          const monthTotal = transactionStoreGetState().getMonthTotal(targetMonth);
          used = monthTotal.expense;
        }
        
        const total = budget.totalAmount || 0;
        const percentage = total > 0 ? Math.min((used / total) * 100, 100) : 0;
        
        return { used, total, percentage };
      },
      
      getCategoryBudgetUsage: (month) => {
        const targetMonth = month || getCurrentMonth();
        const budget = get().budgets.find((b) => b.month === targetMonth);
        if (!budget || !budget.categoryBudgets || budget.categoryBudgets.length === 0) {
          return {};
        }
        
        let categoryTotal: Record<string, number> = {};
        if (transactionStoreGetState) {
          categoryTotal = transactionStoreGetState().getCategoryTotal(targetMonth);
        }
        
        const result: Record<string, { used: number; total: number; percentage: number }> = {};
        
        budget.categoryBudgets.forEach((cb) => {
          if (cb && cb.category && cb.amount > 0) {
            const used = categoryTotal[cb.category] || 0;
            const total = cb.amount;
            const percentage = total > 0 ? Math.min((used / total) * 100, 100) : 0;
            result[cb.category] = { used, total, percentage };
          }
        });
        
        return result;
      },
    }),
    {
      name: STORAGE_KEYS.BUDGET,
    }
  )
);
