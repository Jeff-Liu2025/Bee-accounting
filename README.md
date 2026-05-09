# 🐝 蜜蜂记账 (Bee Accounting)

> 一个面向大学生的轻量化 AI 智能记账工具，用 TRAE SOLO 通宵两天从 0 到 1 手搓出来。

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![DeepSeek](https://img.shields.io/badge/DeepSeek-API-1e3a8a)](https://platform.deepseek.com/)

---

## ✨ 核心功能

| 功能 | 说明 |
|------|------|
| 📝 **手动记账** | 金额、分类、时间、备注，支持支出/收入切换 |
| 🤖 **自然语言记账** | 打字如 "昨晚奶茶 18 块"，AI 自动解析生成账单 |
| 🎙️ **语音输入** | 长按麦克风，说话自动转文字记账 |
| 📊 **数据看板** | 月度收支趋势、分类饼图、消费排行 |
| 💰 **预算管理** | 按分类设预算，超支自动标红提醒 |
| 📥 **微信账单导入** | 支持 Excel/CSV，AI 智能解析自动分类 |
| 🤖 **AI 消费助手** | 对话式查询、月度总结、省钱建议 |
| ⚙️ **数据管理** | 一键清除、LocalStorage 导出备份 |

---

## 🚀 快速体验

### 在线演示
👉 [https://bee-accounting.vercel.app](https://bee-accounting.vercel.app)（部署后更新链接）

### 本地运行

```bash
# 1. 克隆仓库
git clone https://github.com/Jeff-Liu2025/bee-accounting.git
cd bee-accounting

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

---

## 🔑 配置 DeepSeek API Key

1. 前往 [DeepSeek 开放平台](https://platform.deepseek.com/) 注册账号
2. 新用户免费赠送 **5000 万 tokens**
3. 在应用内「我的」→「API 设置」中填入你的 API Key
4. Key 仅保存在本地浏览器，不会上传到任何服务器

---

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 6
- **样式方案**: Tailwind CSS 3
- **状态管理**: Zustand + Persist 中间件
- **图表**: Chart.js + react-chartjs-2
- **AI 能力**: DeepSeek API（自然语言解析、对话助手）
- **数据存储**: 浏览器 LocalStorage（纯前端，无后端）

---

## 📱 截图展示

（此处放 3-5 张核心页面截图）

---

## 🏆 参赛信息

本项目参加 **「AI 无限职场」SOLO 挑战赛**，使用 **TRAE SOLO** 完成全部开发。

- **参赛人**: 刘俊锋（Jeff）
- **学校**: 东莞理工学院
- **标签**: `Code with SOLO`

---

## 📄 License

MIT License © 2025 Jeff-Liu2025
