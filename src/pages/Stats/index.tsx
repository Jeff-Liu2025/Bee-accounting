import { useState, useEffect } from 'react';
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
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { useTransactionStore, useSettingsStore, useAIStore } from '@/store';
import { AIChatBubble, LoadingDots } from '@/components';
import { analyzeSpending } from '@/services';
import { formatMoney, getCurrentMonth, getMonthDays } from '@/utils';
import { getCategoryName, EXPENSE_CATEGORIES } from '@/constants';
import { cn } from '@/utils';

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
  const { getMonthTransactions, getMonthTotal, getCategoryTotal } = useTransactionStore();
  const { deepseekApiKey } = useSettingsStore();
  const { isLoading, setLoading, addAssistantMessage, chatHistory } = useAIStore();

  const [month] = useState(getCurrentMonth());
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  const monthTransactions = getMonthTransactions(month);
  const monthTotal = getMonthTotal(month);
  const categoryTotal = getCategoryTotal(month);

  const categoryKeys = Object.keys(categoryTotal);
  const pieData = {
    labels: categoryKeys.map(getCategoryName),
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

  const lineData = {
    labels: dailyData.labels,
    datasets: [
      {
        label: '支出',
        data: dailyData.data,
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">统计分析</h1>

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
                  {getCategoryName(cat)}
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
              plugins: {
                legend: { display: false },
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { maxTicksLimit: 7 },
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
  );
}
