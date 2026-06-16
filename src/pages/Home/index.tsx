import { useMemo, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, TrendingDown, Wallet, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useTransactionStore, useBudgetStore, useSettingsStore } from '@/store';
import { TransactionItem, AIButton, ConfirmDialog } from '@/components';
import { formatMoney, getCurrentMonth, getToday } from '@/utils';
import { cn } from '@/utils';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import type { Transaction } from '@/types';

export default function Home() {
  const navigate = useNavigate();
  const transactions = useTransactionStore((state) => state.transactions);
  const updateTransaction = useTransactionStore((state) => state.updateTransaction);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);
  const undoDeleteTransaction = useTransactionStore((state) => state.undoDeleteTransaction);
  const permanentlyDeleteTransaction = useTransactionStore((state) => state.permanentlyDeleteTransaction);
  const budgets = useBudgetStore((state) => state.budgets);
  const deleteConfirmation = useSettingsStore((state) => state.deleteConfirmation);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [recentDisplayCount, setRecentDisplayCount] = useState(5);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastTransactionId, setToastTransactionId] = useState<string>('');
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const shiftDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const [pullRefreshLoading, setPullRefreshLoading] = useState(false);
  const [pullRefreshDistance, setPullRefreshDistance] = useState(0);
  const pullRef = useRef<HTMLDivElement>(null);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const swipeHandlers = useSwipeGesture(isMobile ? {
    onSwipeLeft: () => shiftDate(1),
    onSwipeRight: () => shiftDate(-1),
    threshold: 50,
  } : {});

  const pullStartY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const PULL_THRESHOLD = 80;

  const formatDateDisplay = (date: string) => {
    const today = getToday();
    if (date === today) return '今日概览';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (date === yesterdayStr) return '昨日概览';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    if (date === tomorrowStr) return '明日概览';
    return `${date.slice(5)} 概览`;
  };

  const selectedDateTransactions = useMemo(() => {
    return transactions.filter((t) => t.date === selectedDate);
  }, [transactions, selectedDate]);

  const selectedDateTotal = useMemo(() => {
    return selectedDateTransactions.reduce(
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
  }, [selectedDateTransactions]);

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

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, recentDisplayCount);
  }, [transactions, recentDisplayCount]);

  const hasMoreTransactions = transactions.length > recentDisplayCount;

  const handleTransactionSave = (updatedTransaction: Transaction) => {
    updateTransaction(updatedTransaction.id, updatedTransaction);
  };

  const showUndoToast = (id: string) => {
    setToastTransactionId(id);
    setToastVisible(true);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      permanentlyDeleteTransaction(id);
      setToastVisible(false);
      setToastTransactionId('');
    }, 3000);
  };

  const handleUndoDelete = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    undoDeleteTransaction();
    setToastVisible(false);
    setToastTransactionId('');
  };

  const handleTransactionDelete = (id: string) => {
    if (deleteConfirmation) {
      setDeleteTargetId(id);
      setDeleteDialogOpen(true);
    } else {
      deleteTransaction(id);
      showUndoToast(id);
    }
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      deleteTransaction(deleteTargetId);
      showUndoToast(deleteTargetId);
      setDeleteTargetId(null);
    }
    setDeleteDialogOpen(false);
  };

  return (
    <div className="min-h-screen">
      <div
        className="bg-gradient-to-br from-yellow-400 via-yellow-300 to-orange-400 px-4 pt-12 pb-8 rounded-b-3xl"
        onTouchStart={(e) => {
          if (!isMobile) return;
          if (window.scrollY === 0) {
            pullStartY.current = e.touches[0].clientY;
          }
        }}
        onTouchMove={(e) => {
          if (!isMobile) return;
          if (pullStartY.current > 0) {
            const diff = e.touches[0].clientY - pullStartY.current;
            if (diff > 0) {
              setPullDistance(Math.min(diff * 0.5, 120));
            }
          }
        }}
        onTouchEnd={() => {
          if (!isMobile) return;
          if (pullDistance >= PULL_THRESHOLD) {
            setIsRefreshing(true);
            setPullDistance(0);
            // 模拟刷新：短暂延迟后重置
            setTimeout(() => {
              setIsRefreshing(false);
            }, 800);
          } else {
            setPullDistance(0);
          }
          pullStartY.current = 0;
        }}
      >
        {pullDistance > 0 && (
          <div
            className="flex items-center justify-center transition-all"
            style={{ height: pullDistance }}
          >
            <div className={`w-8 h-8 rounded-full border-2 border-white/60 flex items-center justify-center ${
              isRefreshing || pullDistance >= PULL_THRESHOLD ? 'bg-white/20' : ''
            }`}>
              {isRefreshing ? (
                <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
              ) : (
                <div
                  className="w-4 h-4"
                  style={{
                    transform: `rotate(${pullDistance * 2}deg)`,
                    transition: 'none'
                  }}
                >
                  ↓
                </div>
              )}
            </div>
          </div>
        )}
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
          <div
            className="flex items-center justify-between mb-3 select-none"
            {...swipeHandlers}
          >
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {formatDateDisplay(selectedDate)}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => shiftDate(-1)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="opacity-0 absolute inset-0 w-full cursor-pointer"
                />
                <button className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Calendar className="w-3.5 h-3.5" />
                  {selectedDate.slice(5)}
                </button>
              </div>
              <button
                onClick={() => shiftDate(1)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
              <p className="text-xs text-green-600 dark:text-green-400 mb-1">
                {selectedDate === getToday() ? '今日收入' : '收入'}
              </p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatMoney(selectedDateTotal.income)}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
              <p className="text-xs text-red-600 dark:text-red-400 mb-1">
                {selectedDate === getToday() ? '今日支出' : '支出'}
              </p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                {formatMoney(selectedDateTotal.expense)}
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
            {hasMoreTransactions && (
              <button
                onClick={() => setRecentDisplayCount((prev) => prev + 5)}
                className="w-full py-3 text-sm text-yellow-500 hover:text-yellow-600 font-medium"
              >
                查看更多
              </button>
            )}
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

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="删除记录"
        message="确定要删除这条交易记录吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      {toastVisible && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 dark:bg-gray-700 text-white px-4 py-3 rounded-xl shadow-lg">
          <span className="text-sm">交易已删除</span>
          <button
            onClick={handleUndoDelete}
            className="text-sm font-medium text-yellow-400 hover:text-yellow-300"
          >
            撤销
          </button>
        </div>
      )}
    </div>
  );
}
