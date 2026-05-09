import { useState, useMemo } from 'react';
import { Settings, Sparkles, Check } from 'lucide-react';
import { useBudgetStore, useTransactionStore, useSettingsStore, useAIStore } from '@/store';
import { LoadingDots } from '@/components';
import { suggestBudget } from '@/services';
import { formatMoney, getCurrentMonth } from '@/utils';
import { EXPENSE_CATEGORIES, getCategoryName } from '@/constants';
import { cn } from '@/utils';
import type { CategoryBudget } from '@/types';

export default function Budget() {
  const { getCurrentBudget, setBudget, getBudgetUsage, getCategoryBudgetUsage } = useBudgetStore();
  const { transactions } = useTransactionStore();
  const { deepseekApiKey } = useSettingsStore();
  const { isLoading, setLoading } = useAIStore();

  const currentBudget = getCurrentBudget();
  const budgetUsage = useMemo(() => getBudgetUsage(), [transactions, currentBudget]);
  const categoryUsage = useMemo(() => getCategoryBudgetUsage(), [transactions, currentBudget]);

  const [totalAmount, setTotalAmount] = useState(currentBudget?.totalAmount?.toString() || '');
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>(
    currentBudget?.categoryBudgets || []
  );
  const [isEditing, setIsEditing] = useState(!currentBudget);
  const [aiSuggestion, setAiSuggestion] = useState<{
    totalBudget: number;
    categoryBudgets: Array<{ category: string; amount: number; reason: string }>;
    summary: string;
  } | null>(null);

  const handleSave = () => {
    const amount = parseFloat(totalAmount);
    if (amount <= 0) return;

    setBudget(amount, categoryBudgets);
    setIsEditing(false);
  };

  const handleAISuggest = async () => {
    if (!deepseekApiKey || isLoading) return;

    setLoading(true);
    try {
      const result = await suggestBudget(deepseekApiKey, transactions, parseFloat(totalAmount) || undefined);
      if (result) {
        setAiSuggestion(result);
      }
    } catch (error) {
      console.error('AI建议失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyAISuggestion = () => {
    if (!aiSuggestion) return;
    setTotalAmount(aiSuggestion.totalBudget.toString());
    setCategoryBudgets(
      aiSuggestion.categoryBudgets.map((cb, index) => ({
        id: `cat-${index}`,
        category: cb.category,
        amount: cb.amount,
      }))
    );
    setAiSuggestion(null);
  };

  const updateCategoryBudget = (categoryId: string, amount: number) => {
    setCategoryBudgets((prev) => {
      const existing = prev.find((cb) => cb.category === categoryId);
      if (existing) {
        return prev.map((cb) =>
          cb.category === categoryId ? { ...cb, amount } : cb
        );
      }
      return [...prev, { id: `cat-${Date.now()}`, category: categoryId, amount }];
    });
  };

  const getCategoryBudget = (categoryId: string): number => {
    return categoryBudgets.find((cb) => cb.category === categoryId)?.amount || 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">预算管理</h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
          >
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
              月度总预算
            </label>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">¥</span>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 text-2xl font-bold bg-transparent outline-none text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">分类预算</h3>
            <div className="space-y-3">
              {EXPENSE_CATEGORIES.map((category) => (
                <div key={category.id} className="flex items-center gap-3">
                  <span className="w-16 text-sm text-gray-600 dark:text-gray-400">
                    {category.name}
                  </span>
                  <input
                    type="number"
                    value={getCategoryBudget(category.id) || ''}
                    onChange={(e) => updateCategoryBudget(category.id, parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg outline-none text-gray-900 dark:text-white"
                  />
                </div>
              ))}
            </div>
          </div>

          {deepseekApiKey && (
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-white" />
                <span className="font-medium text-white">AI预算建议</span>
              </div>
              {aiSuggestion ? (
                <div className="bg-white/10 rounded-xl p-3 mb-3">
                  <p className="text-white/90 text-sm mb-2">
                    建议总预算: ¥{aiSuggestion.totalBudget}
                  </p>
                  <p className="text-white/70 text-xs">{aiSuggestion.summary}</p>
                  <button
                    onClick={applyAISuggestion}
                    className="mt-3 w-full py-2 bg-white text-purple-600 rounded-lg font-medium"
                  >
                    应用建议
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAISuggest}
                  disabled={isLoading}
                  className="w-full py-2 bg-white/20 text-white rounded-lg font-medium"
                >
                  {isLoading ? <LoadingDots className="justify-center" /> : '获取AI建议'}
                </button>
              )}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={!totalAmount || parseFloat(totalAmount) <= 0}
            className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 text-black font-semibold rounded-xl transition-all duration-200"
          >
            <Check className="w-5 h-5 inline mr-2" />
            保存预算
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 dark:text-gray-400">本月预算</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatMoney(budgetUsage.total)}
              </span>
            </div>

            <div className="mb-2">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-500 dark:text-gray-400">已使用</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {budgetUsage.percentage.toFixed(0)}%
                </span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{formatMoney(budgetUsage.used)} 已用</span>
                <span>{formatMoney(budgetUsage.total - budgetUsage.used)} 剩余</span>
              </div>
            </div>
          </div>

          {Object.keys(categoryUsage).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">分类预算</h3>
              <div className="space-y-4">
                {Object.entries(categoryUsage).map(([category, usage]) => (
                  <div key={category}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">
                        {getCategoryName(category)}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {usage.percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          usage.percentage >= 100
                            ? 'bg-red-500'
                            : usage.percentage >= 80
                            ? 'bg-orange-500'
                            : 'bg-yellow-400'
                        )}
                        style={{ width: `${Math.min(usage.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>{formatMoney(usage.used)} 已用</span>
                      <span>{formatMoney(usage.total)} 预算</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!currentBudget && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl">
              <p className="text-gray-400 dark:text-gray-500">尚未设置预算</p>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 px-6 py-2 bg-yellow-400 text-black rounded-lg font-medium"
              >
                设置预算
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
