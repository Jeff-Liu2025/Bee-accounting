import { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Moon,
  Sun,
  Bell,
  Download,
  Upload,
  Key,
  Trash2,
  ChevronRight,
  LogOut,
  FileSpreadsheet,
  X,
  Check,
  AlertCircle,
  Sparkles,
  Eye,
  Edit3,
  Clock,
  FolderOpen,
  Store,
  RefreshCw,
  Save,
  Settings,
} from 'lucide-react';
import { useSettingsStore, useTransactionStore, useBudgetStore, useAIStore } from '@/store';
import { downloadJSON, getCurrentMonth } from '@/utils';
import { parseExcelFile, parseCSVFile, parseExcelFileWithAI, parseCSVFileWithAI, type ExcelImportResult } from '@/utils/excelParser';
import { TransactionItem, ConfirmDialog, CategoryManager, MerchantManager } from '@/components';
import { cn } from '@/utils';
import { useReminder } from '@/hooks/useReminder';
import type { Transaction } from '@/types';

export default function Profile() {
  const navigate = useNavigate();
  const { theme, setTheme, reminderEnabled, setReminderEnabled, reminderFrequency, setReminderFrequency, reminderTime, setReminderTime, deepseekApiKey, setApiKey, clearApiKey, merchantMappings, customCategories, lastBackupDate, setLastBackupDate, backupFrequency, setBackupFrequency, deleteConfirmation, setDeleteConfirmation } = useSettingsStore();
  const { transactions, addTransactions } = useTransactionStore();
  const { budgets } = useBudgetStore();
  const { chatHistory, clearHistory } = useAIStore();

  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importResult, setImportResult] = useState<ExcelImportResult | null>(null);
  const [editableTransactions, setEditableTransactions] = useState<Transaction[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showMerchantManager, setShowMerchantManager] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [showLoadMore, setShowLoadMore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  const configFileInputRef = useRef<HTMLInputElement>(null);

  const isDuplicateTransaction = (newTx: Transaction, existingTx: Transaction): boolean => {
    return (
      newTx.date === existingTx.date &&
      newTx.amount === existingTx.amount &&
      newTx.type === existingTx.type &&
      (newTx.note || '') === (existingTx.note || '')
    );
  };

  const getDuplicateCount = useMemo(() => {
    return editableTransactions.filter((newTx) =>
      transactions.some((existingTx) => isDuplicateTransaction(newTx, existingTx))
    ).length;
  }, [editableTransactions, transactions]);

  const getUniqueTransactions = useMemo(() => {
    if (!skipDuplicates) return editableTransactions;
    return editableTransactions.filter((newTx) =>
      !transactions.some((existingTx) => isDuplicateTransaction(newTx, existingTx))
    );
  }, [editableTransactions, transactions, skipDuplicates]);

  const { isSupported, permission, requestPermission } = useReminder({
    enabled: reminderEnabled,
    frequency: reminderFrequency,
    time: reminderTime,
  });

  const handleReminderToggle = async () => {
    if (!reminderEnabled) {
      const result = await requestPermission();
      if (!result.granted) {
        return;
      }
    }
    setReminderEnabled(!reminderEnabled);
  };

  const handleExport = () => {
    const data = {
      transactions,
      budgets,
      exportDate: new Date().toISOString(),
    };
    downloadJSON(data, `bee-accounting-backup-${getCurrentMonth()}.json`);
  };

  const handleSaveApiKey = () => {
    if (newApiKey.trim()) {
      setApiKey(newApiKey.trim());
      setNewApiKey('');
      setShowApiKeyInput(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      let result: ExcelImportResult;
      const shouldUseAI = useAI && deepseekApiKey;

      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        if (shouldUseAI) {
          result = await parseExcelFileWithAI(file, deepseekApiKey, merchantMappings);
        } else {
          result = await parseExcelFile(file, merchantMappings);
        }
      } else if (file.name.endsWith('.csv')) {
        if (shouldUseAI) {
          result = await parseCSVFileWithAI(file, deepseekApiKey, merchantMappings);
        } else {
          result = await parseCSVFile(file, merchantMappings);
        }
      } else {
        result = {
          success: false,
          transactions: [],
          errors: ['不支持的文件格式，请上传 .xlsx, .xls 或 .csv 文件'],
          totalRows: 0,
          importedRows: 0,
        };
      }

      setImportResult(result);
      setEditableTransactions([...result.transactions]);
    } catch (error) {
      setImportResult({
        success: false,
        transactions: [],
        errors: ['文件处理失败，请重试'],
        totalRows: 0,
        importedRows: 0,
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleTransactionSave = useCallback((updatedTransaction: Transaction) => {
    setEditableTransactions((prev) =>
      prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t))
    );
  }, []);

  const handleTransactionDelete = useCallback((id: string) => {
    setEditableTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleConfirmImport = () => {
    const transactionsToImport = getUniqueTransactions;
    if (transactionsToImport.length > 0) {
      const transactionList = transactionsToImport.map((t) => ({
        amount: t.amount,
        type: t.type,
        category: t.category,
        note: t.note,
        date: t.date,
        createdAt: t.createdAt,
      }));
      addTransactions(transactionList);
      setShowImportModal(false);
      setImportResult(null);
      setEditableTransactions([]);
      navigate('/');
    }
  };

  const backupReminder = useMemo(() => {
    if (backupFrequency === 'never' || !lastBackupDate) return null;
    const lastBackup = new Date(lastBackupDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60 * 24));
    if (backupFrequency === 'weekly' && diffDays >= 7) {
      return { message: '已超过一周未备份，建议立即备份', severity: 'warning' as const };
    }
    if (backupFrequency === 'monthly' && diffDays >= 30) {
      return { message: '已超过一个月未备份，建议立即备份', severity: 'warning' as const };
    }
    return null;
  }, [lastBackupDate, backupFrequency]);

  const handleExportFullBackup = () => {
    const settings = useSettingsStore.getState();
    const aiState = useAIStore.getState();
    const data = {
      transactions,
      budgets,
      settings: {
        deepseekApiKey: settings.deepseekApiKey,
        theme: settings.theme,
        reminderEnabled: settings.reminderEnabled,
        reminderFrequency: settings.reminderFrequency,
        reminderTime: settings.reminderTime,
        customCategories: settings.customCategories,
        merchantMappings: settings.merchantMappings,
        lastBackupDate: settings.lastBackupDate,
        backupFrequency: settings.backupFrequency,
      },
      aiChatHistory: aiState.chatHistory,
      merchantMappings: settings.merchantMappings,
      exportDate: new Date().toISOString(),
    };
    const today = new Date().toISOString().split('T')[0];
    downloadJSON(data, `bee-accounting-full-backup-${today}.json`);
    setLastBackupDate(new Date().toISOString());
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backupData = JSON.parse(event.target?.result as string);
        if (!backupData.transactions || !backupData.budgets || !backupData.settings) {
          alert('无效的备份文件，缺少必要字段');
          return;
        }
        if (confirm('确定要恢复备份吗？当前所有数据将被备份数据覆盖，此操作不可撤销。')) {
          useTransactionStore.setState({ transactions: backupData.transactions });
          useBudgetStore.setState({ budgets: backupData.budgets });
          useSettingsStore.setState({
            deepseekApiKey: backupData.settings.deepseekApiKey || '',
            theme: backupData.settings.theme || 'light',
            reminderEnabled: backupData.settings.reminderEnabled ?? false,
            reminderFrequency: backupData.settings.reminderFrequency || 'weekly',
            reminderTime: backupData.settings.reminderTime || '09:00',
            customCategories: backupData.settings.customCategories || [],
            merchantMappings: backupData.settings.merchantMappings || [],
            lastBackupDate: backupData.settings.lastBackupDate || '',
            backupFrequency: backupData.settings.backupFrequency || 'never',
          });
          if (backupData.aiChatHistory) {
            useAIStore.setState({ chatHistory: backupData.aiChatHistory });
          }
          window.location.reload();
        }
      } catch {
        alert('备份文件解析失败，请确认文件格式正确');
      }
    };
    reader.readAsText(file);
    if (backupFileInputRef.current) {
      backupFileInputRef.current.value = '';
    }
  };

  const handleExportConfig = () => {
    const settings = useSettingsStore.getState();
    const data = {
      deepseekApiKey: settings.deepseekApiKey,
      merchantMappings: settings.merchantMappings,
      customCategories: settings.customCategories,
      theme: settings.theme,
      reminderEnabled: settings.reminderEnabled,
      reminderFrequency: settings.reminderFrequency,
      reminderTime: settings.reminderTime,
    };
    const today = new Date().toISOString().split('T')[0];
    downloadJSON(data, `bee-accounting-config-${today}.json`);
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const configData = JSON.parse(event.target?.result as string);
        if (confirm('确定要导入配置吗？将覆盖当前配置项。')) {
          if (configData.deepseekApiKey !== undefined) setApiKey(configData.deepseekApiKey);
          if (configData.theme) setTheme(configData.theme);
          if (configData.reminderEnabled !== undefined) setReminderEnabled(configData.reminderEnabled);
          if (configData.reminderFrequency) setReminderFrequency(configData.reminderFrequency);
          if (configData.reminderTime) setReminderTime(configData.reminderTime);
          window.location.reload();
        }
      } catch {
        alert('配置文件解析失败，请确认文件格式正确');
      }
    };
    reader.readAsText(file);
    if (configFileInputRef.current) {
      configFileInputRef.current.value = '';
    }
  };

  const handleClearAllData = () => {
    Object.keys(localStorage)
      .filter(key => key.startsWith('bee_accounting_'))
      .forEach(key => localStorage.removeItem(key));
    window.location.reload();
  };

  const displayedTransactions = useMemo(() => {
    if (editableTransactions.length <= 30 || showLoadMore) {
      return editableTransactions;
    }
    return editableTransactions.slice(0, 30);
  }, [editableTransactions, showLoadMore]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">我的</h1>

      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              {theme === 'light' ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-400" />
              )}
              <span className="text-gray-900 dark:text-white">深色模式</span>
            </div>
            <div
              className={cn(
                'w-12 h-6 rounded-full p-1 transition-colors',
                theme === 'dark' ? 'bg-yellow-400' : 'bg-gray-300'
              )}
            >
              <div
                className={cn(
                  'w-4 h-4 rounded-full bg-white transition-transform',
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
                )}
              />
            </div>
          </button>

          <div className="border-t border-gray-100 dark:border-gray-700" />

          <button
            onClick={() => setShowCategoryManager(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FolderOpen className="w-5 h-5 text-orange-500" />
              <span className="text-gray-900 dark:text-white">分类管理</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <div className="border-t border-gray-100 dark:border-gray-700" />

          <button
            onClick={() => setShowMerchantManager(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Store className="w-5 h-5 text-purple-500" />
              <span className="text-gray-900 dark:text-white">商户管理</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <div className="border-t border-gray-100 dark:border-gray-700" />

          <button
            onClick={handleReminderToggle}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-blue-500" />
              <div className="text-left">
                <span className="text-gray-900 dark:text-white">记账提醒</span>
                {!isSupported && (
                  <p className="text-xs text-gray-400">浏览器不支持通知</p>
                )}
                {isSupported && permission === 'denied' && (
                  <p className="text-xs text-orange-500">通知权限被拒绝</p>
                )}
              </div>
            </div>
            <div
              className={cn(
                'w-12 h-6 rounded-full p-1 transition-colors',
                reminderEnabled ? 'bg-yellow-400' : 'bg-gray-300'
              )}
            >
              <div
                className={cn(
                  'w-4 h-4 rounded-full bg-white transition-transform',
                  reminderEnabled ? 'translate-x-6' : 'translate-x-0'
                )}
              />
            </div>
          </button>

          {reminderEnabled && (
            <div className="px-4 pb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setReminderFrequency('weekly')}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                    reminderFrequency === 'weekly'
                      ? 'bg-yellow-400 text-black'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  )}
                >
                  每周提醒
                </button>
                <button
                  onClick={() => setReminderFrequency('monthly')}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                    reminderFrequency === 'monthly'
                      ? 'bg-yellow-400 text-black'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  )}
                >
                  每月提醒
                </button>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">提醒时间</span>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white outline-none text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-500" />
              <span className="text-gray-900 dark:text-white">删除确认提示</span>
            </div>
            <button
              onClick={() => setDeleteConfirmation(!deleteConfirmation)}
              className={cn(
                'w-12 h-6 rounded-full p-1 transition-colors',
                deleteConfirmation ? 'bg-yellow-400' : 'bg-gray-300'
              )}
            >
              <div
                className={cn(
                  'w-4 h-4 rounded-full bg-white transition-transform',
                  deleteConfirmation ? 'translate-x-6' : 'translate-x-0'
                )}
              />
            </button>
          </div>
          <div className="px-4 pb-4">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {deleteConfirmation ? '删除交易时显示确认弹窗' : '删除交易时直接删除，可通过撤销恢复'}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-purple-500" />
              <div className="text-left">
                <span className="text-gray-900 dark:text-white">DeepSeek API</span>
                {deepseekApiKey && (
                  <p className="text-xs text-green-500">已配置</p>
                )}
              </div>
            </div>
            <ChevronRight className={cn(
              'w-5 h-5 text-gray-400 transition-transform',
              showApiKeyInput && 'rotate-90'
            )} />
          </button>

          {showApiKeyInput && (
            <div className="px-4 pb-4">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                API Key 仅存储在本地浏览器，清除浏览器数据会导致丢失，请妥善保管
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder={deepseekApiKey ? '已配置，输入新的可更换' : '输入API Key'}
                  className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg outline-none text-gray-900 dark:text-white"
                />
                <button
                  onClick={handleSaveApiKey}
                  disabled={!newApiKey.trim()}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg disabled:opacity-50"
                >
                  保存
                </button>
              </div>
              {deepseekApiKey && (
                <button
                  onClick={() => {
                    clearApiKey();
                    setShowApiKeyInput(false);
                  }}
                  className="mt-2 text-sm text-red-500 hover:text-red-600"
                >
                  清除API Key
                </button>
              )}

              <div className="border-t border-gray-100 dark:border-gray-700 my-3" />

              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">配置管理</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExportConfig}
                  className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 inline mr-1" />
                  导出配置
                </button>
                <button
                  onClick={() => configFileInputRef.current?.click()}
                  className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 inline mr-1" />
                  导入配置
                </button>
              </div>
              <input
                ref={configFileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportConfig}
                className="hidden"
              />
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-green-500" />
              <span className="text-gray-900 dark:text-white">导出数据</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <div className="border-t border-gray-100 dark:border-gray-700" />

          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">备份与恢复</span>
            </div>

            <button
              onClick={handleExportFullBackup}
              className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-900 dark:text-white">导出完整备份</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            <button
              onClick={() => backupFileInputRef.current?.click()}
              className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-900 dark:text-white">导入备份</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            <input
              ref={backupFileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">备份频率</span>
              <div className="flex gap-1 flex-1">
                <button
                  onClick={() => setBackupFrequency('never')}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    backupFrequency === 'never'
                      ? 'bg-yellow-400 text-black'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  )}
                >
                  从不
                </button>
                <button
                  onClick={() => setBackupFrequency('weekly')}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    backupFrequency === 'weekly'
                      ? 'bg-yellow-400 text-black'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  )}
                >
                  每周
                </button>
                <button
                  onClick={() => setBackupFrequency('monthly')}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    backupFrequency === 'monthly'
                      ? 'bg-yellow-400 text-black'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  )}
                >
                  每月
                </button>
              </div>
            </div>

            {lastBackupDate && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                上次备份：{new Date(lastBackupDate).toLocaleDateString('zh-CN')}
              </p>
            )}
            {backupReminder && (
              <p className="text-xs text-orange-500">{backupReminder.message}</p>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700" />

          {budgets.length === 0 && (
            <div className="mx-4 my-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                💡 建议先设置月度预算，再导入数据
              </p>
              <button
                onClick={() => navigate('/budget')}
                className="text-sm text-yellow-600 dark:text-yellow-500 font-medium mt-1"
              >
                去设置预算 →
              </button>
            </div>
          )}

          <button
            onClick={() => setShowImportModal(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-blue-500" />
              <div className="text-left">
                <span className="text-gray-900 dark:text-white">导入数据</span>
                <p className="text-xs text-gray-400">支持微信支付账单 Excel、CSV 格式</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
          <button
            onClick={clearHistory}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-orange-500" />
              <span className="text-gray-900 dark:text-white">清空AI对话</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl overflow-hidden">
          <button
            onClick={() => setClearDialogOpen(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-red-500" />
              <span className="text-red-600 dark:text-red-400">清除所有数据</span>
            </div>
          </button>
        </div>

        <div className="text-center py-4">
          <p className="text-sm text-gray-400">蜜蜂记账 v1.0.0</p>
          <p className="text-xs text-gray-400 mt-1">为大学生打造的智能记账工具</p>
        </div>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {importResult ? '预览与编辑' : '导入数据'}
              </h2>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportResult(null);
                  setEditableTransactions([]);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {!importResult ? (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">导入说明</span>
                  </div>
                  <ul className="text-xs text-yellow-600 dark:text-yellow-400 space-y-1 ml-7 list-disc">
                    <li>支持微信支付账单导出的 .xlsx、.xls、.csv 文件</li>
                    <li>将保留：交易时间、交易对方、商品信息、收支类型</li>
                    <li>将忽略：交易单号、商户单号</li>
                    <li>导入后可逐条编辑确认</li>
                  </ul>
                </div>

                {deepseekApiKey && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-white" />
                        <span className="text-white font-medium">AI智能解析</span>
                      </div>
                      <button
                        onClick={() => setUseAI(!useAI)}
                        className={cn(
                          'w-12 h-6 rounded-full p-1 transition-colors',
                          useAI ? 'bg-yellow-400' : 'bg-white/30'
                        )}
                      >
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full bg-white transition-transform',
                            useAI ? 'translate-x-6' : 'translate-x-0'
                          )}
                        />
                      </button>
                    </div>
                    <p className="text-white/70 text-xs mt-2">
                      {useAI ? 'AI将智能识别分类和交易类型' : '使用基础解析模式'}
                    </p>
                  </div>
                )}

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-yellow-400 transition-colors"
                >
                  <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-300 mb-1">
                    点击选择微信支付账单文件
                  </p>
                  <p className="text-sm text-gray-400">
                    支持 .xlsx, .xls, .csv 格式
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {isImporting && (
                  <div className="mt-4 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">
                      {useAI && deepseekApiKey ? 'AI正在智能解析...' : '正在解析文件...'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="shrink-0 p-4 pb-0 space-y-4">
                  {importResult.success && editableTransactions.length > 0 ? (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                        <Check className="w-4 h-4" />
                        <span className="font-medium text-sm">解析成功</span>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        共 {importResult.totalRows} 行数据，成功解析 {editableTransactions.length} 条记录
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        <Edit3 className="w-3 h-3 inline mr-1" />
                        将鼠标悬停在记录上，点击编辑图标可修改交易信息
                      </p>
                    </div>
                  ) : (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">解析失败</span>
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        未能从文件中提取到有效交易记录
                      </p>
                    </div>
                  )}

                  {importResult.errors.length > 0 && (
                    <details className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3">
                      <summary className="text-sm text-yellow-600 dark:text-yellow-400 font-medium cursor-pointer">
                        ⚠ 警告信息（{importResult.errors.length} 条）
                      </summary>
                      <ul className="text-xs text-yellow-600 dark:text-yellow-400 space-y-1 mt-2 max-h-32 overflow-y-auto">
                        {importResult.errors.slice(0, 15).map((error, index) => (
                          <li key={index} className="ml-4 list-disc">{error}</li>
                        ))}
                        {importResult.errors.length > 15 && (
                          <li className="ml-4 list-disc text-gray-400">...还有 {importResult.errors.length - 15} 条</li>
                        )}
                      </ul>
                    </details>
                  )}

                  {editableTransactions.length > 0 && (
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        <Eye className="w-4 h-4 inline mr-1" />
                        交易记录预览 ({editableTransactions.length} 条)
                      </h3>
                      <button
                        onClick={() => setShowMerchantManager(true)}
                        className="text-xs text-purple-500 hover:text-purple-600 flex items-center gap-1"
                      >
                        <Store className="w-3.5 h-3.5" />
                        管理商户
                      </button>
                    </div>
                  )}

                  {getDuplicateCount > 0 && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-blue-500" />
                          <span className="text-xs text-blue-700 dark:text-blue-400">
                            发现 {getDuplicateCount} 条重复记录
                          </span>
                        </div>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={skipDuplicates}
                            onChange={(e) => setSkipDuplicates(e.target.checked)}
                            className="w-4 h-4 rounded border-blue-300 text-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            跳过重复
                          </span>
                        </label>
                      </div>
                      {skipDuplicates && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                          将导入 {editableTransactions.length - getDuplicateCount} 条新记录
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {editableTransactions.length > 0 && (
                  <div className="flex-1 overflow-y-auto px-4 pb-4">
                    <div className="space-y-2 pr-1 [-webkit-overflow-scrolling:touch]">
                      {displayedTransactions.map((transaction) => {
                        const isDuplicate = transactions.some((t) => isDuplicateTransaction(transaction, t));
                        return (
                          <div key={transaction.id} className="relative">
                            {isDuplicate && skipDuplicates && (
                              <div className="absolute inset-0 bg-gray-200/50 dark:bg-gray-700/50 rounded-xl z-10 flex items-center justify-center">
                                <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded">
                                  重复 - 将跳过
                                </span>
                              </div>
                            )}
                            <TransactionItem
                              transaction={transaction}
                              editable
                              showTime
                              onSave={handleTransactionSave}
                              onDelete={handleTransactionDelete}
                            />
                          </div>
                        );
                      })}
                    </div>
                    {editableTransactions.length > 30 && !showLoadMore && (
                      <button
                        onClick={() => setShowLoadMore(true)}
                        className="w-full mt-3 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        加载更多（共 {editableTransactions.length} 条）
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {importResult && (
              <div className="flex gap-2 p-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
                <button
                  onClick={() => {
                    setImportResult(null);
                    setEditableTransactions([]);
                  }}
                  className="flex-1 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg font-medium"
                >
                  重新选择
                </button>
                {editableTransactions.length > 0 && (
                  <button
                    onClick={handleConfirmImport}
                    disabled={getUniqueTransactions.length === 0}
                    className="flex-1 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    <Check className="w-4 h-4 inline mr-1" />
                    确认导入 {getUniqueTransactions.length} 条
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={clearDialogOpen}
        title="清除所有数据"
        message="确定要清除所有数据吗？此操作将删除所有交易记录、预算设置和AI对话历史，且无法恢复。"
        confirmText="清除"
        cancelText="取消"
        variant="danger"
        onConfirm={handleClearAllData}
        onCancel={() => setClearDialogOpen(false)}
      />

      <CategoryManager
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
      />

      <MerchantManager
        isOpen={showMerchantManager}
        onClose={() => setShowMerchantManager(false)}
      />
    </div>
  );
}
