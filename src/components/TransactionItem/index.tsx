import { useState, useRef, useEffect } from 'react';
import type { Transaction } from '@/types';
import { getCategoryById, getExpenseCategories, getIncomeCategories } from '@/constants';
import { formatMoney, getRelativeTime, formatTime, generateId } from '@/utils';
import { cn } from '@/utils';
import { useSettingsStore } from '@/store';
import {
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  Book,
  Home,
  MoreHorizontal,
  Wallet,
  Briefcase,
  Gift,
  Award,
  PlusCircle,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import type { TransactionType } from '@/types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  Book,
  Home,
  MoreHorizontal,
  Wallet,
  Briefcase,
  Gift,
  Award,
  PlusCircle,
};

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: () => void;
  editable?: boolean;
  onSave?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  showTime?: boolean;
}

export default function TransactionItem({ transaction, onClick, editable, onSave, onDelete, showTime }: TransactionItemProps) {
  const customCategories = useSettingsStore((state) => state.customCategories);
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState(transaction.amount.toString());
  const [editType, setEditType] = useState<TransactionType>(transaction.type);
  const [editCategory, setEditCategory] = useState(transaction.category);
  const [editNote, setEditNote] = useState(transaction.note || '');
  const [editDate, setEditDate] = useState(transaction.date);
  const [editTime, setEditTime] = useState(() => {
    if (transaction.createdAt) {
      const d = new Date(transaction.createdAt);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    return '12:00';
  });
  const [amountError, setAmountError] = useState('');

  const category = getCategoryById(isEditing ? editCategory : transaction.category, customCategories);
  const Icon = category ? iconMap[category.icon] || MoreHorizontal : MoreHorizontal;

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditAmount(transaction.amount.toString());
    setEditType(transaction.type);
    setEditCategory(transaction.category);
    setEditNote(transaction.note || '');
    setEditDate(transaction.date);
    setAmountError('');
    setIsEditing(true);
  };

  const validateAmount = (val: string): boolean => {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
      setAmountError('金额必须大于0');
      return false;
    }
    if (!/^\d+(\.\d{0,2})?$/.test(val)) {
      setAmountError('金额最多两位小数');
      return false;
    }
    setAmountError('');
    return true;
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!validateAmount(editAmount)) return;

    const fullDate = `${editDate}T${editTime}:00`;
    onSave?.({
      ...transaction,
      amount: parseFloat(editAmount),
      type: editType,
      category: editCategory,
      note: editNote || undefined,
      date: editDate,
      createdAt: fullDate,
    });
    setIsEditing(false);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setAmountError('');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(transaction.id);
  };

  if (isEditing && onSave) {
    const categories = editType === 'expense' 
      ? getExpenseCategories(customCategories) 
      : getIncomeCategories(customCategories);
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-yellow-400">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setEditType('expense')}
            className={cn(
              'flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors',
              editType === 'expense'
                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
            )}
          >
            支出
          </button>
          <button
            onClick={() => setEditType('income')}
            className={cn(
              'flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors',
              editType === 'income'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
            )}
          >
            收入
          </button>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 w-14 shrink-0">金额</span>
            <div className="flex-1">
              <input
                type="number"
                value={editAmount}
                onChange={(e) => {
                  setEditAmount(e.target.value);
                  validateAmount(e.target.value);
                }}
                step="0.01"
                min="0.01"
                className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white outline-none text-sm"
              />
              {amountError && <p className="text-red-500 text-xs mt-0.5">{amountError}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 w-14 shrink-0">分类</span>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white outline-none text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 w-14 shrink-0">日期</span>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white outline-none text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 w-14 shrink-0">时间</span>
            <input
              type="time"
              value={editTime}
              onChange={(e) => setEditTime(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white outline-none text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 w-14 shrink-0">备注</span>
            <input
              type="text"
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="添加备注..."
              className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {onDelete && (
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            >
              删除
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={handleCancel}
            className="px-4 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-sm bg-yellow-400 text-black rounded-lg font-medium"
          >
            保存
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl group',
        'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
        onClick && 'cursor-pointer'
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center',
          transaction.type === 'expense'
            ? 'bg-orange-100 dark:bg-orange-900/30'
            : 'bg-green-100 dark:bg-green-900/30'
        )}
      >
        <Icon
          className={cn(
            'w-5 h-5',
            transaction.type === 'expense'
              ? 'text-orange-500'
              : 'text-green-500'
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-900 dark:text-white">
            {category?.name || transaction.category}
          </span>
          <span
            className={cn(
              'font-semibold',
              transaction.type === 'expense'
                ? 'text-red-500'
                : 'text-green-500'
            )}
          >
            {transaction.type === 'expense' ? '-' : '+'}
            {formatMoney(transaction.amount)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {transaction.note || '无备注'}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {getRelativeTime(transaction.date)} {showTime && transaction.createdAt ? formatTime(transaction.createdAt) : ''}
            </span>
            {editable && (
              <button
                onClick={handleStartEdit}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
