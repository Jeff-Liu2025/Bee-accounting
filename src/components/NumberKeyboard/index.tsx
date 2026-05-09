import { cn } from '@/utils';

interface NumberKeyboardProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
}

const keys = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'delete'],
];

export default function NumberKeyboard({ value, onChange, onSubmit }: NumberKeyboardProps) {
  const handleKeyPress = (key: string) => {
    if (key === 'delete') {
      onChange(value.slice(0, -1));
    } else if (key === '.') {
      if (!value.includes('.')) {
        onChange(value ? value + '.' : '0.');
      }
    } else {
      if (value === '0' && key !== '.') {
        onChange(key);
      } else if (value.length < 10) {
        const parts = (value + key).split('.');
        if (parts[1]?.length <= 2) {
          onChange(value + key);
        }
      }
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2 p-4">
      {keys.flat().map((key) => (
        <button
          key={key}
          onClick={() => handleKeyPress(key)}
          className={cn(
            'h-14 rounded-xl font-semibold text-xl transition-all duration-150',
            'active:scale-95',
            key === 'delete'
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
          )}
        >
          {key === 'delete' ? '⌫' : key}
        </button>
      ))}
      <button
        onClick={onSubmit}
        className="col-span-3 h-14 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-black font-semibold text-lg transition-all duration-150 active:scale-[0.98]"
      >
        确定
      </button>
    </div>
  );
}
