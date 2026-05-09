# 数据同步与适配修复 Spec

## Why
导入交易数据后，各模块（首页仪表盘、记账列表、预算管理）未能正确反映最新导入的数据，存在数据同步延迟、显示不一致、分类适配等问题，影响用户体验和数据准确性。

## What Changes
- 修复导入后数据同步问题，确保所有模块实时更新
- 修复 `createdAt` 时间戳丢失问题，保留原始交易时间
- 优化数据适配，确保分类匹配准确
- 添加导入成功后的反馈机制

## Impact
- Affected specs: 数据导入、首页仪表盘、预算管理
- Affected code: 
  - `src/pages/Profile/index.tsx` - 导入确认逻辑
  - `src/store/transactionStore.ts` - 数据存储逻辑
  - `src/utils/excelParser.ts` - 数据解析逻辑
  - `src/pages/Home/index.tsx` - 数据展示逻辑
  - `src/store/budgetStore.ts` - 预算计算逻辑

## ADDED Requirements

### Requirement: 数据导入同步
系统 SHALL 在导入交易数据后立即更新所有相关模块的显示数据。

#### Scenario: 导入后首页更新
- **WHEN** 用户成功导入交易数据
- **THEN** 首页仪表盘应立即显示更新后的收支统计
- **AND** 最近交易列表应显示新导入的记录

#### Scenario: 导入后预算更新
- **WHEN** 用户成功导入交易数据
- **THEN** 预算使用进度应反映新导入的支出数据

### Requirement: 时间戳保留
系统 SHALL 在导入数据时保留原始交易的创建时间信息。

#### Scenario: 保留原始时间
- **WHEN** 导入包含 `createdAt` 的交易数据
- **THEN** 系统应保留原始 `createdAt` 时间戳
- **AND** 不应用当前时间覆盖原始交易时间

### Requirement: 导入成功反馈
系统 SHALL 在导入完成后提供明确的成功反馈。

#### Scenario: 导入成功提示
- **WHEN** 用户确认导入交易数据
- **THEN** 系统应显示导入成功的提示信息
- **AND** 自动导航到首页查看新数据

## MODIFIED Requirements

### Requirement: addTransactions 方法
`addTransactions` 方法 SHALL 支持保留原始 `createdAt` 时间戳。

**原实现**:
```typescript
addTransactions: (transactionList) => {
  const newTransactions: Transaction[] = transactionList.map(t => ({
    ...t,
    id: generateId(),
    createdAt: new Date().toISOString(), // 问题：覆盖原始时间
  }));
  // ...
}
```

**修改后**:
```typescript
addTransactions: (transactionList) => {
  const newTransactions: Transaction[] = transactionList.map(t => ({
    ...t,
    id: generateId(),
    createdAt: t.createdAt || new Date().toISOString(), // 保留原始时间
  }));
  // ...
}
```

### Requirement: handleConfirmImport 方法
导入确认方法 SHALL 传递完整的交易数据，包括 `createdAt`。

**原实现**:
```typescript
const handleConfirmImport = () => {
  const transactionList = editableTransactions.map((t) => ({
    amount: t.amount,
    type: t.type,
    category: t.category,
    note: t.note,
    date: t.date,
    // 问题：丢失 createdAt
  }));
  addTransactions(transactionList);
};
```

**修改后**:
```typescript
const handleConfirmImport = () => {
  const transactionList = editableTransactions.map((t) => ({
    amount: t.amount,
    type: t.type,
    category: t.category,
    note: t.note,
    date: t.date,
    createdAt: t.createdAt, // 保留原始时间
  }));
  addTransactions(transactionList);
  // 添加成功反馈和导航
};
```

## Root Cause Analysis

### 问题1: 数据同步延迟
**原因**: Zustand 的 `persist` 中间件将数据持久化到 localStorage 是异步的，而组件可能在持久化完成前读取了旧数据。

**解决方案**: 
- 确保组件使用 Zustand 的 selector 正确订阅状态变化
- 导入完成后强制刷新相关数据

### 问题2: createdAt 时间戳丢失
**原因**: `handleConfirmImport` 映射数据时未包含 `createdAt` 字段，`addTransactions` 方法又用当前时间覆盖。

**解决方案**:
- 在 `handleConfirmImport` 中传递 `createdAt`
- 修改 `addTransactions` 方法保留原始 `createdAt`

### 问题3: 预算数据未更新
**原因**: `budgetStore` 通过 `transactionStoreGetState()` 获取数据，这是直接调用 store 方法而非响应式订阅。

**解决方案**:
- 预算组件应直接从 `transactionStore` 获取数据
- 或在导入后触发预算组件重新计算
