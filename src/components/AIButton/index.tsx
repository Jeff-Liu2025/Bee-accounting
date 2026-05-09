import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { cn } from '@/utils';

interface AIButtonProps {
  className?: string;
}

export default function AIButton({ className }: AIButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/ai-assistant')}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-full',
        'bg-gradient-to-r from-purple-500 to-indigo-600',
        'text-white font-medium text-sm',
        'hover:from-purple-600 hover:to-indigo-700',
        'transition-all duration-200 shadow-lg shadow-purple-500/25',
        className
      )}
    >
      <Sparkles className="w-4 h-4" />
      <span>AI助手</span>
    </button>
  );
}
