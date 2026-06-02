import { useEffect } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { cn } from '@/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const iconMap = {
    danger: <Trash2 className="w-6 h-6 text-red-500" />,
    warning: <AlertTriangle className="w-6 h-6 text-orange-500" />,
    info: <AlertTriangle className="w-6 h-6 text-blue-500" />,
  };

  const confirmBtnClass = {
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-orange-500 hover:bg-orange-600 text-white',
    info: 'bg-blue-500 hover:bg-blue-600 text-white',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        className={cn(
          'relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-t-3xl p-6',
          'transform transition-transform duration-300 ease-out',
          'animate-slide-up'
        )}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        <div className="flex items-start gap-4 mb-6">
          <div className="shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            {iconMap[variant]}
          </div>
          <div className="flex-1 pt-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {message}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'flex-1 py-3 rounded-xl font-medium transition-colors',
              confirmBtnClass[variant]
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
