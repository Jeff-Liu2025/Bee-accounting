import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Trash2, Image, Loader2 } from 'lucide-react';
import { useAIStore, useSettingsStore, useTransactionStore } from '@/store';
import { AIChatBubble, LoadingDots } from '@/components';
import { chatWithAssistant, parseNaturalLanguage } from '@/services';
import { formatMoney, getCurrentMonth } from '@/utils';
import { cn } from '@/utils';

export default function AIAssistant() {
  const { chatHistory, isLoading, setLoading, addUserMessage, addAssistantMessage, clearHistory } = useAIStore();
  const { deepseekApiKey } = useSettingsStore();
  const { addTransaction, getMonthTotal, transactions } = useTransactionStore();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const getContext = () => {
    const monthTotal = getMonthTotal();
    return `
      当前月份: ${getCurrentMonth()}
      本月收入: ${formatMoney(monthTotal.income)}
      本月支出: ${formatMoney(monthTotal.expense)}
      交易记录数: ${transactions.length}
    `;
  };

  const handleSend = async () => {
    if (!input.trim() || !deepseekApiKey || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    addUserMessage(userMessage);
    setLoading(true);

    try {
      let response = '';
      const historyForAPI = chatHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));
      
      await chatWithAssistant(deepseekApiKey, userMessage, getContext(), (chunk) => {
        response += chunk;
      }, historyForAPI);

      if (!response) {
        response = '抱歉，我暂时无法回答这个问题。请稍后再试。';
      }

      addAssistantMessage(response);
    } catch (error) {
      addAssistantMessage('抱歉，发生了错误。请检查API配置或稍后再试。');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    if (!deepseekApiKey || isLoading) return;

    addUserMessage(action);
    setLoading(true);

    try {
      let response = '';
      const historyForAPI = chatHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));
      
      await chatWithAssistant(deepseekApiKey, action, getContext(), (chunk) => {
        response += chunk;
      }, historyForAPI);
      
      addAssistantMessage(response || '抱歉，我暂时无法回答这个问题。');
    } catch (error) {
      addAssistantMessage('抱歉，发生了错误。请检查API配置或稍后再试。');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    '分析我本月的消费情况',
    '给我一些省钱建议',
    '如何养成记账习惯？',
    '大学生理财入门',
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI助手小蜜蜂</h1>
            <p className="text-white/70 text-sm">你的智能记账顾问</p>
          </div>
        </div>
      </header>

      {!deepseekApiKey ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              需要配置API
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              请在"我的"页面配置DeepSeek API Key
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {chatHistory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 mb-4">有什么可以帮助你的？</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action) => (
                    <button
                      key={action}
                      onClick={() => handleQuickAction(action)}
                      className="p-3 bg-white dark:bg-gray-800 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {chatHistory.map((message) => (
                  <AIChatBubble
                    key={message.id}
                    role={message.role}
                    content={message.content}
                  />
                ))}
                {isLoading && (
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-3 rounded-2xl rounded-tl-sm">
                      <LoadingDots className="text-white" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="输入消息..."
                rows={1}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-2xl resize-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center disabled:opacity-50"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
            {chatHistory.length > 0 && (
              <button
                onClick={clearHistory}
                className="mt-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                清空对话
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
