import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, MicOff, Sparkles, Check, Calendar } from 'lucide-react';
import { useTransactionStore, useSettingsStore, useAIStore } from '@/store';
import { CategorySelector, NumberKeyboard } from '@/components';
import { parseNaturalLanguage } from '@/services';
import { getToday } from '@/utils';
import { cn } from '@/utils';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import type { TransactionType } from '@/types';

export default function AddRecord() {
  const navigate = useNavigate();
  const { addTransaction } = useTransactionStore();
  const { deepseekApiKey } = useSettingsStore();
  const { isLoading, setLoading } = useAIStore();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('0');
  const [category, setCategory] = useState('food');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getToday());
  const [showAIInput, setShowAIInput] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiError, setAiError] = useState('');

  const {
    isListening,
    transcript,
    error: speechError,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setNote(transcript);
    }
  }, [transcript]);

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (numAmount <= 0) return;

    addTransaction({
      amount: numAmount,
      type,
      category,
      note: note || undefined,
      date,
    });

    navigate('/');
  };

  const handleAIParse = async () => {
    if (!aiInput.trim() || !deepseekApiKey) return;

    setLoading(true);
    setAiError('');

    try {
      const result = await parseNaturalLanguage(deepseekApiKey, aiInput);
      if (result) {
        setAmount(result.amount.toString());
        setType(result.type);
        setCategory(result.category);
        setNote(result.note);
        setShowAIInput(false);
        setAiInput('');
      } else {
        setAiError('无法解析，请尝试其他描述');
      }
    } catch (error) {
      setAiError('解析失败，请检查API配置');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 px-4 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">记一笔</h1>
      </header>

      <div className="px-4 py-4">
        <div className="flex bg-gray-200 dark:bg-gray-700 rounded-xl p-1 mb-6">
          <button
            onClick={() => {
              setType('expense');
              setCategory('food');
            }}
            className={cn(
              'flex-1 py-2 rounded-lg font-medium transition-all duration-200',
              type === 'expense'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            )}
          >
            支出
          </button>
          <button
            onClick={() => {
              setType('income');
              setCategory('salary');
            }}
            className={cn(
              'flex-1 py-2 rounded-lg font-medium transition-all duration-200',
              type === 'income'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            )}
          >
            收入
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              {type === 'expense' ? '支出金额' : '收入金额'}
            </p>
            <p className="text-4xl font-bold text-gray-900 dark:text-white">
              ¥{amount}
            </p>
          </div>

          <NumberKeyboard value={amount} onChange={setAmount} onSubmit={handleSave} />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl py-4 mb-4">
          <p className="px-4 text-sm text-gray-500 dark:text-gray-400 mb-2">选择分类</p>
          <CategorySelector selected={category} onChange={setCategory} type={type} />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isListening ? '正在听...' : '添加备注...'}
              className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none"
            />
            {isSupported && (
              <button
                onClick={handleMicClick}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  isListening
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-500'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                )}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
          {speechError && (
            <p className="text-red-500 text-xs mt-1">语音识别失败，请重试</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">交易日期</p>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={getToday()}
                className="w-full bg-transparent text-gray-900 dark:text-white outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {deepseekApiKey && (
          <div className="mb-4">
            {!showAIInput ? (
              <button
                onClick={() => setShowAIInput(true)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-medium"
              >
                <Sparkles className="w-5 h-5" />
                自然语言记账
              </button>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <span className="font-medium text-gray-900 dark:text-white">AI记账</span>
                </div>
                <textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="例如：今天午饭花了25块"
                  className="w-full h-20 bg-gray-100 dark:bg-gray-700 rounded-xl p-3 text-gray-900 dark:text-white placeholder-gray-400 outline-none resize-none"
                />
                {aiError && (
                  <p className="text-red-500 text-sm mt-2">{aiError}</p>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      setShowAIInput(false);
                      setAiInput('');
                      setAiError('');
                    }}
                    className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAIParse}
                    disabled={isLoading || !aiInput.trim()}
                    className="flex-1 py-2 bg-purple-500 text-white rounded-lg disabled:opacity-50"
                  >
                    {isLoading ? '解析中...' : '解析'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={parseFloat(amount) <= 0}
          className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 text-black font-semibold rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
        >
          <Check className="w-5 h-5 inline mr-2" />
          保存
        </button>
      </div>
    </div>
  );
}
