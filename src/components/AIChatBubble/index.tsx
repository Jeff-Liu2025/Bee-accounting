import { Sparkles } from 'lucide-react';
import { cn } from '@/utils';

interface AIChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export default function AIChatBubble({ role, content, isStreaming }: AIChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[80%] px-4 py-3 rounded-2xl',
          isUser
            ? 'bg-yellow-400 text-black rounded-tr-sm'
            : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-tl-sm'
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{content}</p>
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-white/50 animate-pulse ml-1" />
        )}
      </div>
    </div>
  );
}
