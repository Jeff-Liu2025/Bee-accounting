import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useTransactionStore, useBudgetStore } from '@/store';
import { TransactionItem, AIButton } from '@/components';
import { formatMoney, getCurrentMonth, getToday } from '@/utils';
import { cn } from '@/utils';
import type { Transaction } from '@/types';

export default function Home() {
  const navigate = useNavigate();
  const transactions = useTransactionStore((state) => state.transactions);
  const updateTransaction = useTransactionStore((state) => state.updateTransaction);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);
  const budgets = useBudgetStore((state) => state.budgets);

  const todayTransactions = useMemo(() => {
    const today = getToday();
    return transactions.filter((t) => t.date === today);
  }, [transactions]);

  const todayTotal = useMemo(() => {
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
  }, [todayTransactions]);

  const monthTotal = useMemo(() => {
    const currentMonth = getCurrentMonth();
    const monthTransactions = transactions.filter((t) => t.date && t.date.startsWith(currentMonth));
    if (monthTransactions.length > 0) {
      return {
        income: monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        expense: monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
        isCurrentMonth: true,
      };
    }
    return {
      income: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      expense: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      isCurrentMonth: false,
    };
  }, [transactions]);

  const budgetUsage = useMemo(() => {
    const currentMonth = getCurrentMonth();
    const budget = budgets.find((b) => b.month === currentMonth);
    if (!budget) {
      return { used: monthTotal.expense, total: 0, percentage: 0 };
    }
    const used = monthTotal.expense;
    const total = budget.totalAmount || 0;
    const percentage = total > 0 ? Math.min((used / total) * 100, 100) : 0;
    return { used, total, percentage };
  }, [budgets, monthTotal.expense]);

  const recentTransactions = transactions.slice(0, 5);

  const handleTransactionSave = (updatedTransaction: Transaction) => {
    updateTransaction(updatedTransaction.id, updatedTransaction);
  };

  const handleTransactionDelete = (id: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      deleteTransaction(id);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-yellow-400 via-yellow-300 to-orange-400 px-4 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black">蜜蜂记账</h1>
            <p className="text-black/60 text-sm mt-1">记录每一笔，积累财富</p>
          </div>
          <AIButton />
        </div>

        <div className="bg-black/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="text-center mb-4">
            <p className="text-black/60 text-sm">{monthTotal.isCurrentMonth ? '本月结余' : '累计结余'}</p>
            <p className="text-3xl font-bold text-black">
              {formatMoney(monthTotal.income - monthTotal.expense)}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-xs text-black/60">收入</span>
              </div>
              <p className="font-semibold text-black">{formatMoney(monthTotal.income)}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-xs text-black/60">支出</span>
              </div>
              <p className="font-semibold text-black">{formatMoney(monthTotal.expense)}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Wallet className="w-4 h-4 text-black" />
                <span className="text-xs text-black/60">预算</span>
              </div>
              <p className="font-semibold text-black">{formatMoney(budgetUsage.total)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 dark:text-white">今日概览</h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">{getCurrentMonth()}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
              <p className="text-xs text-green-600 dark:text-green-400 mb-1">今日收入</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatMoney(todayTotal.income)}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
              <p className="text-xs text-red-600 dark:text-red-400 mb-1">今日支出</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                {formatMoney(todayTotal.expense)}
              </p>
            </div>
          </div>

          {budgetUsage.total > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">预算使用</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {budgetUsage.percentage.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    budgetUsage.percentage >= 100
                      ? 'bg-red-500'
                      : budgetUsage.percentage >= 80
                      ? 'bg-orange-500'
                      : 'bg-yellow-400'
                  )}
                  style={{ width: `${Math.min(budgetUsage.percentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                已使用 {formatMoney(budgetUsage.used)} / {formatMoney(budgetUsage.total)}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 mt-6">
        {transactions.length === 0 && budgetUsage.total === 0 && (
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-4 mb-4 text-white">
            <h3 className="font-semibold mb-2">欢迎使用蜜蜂记账！</h3>
            <p className="text-sm text-white/80 mb-3">建议先设置月度预算，再导入账单数据</p>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/budget')}
                className="flex-1 py-2 bg-white text-purple-600 rounded-lg text-sm font-medium"
              >
                设置预算
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="flex-1 py-2 bg-white/20 text-white rounded-lg text-sm font-medium"
              >
                导入数据
              </button>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">最近交易</h2>
          <button
            onClick={() => navigate('/stats')}
            className="text-sm text-yellow-500 hover:text-yellow-600"
          >
            查看全部
          </button>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="space-y-2">
            {recentTransactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                editable
                onSave={handleTransactionSave}
                onDelete={handleTransactionDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl">
            <p className="text-gray-400 dark:text-gray-500">暂无交易记录</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">点击下方按钮开始记账</p>
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/add')}
        className="fixed right-4 bottom-24 w-14 h-14 bg-yellow-400 hover:bg-yellow-500 rounded-full shadow-lg shadow-yellow-400/30 flex items-center justify-center transition-all duration-200 active:scale-95"
      >
        <Plus className="w-7 h-7 text-black" />
      </button>
    </div>
  );
}
