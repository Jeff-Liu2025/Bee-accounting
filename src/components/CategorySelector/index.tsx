import { cn } from '@/utils';

interface CategorySelectorProps {
  selected: string;
  onChange: (category: string) => void;
  type: 'income' | 'expense';
}

import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants';
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
} from 'lucide-react';

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

export default function CategorySelector({ selected, onChange, type }: CategorySelectorProps) {
  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="flex overflow-x-auto gap-3 px-4 py-2 scrollbar-hide">
      {categories.map((category) => {
        const Icon = iconMap[category.icon] || MoreHorizontal;
        const isSelected = selected === category.id;

        return (
          <button
            key={category.id}
            onClick={() => onChange(category.id)}
            className={cn(
              'flex flex-col items-center justify-center min-w-[72px] p-3 rounded-xl transition-all duration-200 active:scale-95 touch-feedback',
              isSelected
                ? 'bg-yellow-400 text-black'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            <Icon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{category.name}</span>
          </button>
        );
      })}
    </div>
  );
}
