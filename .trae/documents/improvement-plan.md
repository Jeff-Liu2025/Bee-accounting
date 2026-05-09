# 蜜蜂记账改进计划

## P0 — 关键问题

### 1. 记账页添加日期选择器
**文件**: `src/pages/AddRecord/index.tsx`

**问题**: `handleSave` 硬编码 `date: getToday()`，用户无法补记历史账单

**实现步骤**:
1. 新增 state `const [date, setDate] = useState(getToday())`
2. 在金额输入区域下方添加日期选择器组件（使用 `<input type="date">`）
3. 修改 `handleSave` 使用 `date` state 而非 `getToday()`
4. 样式：与现有输入框风格一致，支持深色模式

---

### 2. 交易列表添加编辑/删除入口
**文件**: `src/pages/Home/index.tsx`, `src/pages/Stats/index.tsx`

**问题**: Store 有 `updateTransaction` 和 `deleteTransaction`，但 UI 无入口

**实现步骤**:
1. **Home 页面**:
   - 修改 `TransactionItem` 组件调用，传入 `editable={true}`
   - 传入 `onSave` 调用 `updateTransaction`
   - 传入 `onDelete` 调用 `deleteTransaction`
   - 添加确认删除弹窗（防止误删）

2. **Stats 页面**:
   - 同上，在交易列表区域添加编辑能力

3. **交互优化**:
   - 悬停显示编辑图标（已实现）
   - 删除前弹出确认对话框

---

## P1 — 重要优化

### 3. 统计页饼图颜色动态扩展
**文件**: `src/pages/Stats/index.tsx`

**问题**: `backgroundColor` 数组只有 7 色，分类超过 7 个会越界

**实现步骤**:
1. 创建颜色生成函数，支持动态扩展：
   ```typescript
   const CHART_COLORS = [
     '#FFD700', '#FFA500', '#32CD32', '#4169E1', 
     '#9370DB', '#FF69B4', '#20B2AA', '#FF6347',
     '#00CED1', '#FF1493', '#7B68EE', '#3CB371'
   ];
   
   function getChartColor(index: number): string {
     return CHART_COLORS[index % CHART_COLORS.length];
   }
   ```
2. 修改 `pieData.datasets[0].backgroundColor` 为动态映射

---

### 4. 优化 parseAIResponse JSON 解析
**文件**: `src/services/prompts.ts`

**问题**: 正则 `/\{[\s\S]*\}/` 贪婪匹配，嵌套 JSON 会出问题

**实现步骤**:
1. 新增更健壮的 JSON 提取函数：
   ```typescript
   function extractJSON<T>(response: string): T | null {
     // 尝试直接解析
     try {
       return JSON.parse(response);
     } catch {}
     
     // 提取第一个完整 JSON 对象/数组
     let depth = 0;
     let start = -1;
     for (let i = 0; i < response.length; i++) {
       if (response[i] === '{' || response[i] === '[') {
         if (depth === 0) start = i;
         depth++;
       } else if (response[i] === '}' || response[i] === ']') {
         depth--;
         if (depth === 0 && start >= 0) {
           try {
             return JSON.parse(response.slice(start, i + 1));
           } catch {}
         }
       }
     }
     return null;
   }
   ```
2. 替换现有 `parseAIResponse` 实现

---

### 5. 清理 console.log
**文件**: `src/store/transactionStore.ts`, `src/utils/excelParser.ts`

**实现步骤**:
1. 删除 `transactionStore.ts` 中的 `console.log('Adding transaction:', ...)`
2. 删除 `transactionStore.ts` 中的 `console.log('Adding transactions:', ...)`
3. 删除 `excelParser.ts` 中所有调试用的 `console.log`

---

### 6. API Key 存储优化
**文件**: `src/pages/Profile/index.tsx`

**问题**: 明文存储，用户清浏览器会丢失

**实现步骤**:
1. 在 API Key 配置区域添加提示文字：
   > "API Key 仅存储在本地浏览器，清除浏览器数据会导致丢失，请妥善保管"
2. 可选：添加「导出配置」按钮，将 API Key 包含在导出数据中

---

## P2 — 锦上添花

### 7. AI 对话添加上下文记忆
**文件**: `src/pages/AIAssistant/index.tsx`, `src/services/aiParser.ts`

**问题**: 每次调用没传历史消息，AI 不知道之前聊了什么

**实现步骤**:
1. 修改 `chatWithAssistant` 函数签名，接收 `chatHistory` 参数
2. 构建消息数组时，添加最近 N 条历史消息（限制 token 数）
3. 在 `AIAssistant` 页面调用时传入 `chatHistory`

---

### 8. 语音输入功能实现
**文件**: `src/pages/AddRecord/index.tsx`

**问题**: 导入了 `Mic` 图标但未绑定事件

**实现步骤**:
1. 创建 `useSpeechRecognition` hook（使用 Web Speech API）
2. 在记账页添加语音按钮点击事件
3. 语音识别结果填入备注或触发 AI 解析
4. 添加浏览器兼容性检测和提示

---

### 9. 清除数据改为精确清理
**文件**: `src/pages/Profile/index.tsx`

**问题**: `localStorage.clear()` 会清除同域下所有数据

**实现步骤**:
1. 修改 `handleClearAllData` 函数：
   ```typescript
   const handleClearAllData = () => {
     if (confirm('确定要清除所有数据吗？此操作不可恢复。')) {
       Object.keys(localStorage)
         .filter(key => key.startsWith('bee_accounting_'))
         .forEach(key => localStorage.removeItem(key));
       window.location.reload();
     }
   };
   ```

---

### 10. 导入预览 Modal 滚动优化
**文件**: `src/pages/Profile/index.tsx`

**问题**: 移动端长列表滚动体验问题

**实现步骤**:
1. 检查滚动容器层级，避免嵌套滚动
2. 为交易列表区域添加 `-webkit-overflow-scrolling: touch`
3. 考虑虚拟列表优化（如果记录超过 50 条）

---

## 实施顺序

| 优先级 | 任务 | 预估工作量 |
|--------|------|------------|
| P0-1 | 记账页日期选择器 | 小 |
| P0-2 | 交易编辑/删除入口 | 中 |
| P1-3 | 饼图颜色扩展 | 小 |
| P1-4 | JSON 解析优化 | 小 |
| P1-5 | 清理 console.log | 小 |
| P1-6 | API Key 提示 | 小 |
| P2-7 | AI 上下文记忆 | 小 |
| P2-8 | 语音输入 | 中 |
| P2-9 | 精确清除数据 | 小 |
| P2-10 | Modal 滚动优化 | 小 |

建议按 P0 → P1 → P2 顺序实施。
