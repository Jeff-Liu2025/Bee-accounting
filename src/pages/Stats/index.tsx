import { useState, useMemo, useRef, useEffect } from 'react';
import { Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { TrendingUp, TrendingDown, Sparkles, Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTransactionStore, useSettingsStore, useAIStore } from '@/store';
import { AIChatBubble, LoadingDots, TransactionItem, ConfirmDialog } from '@/components';
import { analyzeSpending } from '@/services';
import { formatMoney, getCurrentMonth, getMonthDays } from '@/utils';
import { getCategoryName, getExpenseCategories, getIncomeCategories } from '@/constants';
import { cn } from '@/utils';
import type { Transaction } from '@/types';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CHART_COLORS = [
  '#FFD700', '#FFA500', '#32CD32', '#4169E1',
  '#9370DB', '#FF69B4', '#20B2AA', '#FF6347',
  '#00CED1', '#FF1493', '#7B68EE', '#3CB371',
  '#DC143C', '#00FA9A', '#8A2BE2', '#FF8C00',
];

function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

export default function Stats() {
  const transactions = useTransactionStore((state) => state.transactions);
  const updateTransaction = useTransactionStore((state) => state.updateTransaction);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);
  const undoDeleteTransaction = useTransactionStore((state) => state.undoDeleteTransaction);
  const permanentlyDeleteTransaction = useTransactionStore((state) => state.permanentlyDeleteTransaction);
  const { deepseekApiKey, customCategories, deleteConfirmation } = useSettingsStore();
  const { isLoading, setLoading } = useAIStore();

  const [month, setMonth] = useState(getCurrentMonth());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [statsDisplayCount, setStatsDisplayCount] = useState(20);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDayDetail, setShowDayDetail] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastTransactionId, setToastTransactionId] = useState<string>('');
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const expenseCategories = getExpenseCategories(customCategories);
  const incomeCategories = getIncomeCategories(customCategories);

  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date && t.date.startsWith(month));
  }, [transactions, month]);

  const monthTotal = useMemo(() => {
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
  }, [monthTransactions]);

  const categoryTotal = useMemo(() => {
    return monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
  }, [monthTransactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const noteMatch = t.note?.toLowerCase().includes(query);
        const categoryMatch = getCategoryName(t.category, customCategories).toLowerCase().includes(query);
        const amountMatch = t.amount.toString().includes(query);
        if (!noteMatch && !categoryMatch && !amountMatch) return false;
      }
      return true;
    });
  }, [transactions, filterType, filterCategory, searchQuery, customCategories]);

  const categoryKeys = Object.keys(categoryTotal);
  const pieData = {
    labels: categoryKeys.map((key) => getCategoryName(key, customCategories)),
    datasets: [
      {
        data: Object.values(categoryTotal),
        backgroundColor: categoryKeys.map((_, index) => getChartColor(index)),
        borderWidth: 0,
      },
    ],
  };

  const getDailyData = () => {
    const { start, end } = getMonthDays(month);
    const startDate = new Date(start);
    const endDate = new Date(end);
    const dailyExpenses: Record<string, number> = {};

    for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dailyExpenses[dateStr] = 0;
    }

    monthTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        dailyExpenses[t.date] = (dailyExpenses[t.date] || 0) + t.amount;
      });

    return {
      labels: Object.keys(dailyExpenses).map((d) => d.slice(5)),
      data: Object.values(dailyExpenses),
    };
  };

  const dailyData = getDailyData();

  const dayTransactions = useMemo(() => {
    if (!selectedDate) return [];
    const fullDate = `${month.split('-')[0]}-${selectedDate}`;
    return transactions.filter((t) => t.date === fullDate).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [selectedDate, month, transactions]);

  const dayCategoryTotal = useMemo(() => {
    if (!selectedDate) return {};
    const fullDate = `${month.split('-')[0]}-${selectedDate}`;
    return transactions
      .filter((t) => t.date === fullDate && t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
  }, [selectedDate, month, transactions]);

  const dayIncome = useMemo(() => {
    if (!selectedDate) return 0;
    const fullDate = `${month.split('-')[0]}-${selectedDate}`;
    return transactions
      .filter((t) => t.date === fullDate && t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [selectedDate, month, transactions]);

  const dayPieData = useMemo(() => {
    const keys = Object.keys(dayCategoryTotal);
    if (keys.length === 0) return null;
    return {
      labels: keys.map((key) => getCategoryName(key, customCategories)),
      datasets: [
        {
          data: Object.values(dayCategoryTotal),
          backgroundColor: keys.map((_, index) => getChartColor(index)),
          borderWidth: 0,
        },
      ],
    };
  }, [dayCategoryTotal, customCategories]);

  const lineData = {
    labels: dailyData.labels,
    datasets: [
      {
        label: '支出',
        data: dailyData.data,
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHitRadius: 12,
        pointBackgroundColor: '#FFD700',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 7,
      },
    ],
  };

  const handleAIAnalysis = async () => {
    if (!deepseekApiKey || isLoading) return;

    setLoading(true);
    setAiAnalysis('');
    setShowAIAnalysis(true);

    try {
      await analyzeSpending(deepseekApiKey, monthTransactions, month, (chunk) => {
        setAiAnalysis((prev) => prev + chunk);
      });
    } catch (error) {
      setAiAnalysis('分析失败，请检查API配置或稍后重试');
    } finally {
      setLoading(false);
    }
  };

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

  const shiftMonth = (delta: number) => {
    const [y, m] = month.split('-').map(Number);
    const date = new Date(y, m - 1 + delta, 1);
    setSlideDirection(delta > 0 ? 'right' : 'left');
    setMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    setShowMonthPicker(false);
  };

  const goPrevMonth = () => shiftMonth(-1);
  const goNextMonth = () => shiftMonth(1);
  const goToCurrentMonth = () => {
    setSlideDirection(null);
    setMonth(getCurrentMonth());
    setShowMonthPicker(false);
  };

  const formatMonthLabel = (m: string) => {
    const date = new Date(`${m}-01`);
    return date.toLocaleDateString('zh-CN', { month: 'long' });
  };

  const isCurrentMonth = month === getCurrentMonth();

  const quickMonths = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('zh-CN', { month: 'short', year: 'numeric' }),
      });
    }
    return months;
  }, []);

  const monthPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target as Node)) {
        setShowMonthPicker(false);
      }
    };
    if (showMonthPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMonthPicker]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6">
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(16px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-16px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">统计分析</h1>
        {!isCurrentMonth && (
          <button
            onClick={goToCurrentMonth}
            className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
          >
            回到本月
          </button>
        )}
      </div>

      <div ref={monthPickerRef} className="relative mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <button
              onClick={goPrevMonth}
              className="p-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            </button>

            <button
              onClick={() => setShowMonthPicker(!showMonthPicker)}
              className="flex flex-col items-center cursor-pointer select-none"
            >
              <span className="text-xs text-amber-600/60 dark:text-amber-400/60 font-medium leading-none">
                {month.split('-')[0]}
              </span>
              <span className="text-xl font-bold text-amber-800 dark:text-amber-200 leading-tight mt-0.5">
                {formatMonthLabel(month)}
              </span>
              {isCurrentMonth && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-0.5" />
              )}
            </button>

            <button
              onClick={goNextMonth}
              disabled={isCurrentMonth}
              className="p-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            </button>
          </div>

          {showMonthPicker && (
            <div className="mt-3 grid grid-cols-4 gap-2 border-t border-amber-100 dark:border-amber-900/30 pt-3">
              {quickMonths.map((m) => (
                <button
                  key={m.value}
                  onClick={() => {
                    setSlideDirection(m.value < month ? 'left' : 'right');
                    setMonth(m.value);
                    setShowMonthPicker(false);
                  }}
                  className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                    m.value === month
                      ? 'bg-amber-200 dark:bg-amber-700 text-amber-900 dark:text-amber-100'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        key={month}
        style={{
          animation: slideDirection
            ? `${slideDirection === 'right' ? 'slideInRight' : 'slideInLeft'} 200ms cubic-bezier(0.34, 1.56, 0.64, 1)`
            : 'none',
        }}
      >
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">收入</span>
          </div>
          <p className="text-lg font-bold text-green-500">{formatMoney(monthTotal.income)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">支出</span>
          </div>
          <p className="text-lg font-bold text-red-500">{formatMoney(monthTotal.expense)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">结余</span>
          </div>
          <p
            className={cn(
              'text-lg font-bold',
              monthTotal.income - monthTotal.expense >= 0 ? 'text-green-500' : 'text-red-500'
            )}
          >
            {formatMoney(monthTotal.income - monthTotal.expense)}
          </p>
        </div>
      </div>

      {Object.keys(categoryTotal).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">支出分类</h2>
          <div className="flex items-center justify-center">
            <div className="w-48 h-48">
              <Pie
                data={pieData}
                options={{
                  plugins: {
                    legend: { display: false },
                  },
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {Object.entries(categoryTotal).map(([cat, amount], index) => (
              <div key={cat} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getChartColor(index) }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {getCategoryName(cat, customCategories)}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white ml-auto">
                  {formatMoney(amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">支出趋势</h2>
        <div className="h-48">
          <Line
            data={lineData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              onClick: (_event, elements) => {
                if (elements.length > 0) {
                  const index = elements[0].index;
                  const dateLabel = dailyData.labels[index];
                  setSelectedDate(dateLabel);
                  setShowDayDetail(true);
                }
              },
              onHover: (_event, elements) => {
                const canvas = _event.native?.target as HTMLElement;
                if (canvas) {
                  canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
                }
              },
              plugins: {
                legend: { display: false },
                tooltip: {
                  mode: 'index',
                  intersect: false,
                  callbacks: {
                    title: (items) => `${month.split('-')[0]}-${items[0].label}`,
                    label: (item) => `支出: ¥${(item.raw as number).toFixed(2)}`,
                  },
                },
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: {
                    maxTicksLimit: 7,
                    align: 'center' as const,
                  },
                  offset: false,
                },
                y: {
                  beginAtZero: true,
                  grid: { color: 'rgba(0,0,0,0.05)' },
                },
              },
            }}
          />
        </div>
      </div>

      {showDayDetail && selectedDate && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {month.split('-')[0]}-{selectedDate} 收支详情
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                支出 {formatMoney(dayTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))}
                {dayIncome > 0 && ` · 收入 ${formatMoney(dayIncome)}`}
                · 共 {dayTransactions.length} 笔
              </p>
            </div>
            <button
              onClick={() => setShowDayDetail(false)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {dayPieData && (
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="w-32 h-32 shrink-0">
                <Pie
                  data={dayPieData}
                  options={{
                    plugins: { legend: { display: false } },
                    maintainAspectRatio: true,
                  }}
                />
              </div>
              <div className="flex-1 grid grid-cols-1 gap-1.5">
                {Object.entries(dayCategoryTotal).map(([cat, amount], i) => (
                  <div key={cat} className="flex items-center gap-2 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getChartColor(i) }} />
                    <span className="text-gray-600 dark:text-gray-400">{getCategoryName(cat, customCategories)}</span>
                    <span className="ml-auto font-medium text-gray-900 dark:text-white">{formatMoney(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {dayTransactions.map((t) => (
              <TransactionItem
                key={t.id}
                transaction={t}
                showTime
                editable
                onSave={handleTransactionSave}
                onDelete={handleTransactionDelete}
              />
            ))}
          </div>
        </div>
      )}

      {deepseekApiKey && (
        <div className="mb-6">
          {!showAIAnalysis ? (
            <button
              onClick={handleAIAnalysis}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl font-medium"
            >
              <Sparkles className="w-5 h-5" />
              AI消费分析
            </button>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <span className="font-semibold text-gray-900 dark:text-white">AI分析报告</span>
              </div>
              {isLoading && !aiAnalysis ? (
                <div className="flex justify-center py-8">
                  <LoadingDots />
                </div>
              ) : (
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{aiAnalysis}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">全部交易</h2>
          <span className="text-sm text-gray-500">{filteredTransactions.length} 条记录</span>
        </div>

        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索备注、分类、金额..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm outline-none text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'px-3 py-2 rounded-lg flex items-center gap-1 text-sm',
              showFilters || filterType !== 'all' || filterCategory !== 'all'
                ? 'bg-yellow-400 text-black'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            )}
          >
            <Filter className="w-4 h-4" />
            筛选
          </button>
        </div>

        {showFilters && (
          <div className="flex gap-2 mb-4 flex-wrap">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm outline-none text-gray-900 dark:text-white"
            >
              <option value="all">全部类型</option>
              <option value="income">收入</option>
              <option value="expense">支出</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm outline-none text-gray-900 dark:text-white"
            >
              <option value="all">全部分类</option>
              <optgroup label="支出">
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </optgroup>
              <optgroup label="收入">
                {incomeCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </optgroup>
            </select>
            {(filterType !== 'all' || filterCategory !== 'all') && (
              <button
                onClick={() => {
                  setFilterType('all');
                  setFilterCategory('all');
                }}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4 inline mr-1" />
                清除
              </button>
            )}
          </div>
        )}

        {filteredTransactions.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto [-webkit-overflow-scrolling:touch]">
            {filteredTransactions.slice(0, statsDisplayCount).map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                showTime
                editable
                onSave={handleTransactionSave}
                onDelete={handleTransactionDelete}
              />
            ))}
            {filteredTransactions.length > statsDisplayCount && (
              <button
                onClick={() => setStatsDisplayCount((prev) => prev + 20)}
                className="w-full py-3 text-sm text-yellow-500 hover:text-yellow-600 font-medium"
              >
                加载更多（{filteredTransactions.length - statsDisplayCount} 条）
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            {searchQuery || filterType !== 'all' || filterCategory !== 'all'
              ? '没有找到匹配的交易记录'
              : '暂无交易记录'}
          </div>
        )}
      </div>

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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 dark:bg-gray-700 text-white px-4 py-3 rounded-xl shadow-lg">
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
