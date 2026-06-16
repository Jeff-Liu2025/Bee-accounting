import { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check, Store, RefreshCw } from 'lucide-react';
import { useSettingsStore, useTransactionStore } from '@/store';
import { getExpenseCategories, getIncomeCategories } from '@/constants';
import { cn } from '@/utils';
import { ConfirmDialog } from '@/components';
import type { MerchantMapping, TransactionType } from '@/types';

interface MerchantManagerProps {
  isOpen: boolean;
  onClose: () => void;
  initialMerchant?: string;
  initialCategory?: string;
  initialType?: TransactionType;
}

export default function MerchantManager({ 
  isOpen, 
  onClose,
  initialMerchant,
  initialCategory,
  initialType 
}: MerchantManagerProps) {
  const merchantMappings = useSettingsStore((state) => state.merchantMappings);
  const customCategories = useSettingsStore((state) => state.customCategories);
  const addMerchantMapping = useSettingsStore((state) => state.addMerchantMapping);
  const updateMerchantMapping = useSettingsStore((state) => state.updateMerchantMapping);
  const deleteMerchantMapping = useSettingsStore((state) => state.deleteMerchantMapping);
  
  const findMatchingTransactions = useTransactionStore((state) => state.findMatchingTransactions);
  const applyMerchantMappings = useTransactionStore((state) => state.applyMerchantMappings);

  const [showAddForm, setShowAddForm] = useState(!!initialMerchant);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMerchantName, setNewMerchantName] = useState(initialMerchant || '');
  const [newCategory, setNewCategory] = useState(initialCategory || 'food');
  const [newType, setNewType] = useState<TransactionType>(initialType || 'expense');
  
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [pendingMapping, setPendingMapping] = useState<MerchantMapping | null>(null);
  const [matchCount, setMatchCount] = useState(0);
  const [showBatchApplyDialog, setShowBatchApplyDialog] = useState(false);

  if (!isOpen) return null;

  const expenseCategories = getExpenseCategories(customCategories);
  const incomeCategories = getIncomeCategories(customCategories);

  const handleAddMapping = () => {
    if (!newMerchantName.trim()) return;
    
    const newMapping: MerchantMapping = {
      id: `merchant_${Date.now()}`,
      merchantName: newMerchantName.trim(),
      category: newCategory,
      type: newType,
      createdAt: new Date().toISOString(),
    };
    
    const matches = findMatchingTransactions(newMapping.merchantName);
    const filteredMatches = matches.filter(t => t.category !== newCategory || t.type !== newType);
    
    if (filteredMatches.length > 0) {
      setPendingMapping(newMapping);
      setMatchCount(filteredMatches.length);
      setShowApplyDialog(true);
    } else {
      addMerchantMapping({
        merchantName: newMerchantName.trim(),
        category: newCategory,
        type: newType,
      });
      resetForm();
    }
  };

  const confirmAddAndApply = () => {
    if (!pendingMapping) return;
    
    addMerchantMapping({
      merchantName: pendingMapping.merchantName,
      category: pendingMapping.category,
      type: pendingMapping.type,
    });
    
    applyMerchantMappings([pendingMapping]);
    
    setShowApplyDialog(false);
    setPendingMapping(null);
    resetForm();
  };

  const confirmAddOnly = () => {
    if (!pendingMapping) return;
    
    addMerchantMapping({
      merchantName: pendingMapping.merchantName,
      category: pendingMapping.category,
      type: pendingMapping.type,
    });
    
    setShowApplyDialog(false);
    setPendingMapping(null);
    resetForm();
  };

  const resetForm = () => {
    setNewMerchantName('');
    setNewCategory('food');
    setNewType('expense');
    setShowAddForm(false);
    if (initialMerchant) {
      onClose();
    }
  };

  const handleUpdateMapping = (id: string) => {
    if (!newMerchantName.trim()) return;
    
    const oldMapping = merchantMappings.find(m => m.id === id);
    const newMappingData: MerchantMapping = {
      id,
      merchantName: newMerchantName.trim(),
      category: newCategory,
      type: newType,
      createdAt: oldMapping?.createdAt || new Date().toISOString(),
    };
    
    const matches = findMatchingTransactions(newMappingData.merchantName);
    const filteredMatches = matches.filter(t => t.category !== newCategory || t.type !== newType);
    
    if (filteredMatches.length > 0) {
      setPendingMapping(newMappingData);
      setMatchCount(filteredMatches.length);
      setShowApplyDialog(true);
    } else {
      updateMerchantMapping(id, {
        merchantName: newMerchantName.trim(),
        category: newCategory,
        type: newType,
      });
      setEditingId(null);
      setNewMerchantName('');
    }
  };

  const confirmUpdateAndApply = () => {
    if (!pendingMapping) return;
    
    updateMerchantMapping(pendingMapping.id, {
      merchantName: pendingMapping.merchantName,
      category: pendingMapping.category,
      type: pendingMapping.type,
    });
    
    applyMerchantMappings([pendingMapping]);
    
    setShowApplyDialog(false);
    setPendingMapping(null);
    setEditingId(null);
    setNewMerchantName('');
  };

  const startEdit = (mapping: MerchantMapping) => {
    setEditingId(mapping.id);
    setNewMerchantName(mapping.merchantName);
    setNewCategory(mapping.category);
    setNewType(mapping.type);
  };

  const handleBatchApply = () => {
    if (merchantMappings.length === 0) return;
    setShowBatchApplyDialog(true);
  };

  const confirmBatchApply = () => {
    const result = applyMerchantMappings(merchantMappings);
    setShowBatchApplyDialog(false);
  };

  const expenseMappings = merchantMappings.filter(m => m.type === 'expense');
  const incomeMappings = merchantMappings.filter(m => m.type === 'income');
  const categories = newType === 'expense' ? expenseCategories : incomeCategories;

  const getCategoryName = (categoryId: string) => {
    const cat = [...expenseCategories, ...incomeCategories].find(c => c.id === categoryId);
    return cat?.name || categoryId;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-t-2xl md:rounded-2xl max-h-[85vh] md:max-h-[80vh] overflow-hidden flex flex-col animate-slide-up md:animate-none">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">商户管理</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 min-h-0">
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              💡 设置常用商户后，导入账单时会自动匹配分类。也可以应用到已有数据。
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
              <Store className="w-4 h-4" />
              支出商户
            </h3>
            <div className="space-y-2">
              {expenseMappings.length === 0 && !showAddForm && (
                <p className="text-sm text-gray-400 text-center py-4">暂无支出商户映射</p>
              )}
              {expenseMappings.map((mapping) => (
                <div
                  key={mapping.id}
                  className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
                >
                  {editingId === mapping.id ? (
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={newMerchantName}
                        onChange={(e) => setNewMerchantName(e.target.value)}
                        className="w-full px-2 py-1 bg-white dark:bg-gray-800 rounded text-sm"
                        autoFocus
                      />
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full px-2 py-1 bg-white dark:bg-gray-800 rounded text-sm"
                      >
                        {expenseCategories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleUpdateMapping(mapping.id)}
                          className="p-1 text-green-500 hover:bg-green-100 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium">{mapping.merchantName}</p>
                        <p className="text-xs text-gray-500">
                          → {getCategoryName(mapping.category)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(mapping)}
                          className="p-1 text-gray-400 hover:text-blue-500"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteMerchantMapping(mapping.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
              <Store className="w-4 h-4" />
              收入商户
            </h3>
            <div className="space-y-2">
              {incomeMappings.length === 0 && !showAddForm && (
                <p className="text-sm text-gray-400 text-center py-4">暂无收入商户映射</p>
              )}
              {incomeMappings.map((mapping) => (
                <div
                  key={mapping.id}
                  className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                >
                  {editingId === mapping.id ? (
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={newMerchantName}
                        onChange={(e) => setNewMerchantName(e.target.value)}
                        className="w-full px-2 py-1 bg-white dark:bg-gray-800 rounded text-sm"
                        autoFocus
                      />
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full px-2 py-1 bg-white dark:bg-gray-800 rounded text-sm"
                      >
                        {incomeCategories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleUpdateMapping(mapping.id)}
                          className="p-1 text-green-500 hover:bg-green-100 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium">{mapping.merchantName}</p>
                        <p className="text-xs text-gray-500">
                          → {getCategoryName(mapping.category)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(mapping)}
                          className="p-1 text-gray-400 hover:text-blue-500"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteMerchantMapping(mapping.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {merchantMappings.length > 0 && !showAddForm && (
            <button
              onClick={handleBatchApply}
              className="w-full py-3 mb-4 bg-purple-500 hover:bg-purple-600 text-white rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              应用到已有数据
            </button>
          )}

          {showAddForm ? (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setNewType('expense');
                    setNewCategory('food');
                  }}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium',
                    newType === 'expense'
                      ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-500'
                  )}
                >
                  支出
                </button>
                <button
                  onClick={() => {
                    setNewType('income');
                    setNewCategory('salary');
                  }}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium',
                    newType === 'income'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-500'
                  )}
                >
                  收入
                </button>
              </div>
              <input
                type="text"
                value={newMerchantName}
                onChange={(e) => setNewMerchantName(e.target.value)}
                placeholder="商户名称（如：肯德基、美团外卖）"
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 rounded-lg text-sm outline-none"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 rounded-lg text-sm outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    if (initialMerchant) onClose();
                  }}
                  className="flex-1 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleAddMapping}
                  disabled={!newMerchantName.trim()}
                  className="flex-1 py-2 bg-yellow-400 text-black rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  添加
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2 hover:border-yellow-400 hover:text-yellow-500 transition-colors"
            >
              <Plus className="w-5 h-5" />
              添加商户映射
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showApplyDialog}
        title="应用到已有数据"
        message={`发现 ${matchCount} 条包含"${pendingMapping?.merchantName}"的交易记录。是否将这些记录的分类更新为"${pendingMapping ? getCategoryName(pendingMapping.category) : ''}"？`}
        confirmText="更新数据"
        cancelText="仅保存规则"
        variant="info"
        onConfirm={editingId ? confirmUpdateAndApply : confirmAddAndApply}
        onCancel={editingId ? () => {
          if (pendingMapping) {
            updateMerchantMapping(pendingMapping.id, {
              merchantName: pendingMapping.merchantName,
              category: pendingMapping.category,
              type: pendingMapping.type,
            });
          }
          setShowApplyDialog(false);
          setPendingMapping(null);
          setEditingId(null);
        } : confirmAddOnly}
      />

      <ConfirmDialog
        isOpen={showBatchApplyDialog}
        title="批量应用商户映射"
        message={`确定将所有 ${merchantMappings.length} 个商户映射应用到已有交易记录吗？匹配的交易记录分类将被更新。`}
        confirmText="应用"
        cancelText="取消"
        variant="info"
        onConfirm={confirmBatchApply}
        onCancel={() => setShowBatchApplyDialog(false)}
      />
    </div>
  );
}
