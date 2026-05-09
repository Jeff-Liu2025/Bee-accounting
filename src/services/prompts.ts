import type { Transaction, ParsedTransaction } from '@/types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants';

export const PROMPTS = {
  parseNaturalLanguage: (userInput: string): string => `你是一个记账助手。请解析用户的记账描述，提取以下信息并以JSON格式返回：
- amount: 金额（数字，必填）
- type: 类型（income表示收入，expense表示支出，必填）
- category: 分类（从下面列表中选择，必填）
- note: 备注（可选，提取用户描述中的关键信息）
- date: 日期（YYYY-MM-DD格式，如果用户说"今天"就用今天的日期，如果没说日期也用今天）

支出分类列表：${EXPENSE_CATEGORIES.map(c => c.name).join('、')}
收入分类列表：${INCOME_CATEGORIES.map(c => c.name).join('、')}

请只返回JSON，不要有其他内容。如果无法解析，返回 {"error": "无法解析的描述"}。

用户输入：${userInput}`,

  analyzeSpending: (transactions: Transaction[], month: string): string => `你是一个专业的财务顾问。请根据用户本月的消费数据，提供个性化的消费分析和建议。

分析月份：${month}

消费数据：
${JSON.stringify(transactions.map(t => ({
  日期: t.date,
  类型: t.type === 'expense' ? '支出' : '收入',
  金额: t.amount,
  分类: t.category,
  备注: t.note || ''
})), null, 2)}

请从以下维度进行分析，用中文回答，语言亲切友好：
1. 📊 消费概况：总结本月收支情况
2. 🏆 主要支出：分析支出最多的分类
3. ⚠️ 异常消费：识别可能存在问题的消费
4. 💡 节省建议：给出具体的省钱建议
5. 📈 下月预测：预测下月可能的支出

请用emoji让回答更生动。`,

  suggestBudget: (transactions: Transaction[], currentBudget?: number): string => `你是一个财务规划师。请根据用户的历史消费数据，推荐合理的预算设置。

历史消费数据（最近3个月）：
${JSON.stringify(transactions.map(t => ({
  月份: t.date.slice(0, 7),
  类型: t.type === 'expense' ? '支出' : '收入',
  金额: t.amount,
  分类: t.category
})), null, 2)}

${currentBudget ? `当前预算：${currentBudget}元` : ''}

请分析并推荐：
1. 总预算建议（数字，单位：元）
2. 各分类预算建议
3. 预算理由

请以JSON格式返回：
{
  "totalBudget": 数字,
  "categoryBudgets": [
    {"category": "分类名", "amount": 数字, "reason": "理由"}
  ],
  "summary": "总体建议"
}`,

  chatAssistant: (userMessage: string, context?: string): string => `你是一个友好的记账助手"小蜜蜂"，专门帮助大学生管理财务。

你的特点：
- 亲切友好，像朋友一样交流
- 懂得大学生的消费场景和生活习惯
- 能给出实用的省钱建议
- 用emoji让对话更生动

${context ? `用户背景信息：\n${context}\n` : ''}

用户说：${userMessage}

请用中文回复，保持简洁有趣。`,

  parseBillImage: (ocrText: string): string => `你是一个账单识别助手。请从以下OCR识别的文本中提取账单信息。

OCR文本：
${ocrText}

请提取以下信息并以JSON格式返回：
{
  "merchant": "商户名称",
  "amount": 数字,
  "date": "日期(YYYY-MM-DD格式)",
  "items": [
    {"name": "商品名", "price": 数字}
  ],
  "category": "建议分类（餐饮/交通/购物/娱乐/学习/日用/其他）"
}

如果某些信息无法识别，设为null。只返回JSON。`,

  parseImportData: (rawData: string, todayDate: string): string => `你是一个智能记账数据解析助手。请分析以下从微信支付账单导出的原始数据，将其转换为结构化的记账记录。

原始数据（每行一条记录，字段用逗号分隔）：
${rawData}

今天是 ${todayDate}

请完成以下任务：
1. 识别每行数据的含义：交易时间、交易类型、交易对方、商品、收/支、金额
2. 保留并提取以下关键字段：交易时间(时间+日期)、交易对方(商户名)、商品(商品描述)、收支类型(收/支)
3. 务必忽略并跳过以下字段：交易单号（长数字串如420000...）、商户单号（长数字串如1000107...）
4. 备注只使用交易对方和商品信息，不要将交易单号或商户单号作为备注内容
5. 判断每条记录是收入还是支出
6. 根据交易对方和商品描述智能匹配分类

支出分类：餐饮、交通、购物、娱乐、学习、日用、其他
收入分类：工资、兼职、生活费、奖金、其他收入

请以JSON数组格式返回解析结果：
[
  {
    "amount": 数字金额（正数）,
    "type": "income或expense",
    "category": "分类名（中文）",
    "note": "交易对方 - 商品描述",
    "date": "YYYY-MM-DD格式日期"
  }
]

重要规则：
- 金额必须是正数
- 备注字段只能包含交易对方和商品名称，绝对不能包含数字串（交易单号、商户单号）
- 如果无法确定日期，使用今天的日期 ${todayDate}
- 如果无法确定分类，设为"其他"
- 跳过表头行和无效数据
- 跳过标题、汇总行（如"共X笔记录"、"收入X笔"等）
- 只返回JSON数组，不要有其他内容`,
};

export function parseAIResponse<T>(response: string): T | null {
  const trimmed = response.trim();
  
  try {
    return JSON.parse(trimmed);
  } catch {}
  
  let depth = 0;
  let start = -1;
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{' || char === '[') {
        if (depth === 0) start = i;
        depth++;
      } else if (char === '}' || char === ']') {
        depth--;
        if (depth === 0 && start >= 0) {
          try {
            return JSON.parse(trimmed.slice(start, i + 1));
          } catch {
            start = -1;
          }
        }
      }
    }
  }
  
  return null;
}

export function validateParsedTransaction(data: unknown): data is ParsedTransaction {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.amount === 'number' &&
    (obj.type === 'income' || obj.type === 'expense') &&
    typeof obj.category === 'string'
  );
}
