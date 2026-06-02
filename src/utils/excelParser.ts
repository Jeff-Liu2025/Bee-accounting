import * as XLSX from 'xlsx';
import type { Transaction, MerchantMapping } from '@/types';
import { generateId } from './index';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants';
import { parseImportDataWithAI, type AIParsedImportRecord } from '@/services';

export interface ExcelImportResult {
  success: boolean;
  transactions: Transaction[];
  errors: string[];
  totalRows: number;
  importedRows: number;
  rawData?: string;
  fileName?: string;
}

export function applyMerchantMapping(
  merchantName: string,
  merchantMappings: MerchantMapping[]
): { category: string; type: 'income' | 'expense' } | null {
  if (!merchantName || merchantMappings.length === 0) return null;
  
  const normalizedMerchant = merchantName.toLowerCase().trim();
  
  for (const mapping of merchantMappings) {
    const normalizedMapping = mapping.merchantName.toLowerCase().trim();
    if (normalizedMerchant.includes(normalizedMapping) || normalizedMapping.includes(normalizedMerchant)) {
      return {
        category: mapping.category,
        type: mapping.type,
      };
    }
  }
  
  return null;
}

const categoryMapping: Record<string, string> = {
  '餐饮': 'food',
  '食品': 'food',
  '吃饭': 'food',
  '食堂': 'food',
  '烤肉': 'food',
  '炒粉': 'food',
  '烤鸡': 'food',
  '餐厅': 'food',
  '饭': 'food',
  '餐': 'food',
  '饮': 'food',
  '交通': 'transport',
  '出行': 'transport',
  '打车': 'transport',
  '公交': 'transport',
  '地铁': 'transport',
  '滴滴': 'transport',
  '购物': 'shopping',
  '网购': 'shopping',
  '淘宝': 'shopping',
  '京东': 'shopping',
  '拼多多': 'shopping',
  '商店': 'shopping',
  '娱乐': 'entertainment',
  '游戏': 'entertainment',
  '学习': 'study',
  '教育': 'study',
  '日用': 'daily',
  '生活': 'daily',
  '水': 'daily',
  '工资': 'salary',
  '薪资': 'salary',
  '兼职': 'parttime',
  '生活费': 'allowance',
  '奖金': 'bonus',
  '红包': 'bonus',
  '退款': 'other_income',
  '其他收入': 'other_income',
};

function mapCategoryToId(categoryName: string): string {
  const cleaned = categoryName.trim();
  for (const [key, id] of Object.entries(categoryMapping)) {
    if (cleaned.includes(key) || key.includes(cleaned)) {
      return id;
    }
  }
  return 'other';
}

function detectCategory(
  merchant: string,
  product: string,
  transactionType: string
): string {
  const text = `${merchant} ${product}`.toLowerCase();

  if (/食堂|烤肉|炒粉|烤鸡|餐厅|饭|餐|四季|麦当劳|肯德基|来客|大麦烤鸡/.test(text)) {
    return 'food';
  }
  if (/淘宝|京东|拼多多|购物|商店/.test(text)) {
    return 'shopping';
  }
  if (/桶装水|桶.*水|水.*桶|订水/.test(text)) {
    return 'daily';
  }
  if (/公交|地铁|打车|滴滴|出行|乘车|先乘后付/.test(text)) {
    return 'transport';
  }
  if (/理财|充值|提现/.test(transactionType)) {
    return 'other';
  }
  if (merchant && !/群收款|转账|红包/.test(transactionType)) {
    return 'other';
  }

  return 'other';
}

function excelSerialToISODate(serial: number): { date: string; time: string } {
  const utcMs = (serial - 25569) * 86400 * 1000;
  const date = new Date(utcMs);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}:${seconds}`,
  };
}

function parseWechatDate(value: unknown): { date: string; time: string } {
  if (typeof value === 'number' && value > 10000) {
    return excelSerialToISODate(value);
  }

  const str = String(value ?? '');
  if (!str) {
    const today = new Date();
    return {
      date: today.toISOString().split('T')[0],
      time: '12:00:00',
    };
  }

  const dtMatch = str.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (dtMatch) {
    return {
      date: `${dtMatch[1]}-${dtMatch[2].padStart(2, '0')}-${dtMatch[3].padStart(2, '0')}`,
      time: `${dtMatch[4].padStart(2, '0')}:${dtMatch[5].padStart(2, '0')}:${(dtMatch[6] || '00').padStart(2, '0')}`,
    };
  }

  const dMatch = str.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (dMatch) {
    return {
      date: `${dMatch[1]}-${dMatch[2].padStart(2, '0')}-${dMatch[3].padStart(2, '0')}`,
      time: '12:00:00',
    };
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return {
      date: parsed.toISOString().split('T')[0],
      time: `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}:${String(parsed.getSeconds()).padStart(2, '0')}`,
    };
  }

  const today = new Date();
  return {
    date: today.toISOString().split('T')[0],
    time: '12:00:00',
  };
}

function parseWechatAmount(value: unknown): number {
  if (typeof value === 'number') {
    return Math.abs(value);
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[¥￥,，\s"'""]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.abs(num);
  }
  return 0;
}

function parseWechatType(typeStr: string): 'income' | 'expense' {
  const cleaned = typeStr.replace(/\s/g, '');
  if (cleaned.includes('收入') || cleaned.includes('到账') || cleaned.includes('退款')) {
    return 'income';
  }
  return 'expense';
}

function extractRawData(jsonData: unknown[][]): string {
  return jsonData
    .map((row) => row.map((cell) => String(cell ?? '')).join(','))
    .filter((row) => row.trim())
    .join('\n');
}

interface WechatHeaderMap {
  date: number;
  transactionType: number;
  merchant: number;
  product: number;
  incomeExpense: number;
  amount: number;
  paymentMethod: number;
  status: number;
  transactionNo: number;
  merchantNo: number;
  remark: number;
}

function detectWechatHeaders(headers: string[]): WechatHeaderMap {
  const map: WechatHeaderMap = {
    date: -1,
    transactionType: -1,
    merchant: -1,
    product: -1,
    incomeExpense: -1,
    amount: -1,
    paymentMethod: -1,
    status: -1,
    transactionNo: -1,
    merchantNo: -1,
    remark: -1,
  };

  headers.forEach((header, index) => {
    const h = String(header || '');
    if (h.includes('交易时间') || (h.includes('时间') && !h.includes('类型'))) {
      map.date = index;
    } else if (h === '交易类型' || h.includes('交易类型')) {
      map.transactionType = index;
    } else if (h.includes('交易对方') || h.includes('对方')) {
      map.merchant = index;
    } else if (h === '商品' || h.includes('商品')) {
      map.product = index;
    } else if (h.includes('收/支') || h === '收支' || (h.includes('收支') && !h.includes('类型'))) {
      map.incomeExpense = index;
    } else if (h.includes('金额') || h.includes('元')) {
      map.amount = index;
    } else if (h.includes('支付方式')) {
      map.paymentMethod = index;
    } else if (h.includes('状态') || h.includes('当前')) {
      map.status = index;
    } else if (h.endsWith('交易单号') || h.includes('交易单号')) {
      map.transactionNo = index;
    } else if (h.includes('商户单号')) {
      map.merchantNo = index;
    } else if (h === '备注' || h.includes('备注')) {
      map.remark = index;
    }
  });

  return map;
}

function isWechatDataHeaderRow(row: unknown[]): boolean {
  if (!row || row.length < 4) return false;
  return row.some((cell) => {
    const s = String(cell || '');
    return s.includes('交易时间') || s.includes('交易类型');
  });
}

function findDataHeaderRow(jsonData: unknown[][]): number {
  for (let i = 0; i < jsonData.length; i++) {
    if (isWechatDataHeaderRow(jsonData[i])) {
      return i;
    }
  }
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i] as string[];
    if (row && row.length > 0) {
      const first = String(row[0] || '').toLowerCase();
      if (first.includes('交易时间') || first.includes('日期') || first.includes('date')) {
        return i;
      }
    }
  }
  return -1;
}

function isSkipRow(row: unknown[]): boolean {
  const firstCell = String(row[0] ?? '').trim();
  if (!firstCell) return false;
  if (/微信支付账单明细/.test(firstCell)) return true;
  if (/微信昵称/.test(firstCell)) return true;
  if (/起始时间/.test(firstCell)) return true;
  if (/终止时间/.test(firstCell)) return true;
  if (/导出类型/.test(firstCell)) return true;
  if (/导出时间/.test(firstCell)) return true;
  if (/共\d+笔记录/.test(firstCell)) return true;
  if (/收入.*笔.*元/.test(firstCell)) return true;
  if (/支出.*笔.*元/.test(firstCell)) return true;
  if (/中性交易.*笔.*元/.test(firstCell)) return true;
  if (/注：/.test(firstCell)) return true;
  if (/^\d+\./.test(firstCell) && !row[1]) return true;
  if (/充提|理财/.test(firstCell)) return true;
  return false;
}

function detectDateFormat(firstDateCell: unknown): 'serial' | 'string' {
  if (typeof firstDateCell === 'number' && firstDateCell > 40000) {
    return 'serial';
  }
  return 'string';
}

function parseWechatBill(
  jsonData: unknown[][],
  merchantMappings: MerchantMapping[] = []
): {
  transactions: Transaction[];
  errors: string[];
  totalRows: number;
  importedRows: number;
} {
  const result = {
    transactions: [] as Transaction[],
    errors: [] as string[],
    totalRows: 0,
    importedRows: 0,
  };

  const headerRowIndex = findDataHeaderRow(jsonData);
  if (headerRowIndex < 0) {
    result.errors.push('未找到数据表头，请确认文件为微信支付账单标准格式');
    return result;
  }

  const headers = jsonData[headerRowIndex] as string[];
  const headerMap = detectWechatHeaders(headers);

  if (headerMap.date < 0 || headerMap.amount < 0) {
    result.errors.push('缺少必要的交易时间或金额列，无法解析');
    return result;
  }

  const dateFormat = detectDateFormat(
    jsonData[headerRowIndex + 1]?.[headerMap.date]
  );

  const startRow = headerRowIndex + 1;

  for (let i = startRow; i < jsonData.length; i++) {
    const row = jsonData[i] as unknown[];
    if (!row || row.every((cell) => !cell)) continue;

    const firstCell = String(row[0] ?? '').trim();
    if (!firstCell) continue;
    if (/-----------.*微信支付账单明细列表.*----------/.test(firstCell)) continue;
    if (/微信支付账单明细列表/.test(firstCell)) continue;

    result.totalRows++;

    try {
      const dt = parseWechatDate(row[headerMap.date]);
      const amount = parseWechatAmount(row[headerMap.amount]);

      if (amount <= 0) {
        result.errors.push(`第${i + 1}行: 金额无效，已跳过`);
        continue;
      }

      let type: 'income' | 'expense' = 'expense';
      if (headerMap.incomeExpense >= 0) {
        type = parseWechatType(String(row[headerMap.incomeExpense] ?? ''));
      }

      const merchant =
        headerMap.merchant >= 0 ? String(row[headerMap.merchant] ?? '').trim() : '';
      const product =
        headerMap.product >= 0 ? String(row[headerMap.product] ?? '').trim() : '';
      const txType =
        headerMap.transactionType >= 0
          ? String(row[headerMap.transactionType] ?? '').trim()
          : '';
      const remark =
        headerMap.remark >= 0 ? String(row[headerMap.remark] ?? '').trim() : '';

      const noteParts: string[] = [];
      if (merchant) noteParts.push(merchant);
      if (product) noteParts.push(product);
      const note = noteParts.join(' - ') || remark || undefined;

      let category: string;
      const merchantMatch = applyMerchantMapping(merchant, merchantMappings);
      if (merchantMatch) {
        category = merchantMatch.category;
        type = merchantMatch.type;
      } else {
        category = detectCategory(merchant, product, txType);
      }

      const transaction: Transaction = {
        id: generateId(),
        amount,
        type,
        category,
        note,
        date: dt.date,
        createdAt: `${dt.date}T${dt.time}`,
      };

      result.transactions.push(transaction);
      result.importedRows++;
    } catch (error) {
      result.errors.push(`第${i + 1}行: 解析失败`);
      console.error(`Row ${i + 1} parse error:`, error);
    }
  }

  return result;
}

export async function parseExcelFileWithAI(
  file: File,
  apiKey: string,
  merchantMappings: MerchantMapping[] = []
): Promise<ExcelImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

        if (jsonData.length < 2) {
          resolve({
            success: false,
            transactions: [],
            errors: ['文件为空或格式不正确'],
            totalRows: 0,
            importedRows: 0,
            fileName: file.name,
          });
          return;
        }

        const rawData = extractRawData(jsonData);

        try {
          const aiRecords = await parseImportDataWithAI(apiKey, rawData);

          if (aiRecords.length > 0) {
            const transactions: Transaction[] = aiRecords.map((record) => {
              const merchantMatch = applyMerchantMapping(record.note || '', merchantMappings);
              return {
                id: generateId(),
                amount: record.amount,
                type: merchantMatch?.type || record.type,
                category: merchantMatch?.category || mapCategoryToId(record.category),
                note: record.note || '',
                date: record.date,
                createdAt: `${record.date}T12:00:00`,
              };
            });

            resolve({
              success: true,
              transactions,
              errors: [],
              totalRows: jsonData.length,
              importedRows: transactions.length,
              fileName: file.name,
            });
            return;
          }
        } catch (aiError) {
          console.error('AI解析失败，使用基础解析:', aiError);
        }

        const basicResult = parseWechatBill(jsonData, merchantMappings);
        resolve({
          success: basicResult.transactions.length > 0,
          transactions: basicResult.transactions,
          errors: basicResult.errors,
          totalRows: basicResult.totalRows,
          importedRows: basicResult.importedRows,
          fileName: file.name,
        });
      } catch (error) {
        console.error('Excel parse error:', error);
        resolve({
          success: false,
          transactions: [],
          errors: ['文件解析失败，请检查文件格式'],
          totalRows: 0,
          importedRows: 0,
          fileName: file.name,
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        transactions: [],
        errors: ['文件读取失败，请重试'],
        totalRows: 0,
        importedRows: 0,
        fileName: file.name,
      });
    };

    reader.readAsArrayBuffer(file);
  });
}

export function parseExcelFile(
  file: File,
  merchantMappings: MerchantMapping[] = []
): Promise<ExcelImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

        const result = parseWechatBill(jsonData, merchantMappings);
        resolve({
          success: result.transactions.length > 0,
          transactions: result.transactions,
          errors: result.errors,
          totalRows: result.totalRows,
          importedRows: result.importedRows,
          fileName: file.name,
        });
      } catch (error) {
        resolve({
          success: false,
          transactions: [],
          errors: ['文件解析失败，请检查文件格式'],
          totalRows: 0,
          importedRows: 0,
          fileName: file.name,
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        transactions: [],
        errors: ['文件读取失败，请重试'],
        totalRows: 0,
        importedRows: 0,
      });
    };

    reader.readAsArrayBuffer(file);
  });
}

export function parseCSVFile(
  file: File,
  merchantMappings: MerchantMapping[] = []
): Promise<ExcelImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n').filter((line) => line.trim());

        if (lines.length < 2) {
          resolve({
            success: false,
            transactions: [],
            errors: ['文件为空或格式不正确'],
            totalRows: 0,
            importedRows: 0,
            fileName: file.name,
          });
          return;
        }

        const parseCSVLine = (line: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        let headerRowIndex = findDataHeaderRow(
          lines.map((line) => line.split(','))
        );
        if (headerRowIndex < 0) {
          for (let i = 0; i < lines.length; i++) {
            const firstCell = lines[i].split(',')[0].toLowerCase();
            if (firstCell.includes('交易时间') || firstCell.includes('日期')) {
              headerRowIndex = i;
              break;
            }
          }
        }
        if (headerRowIndex < 0) headerRowIndex = 0;

        const headers = parseCSVLine(lines[headerRowIndex]);
        const headerMap = detectWechatHeaders(headers);

        const resultData: ExcelImportResult = {
          success: true,
          transactions: [],
          errors: [],
          totalRows: 0,
          importedRows: 0,
          fileName: file.name,
        };

        if (headerMap.date < 0 || headerMap.amount < 0) {
          resultData.errors.push('缺少必要的时间或金额列，无法解析');
          resolve(resultData);
          return;
        }

        for (let i = headerRowIndex + 1; i < lines.length; i++) {
          const row = parseCSVLine(lines[i]);
          if (row.every((cell) => !cell)) continue;

          resultData.totalRows++;

          try {
            const dt = parseWechatDate(row[headerMap.date]);
            const amount = parseWechatAmount(row[headerMap.amount]);

            if (amount <= 0) {
              resultData.errors.push(`第${i + 1}行: 金额无效，已跳过`);
              continue;
            }

            let type: 'income' | 'expense' = 'expense';
            if (headerMap.incomeExpense >= 0) {
              type = parseWechatType(String(row[headerMap.incomeExpense] ?? ''));
            }

            const merchant =
              headerMap.merchant >= 0 ? String(row[headerMap.merchant] ?? '').trim() : '';
            const product =
              headerMap.product >= 0 ? String(row[headerMap.product] ?? '').trim() : '';
            const txType =
              headerMap.transactionType >= 0
                ? String(row[headerMap.transactionType] ?? '').trim()
                : '';

            const noteParts: string[] = [];
            if (merchant) noteParts.push(merchant);
            if (product) noteParts.push(product);
            const note = noteParts.join(' - ') || undefined;

            let category: string;
            const merchantMatch = applyMerchantMapping(merchant, merchantMappings);
            if (merchantMatch) {
              category = merchantMatch.category;
              type = merchantMatch.type;
            } else {
              category = detectCategory(merchant, product, txType);
            }

            const transaction: Transaction = {
              id: generateId(),
              amount,
              type,
              category,
              note,
              date: dt.date,
              createdAt: `${dt.date}T${dt.time}`,
            };

            resultData.transactions.push(transaction);
            resultData.importedRows++;
          } catch (error) {
            resultData.errors.push(`第${i + 1}行: 解析失败`);
          }
        }

        resolve(resultData);
      } catch (error) {
        resolve({
          success: false,
          transactions: [],
          errors: ['文件解析失败，请检查文件格式'],
          totalRows: 0,
          importedRows: 0,
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        transactions: [],
        errors: ['文件读取失败，请重试'],
        totalRows: 0,
        importedRows: 0,
      });
    };

    reader.readAsText(file);
  });
}

export async function parseCSVFileWithAI(
  file: File,
  apiKey: string,
  merchantMappings: MerchantMapping[] = []
): Promise<ExcelImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n').filter((line) => line.trim());

        if (lines.length < 2) {
          resolve({
            success: false,
            transactions: [],
            errors: ['文件为空或格式不正确'],
            totalRows: 0,
            importedRows: 0,
            fileName: file.name,
          });
          return;
        }

        try {
          const aiRecords = await parseImportDataWithAI(apiKey, content);

          if (aiRecords.length > 0) {
            const transactions: Transaction[] = aiRecords.map((record) => {
              const merchantMatch = applyMerchantMapping(record.note || '', merchantMappings);
              return {
                id: generateId(),
                amount: record.amount,
                type: merchantMatch?.type || record.type,
                category: merchantMatch?.category || mapCategoryToId(record.category),
                note: record.note || '',
                date: record.date,
                createdAt: `${record.date}T12:00:00`,
              };
            });

            resolve({
              success: true,
              transactions,
              errors: [],
              totalRows: lines.length,
              importedRows: transactions.length,
              fileName: file.name,
            });
            return;
          }
        } catch (aiError) {
          console.error('AI解析失败，使用基础解析:', aiError);
        }

        const result = await parseCSVFile(file, merchantMappings);
        resolve(result);
      } catch (error) {
        resolve({
          success: false,
          transactions: [],
          errors: ['文件解析失败，请检查文件格式'],
          totalRows: 0,
          importedRows: 0,
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        transactions: [],
        errors: ['文件读取失败，请重试'],
        totalRows: 0,
        importedRows: 0,
      });
    };

    reader.readAsText(file);
  });
}
