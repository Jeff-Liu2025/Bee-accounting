import { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { useSettingsStore } from '@/store';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants';
import { cn } from '@/utils';
import type { CustomCategory, TransactionType } from '@/types';

const AVAILABLE_ICONS = [
  { id: 'Utensils', name: '餐饮' },
  { id: 'Car', name: '交通' },
  { id: 'ShoppingBag', name: '购物' },
  { id: 'Gamepad2', name: '娱乐' },
  { id: 'Book', name: '学习' },
  { id: 'Home', name: '家用' },
  { id: 'Wallet', name: '钱包' },
  { id: 'Briefcase', name: '工作' },
  { id: 'Gift', name: '礼物' },
  { id: 'Award', name: '奖励' },
  { id: 'MoreHorizontal', name: '其他' },
];

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CategoryManager({ isOpen, onClose }: CategoryManagerProps) {
  const customCategories = useSettingsStore((state) => state.customCategories);
  const addCustomCategory = useSettingsStore((state) => state.addCustomCategory);
  const updateCustomCategory = useSettingsStore((state) => state.updateCustomCategory);
  const deleteCustomCategory = useSettingsStore((state) => state.deleteCustomCategory);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('MoreHorizontal');
  const [newType, setNewType] = useState<TransactionType>('expense');

  if (!isOpen) return null;

  const handleAddCategory = () => {
    if (!newName.trim()) return;
    addCustomCategory({
      name: newName.trim(),
      icon: newIcon,
      type: newType,
    });
    setNewName('');
    setNewIcon('MoreHorizontal');
    setNewType('expense');
    setShowAddForm(false);
  };

  const handleUpdateCategory = (id: string) => {
    if (!newName.trim()) return;
    updateCustomCategory(id, {
      name: newName.trim(),
      icon: newIcon,
      type: newType,
    });
    setEditingId(null);
    setNewName('');
  };

  const startEdit = (cat: CustomCategory) => {
    setEditingId(cat.id);
    setNewName(cat.name);
    setNewIcon(cat.icon);
    setNewType(cat.type);
  };

  const expenseCustoms = customCategories.filter(c => c.type === 'expense');
  const incomeCustoms = customCategories.filter(c => c.type === 'income');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">分类管理</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(80vh-140px)]">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">支出分类</h3>
            <div className="space-y-2">
              {EXPENSE_CATEGORIES.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <span className="text-gray-900 dark:text-white">{cat.name}</span>
                  <span className="text-xs text-gray-400">预设</span>
                </div>
              ))}
              {expenseCustoms.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
                >
                  {editingId === cat.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 px-2 py-1 bg-white dark:bg-gray-800 rounded text-sm"
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdateCategory(cat.id)}
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
                  ) : (
                    <>
                      <span className="text-gray-900 dark:text-white">{cat.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(cat)}
                          className="p-1 text-gray-400 hover:text-blue-500"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCustomCategory(cat.id)}
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
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">收入分类</h3>
            <div className="space-y-2">
              {INCOME_CATEGORIES.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <span className="text-gray-900 dark:text-white">{cat.name}</span>
                  <span className="text-xs text-gray-400">预设</span>
                </div>
              ))}
              {incomeCustoms.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                >
                  {editingId === cat.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 px-2 py-1 bg-white dark:bg-gray-800 rounded text-sm"
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdateCategory(cat.id)}
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
                  ) : (
                    <>
                      <span className="text-gray-900 dark:text-white">{cat.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(cat)}
                          className="p-1 text-gray-400 hover:text-blue-500"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCustomCategory(cat.id)}
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

          {showAddForm ? (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNewType('expense')}
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
                  onClick={() => setNewType('income')}
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
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="分类名称"
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 rounded-lg text-sm outline-none"
              />
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_ICONS.map((icon) => (
                  <button
                    key={icon.id}
                    onClick={() => setNewIcon(icon.id)}
                    className={cn(
                      'px-2 py-1 rounded text-xs',
                      newIcon === icon.id
                        ? 'bg-yellow-400 text-black'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    )}
                  >
                    {icon.name}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleAddCategory}
                  className="flex-1 py-2 bg-yellow-400 text-black rounded-lg text-sm font-medium"
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
              添加自定义分类
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
