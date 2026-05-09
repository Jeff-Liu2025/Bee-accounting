import { callDeepSeekAPI, streamDeepSeekAPI } from './deepseek';
import { PROMPTS, parseAIResponse, validateParsedTransaction } from './prompts';
import type { Transaction, ParsedTransaction } from '@/types';

export async function parseNaturalLanguage(
  apiKey: string,
  userInput: string
): Promise<ParsedTransaction | null> {
  const prompt = PROMPTS.parseNaturalLanguage(userInput);
  const response = await callDeepSeekAPI(apiKey, [
    { role: 'user', content: prompt },
  ]);
  
  const parsed = parseAIResponse<ParsedTransaction>(response);
  if (parsed && validateParsedTransaction(parsed)) {
    return parsed;
  }
  
  return null;
}

export async function analyzeSpending(
  apiKey: string,
  transactions: Transaction[],
  month: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const prompt = PROMPTS.analyzeSpending(transactions, month);
  
  if (onChunk) {
    return await streamDeepSeekAPI(
      apiKey,
      [{ role: 'user', content: prompt }],
      onChunk
    );
  }
  
  return await callDeepSeekAPI(apiKey, [
    { role: 'user', content: prompt },
  ]);
}

export async function suggestBudget(
  apiKey: string,
  transactions: Transaction[],
  currentBudget?: number
): Promise<{
  totalBudget: number;
  categoryBudgets: Array<{ category: string; amount: number; reason: string }>;
  summary: string;
} | null> {
  const prompt = PROMPTS.suggestBudget(transactions, currentBudget);
  const response = await callDeepSeekAPI(apiKey, [
    { role: 'user', content: prompt },
  ]);
  
  return parseAIResponse(response);
}

export async function chatWithAssistant(
  apiKey: string,
  userMessage: string,
  context?: string,
  onChunk?: (chunk: string) => void,
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const systemPrompt = {
    role: 'system' as const,
    content: `你是一个友好的记账助手"小蜜蜂"，专门帮助大学生管理财务。

你的特点：
- 亲切友好，像朋友一样交流
- 懂得大学生的消费场景和生活习惯
- 能给出实用的省钱建议
- 用emoji让对话更生动

${context ? `用户背景信息：\n${context}\n` : ''}`
  };

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    systemPrompt,
  ];

  if (chatHistory && chatHistory.length > 0) {
    const recentHistory = chatHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  messages.push({ role: 'user', content: userMessage });
  
  if (onChunk) {
    return await streamDeepSeekAPI(
      apiKey,
      messages,
      onChunk
    );
  }
  
  return await callDeepSeekAPI(apiKey, messages);
}

export async function parseBillImage(
  apiKey: string,
  ocrText: string
): Promise<{
  merchant: string | null;
  amount: number | null;
  date: string | null;
  items: Array<{ name: string; price: number }> | null;
  category: string | null;
} | null> {
  const prompt = PROMPTS.parseBillImage(ocrText);
  const response = await callDeepSeekAPI(apiKey, [
    { role: 'user', content: prompt },
  ]);
  
  return parseAIResponse(response);
}

export interface AIParsedImportRecord {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  note: string;
  date: string;
}

export async function parseImportDataWithAI(
  apiKey: string,
  rawData: string
): Promise<AIParsedImportRecord[]> {
  const todayDate = new Date().toISOString().split('T')[0];
  const prompt = PROMPTS.parseImportData(rawData, todayDate);
  
  console.log('Sending to AI for parsing, rawData length:', rawData.length);
  
  const response = await callDeepSeekAPI(apiKey, [
    { role: 'user', content: prompt },
  ], { temperature: 0.3 });
  
  console.log('AI response:', response.substring(0, 500));
  
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('Parsed AI result:', parsed);
      if (Array.isArray(parsed)) {
        const validRecords = parsed.filter(record => 
          record && 
          typeof record.amount === 'number' && 
          record.amount > 0 &&
          (record.type === 'income' || record.type === 'expense')
        ).map(record => ({
          ...record,
          date: normalizeDate(record.date, todayDate),
        }));
        console.log('Valid records:', validRecords);
        return validRecords;
      }
    }
  } catch (error) {
    console.error('Parse AI response error:', error);
  }
  
  return [];
}

function normalizeDate(dateStr: string, defaultDate: string): string {
  if (!dateStr) return defaultDate;
  
  const patterns = [
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
  ];
  
  for (const pattern of patterns) {
    const match = dateStr.match(pattern);
    if (match) {
      let year: string, month: string, day: string;
      
      if (pattern === patterns[2]) {
        [, month, day, year] = match;
      } else {
        [, year, month, day] = match;
      }
      
      const paddedMonth = month.padStart(2, '0');
      const paddedDay = day.padStart(2, '0');
      
      return `${year}-${paddedMonth}-${paddedDay}`;
    }
  }
  
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  
  return defaultDate;
}
