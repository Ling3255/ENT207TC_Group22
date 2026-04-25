# EngiMatch

英国工程硕士项目智能匹配系统 — 为中国工科本科生评估英国院校适配度。

## 技术栈

- **Framework**: Next.js 16 (App Router)
- **语言**: TypeScript
- **数据库**: PostgreSQL + Prisma ORM
- **样式**: Tailwind CSS

## 快速开始

### 前置要求

- Node.js 18+
- PostgreSQL 数据库

### 1. 安装依赖

```bash
npm install
```

### 2. 配置数据库

在 `.env` 文件中设置 PostgreSQL 连接字符串：

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/engimatch"
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npx prisma generate

# 同步数据库结构
npx prisma db push

# 填充种子数据（可选）
npm run db:seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 数据库命令

| 命令 | 说明 |
|------|------|
| `npm run db:generate` | 生成 Prisma Client |
| `npm run db:push` | 同步 schema 到数据库 |
| `npm run db:seed` | 运行种子脚本 |
| `npm run db:studio` | 打开 Prisma Studio |

## 项目结构

```
src/
├── app/
│   ├── page.tsx                      # 首页
│   ├── applicant/
│   │   ├── page.tsx                  # 申请档案创建（3步表单）
│   │   └── results/page.tsx          # 评估结果页面
│   ├── admin/
│   │   ├── page.tsx                  # 管理后台首页
│   │   └── programmes/
│   │       ├── page.tsx              # 项目列表
│   │       ├── [id]/page.tsx         # 项目编辑（原文对照）
│   │       └── new/page.tsx          # 添加新项目
│   ├── ai-resume/                     # AI 简历助手
│   │   ├── page.tsx                  # 首页（选择方向和阶段）
│   │   ├── upload/page.tsx           # 上传简历页
│   │   ├── review/page.tsx           # 解析结果确认页
│   │   ├── diagnose/page.tsx         # AI 诊断报告页
│   │   ├── optimize/page.tsx         # 逐段优化页
│   │   └── final/page.tsx            # 最终版本页
│   └── api/
│       ├── programmes/               # 项目 CRUD API
│       ├── applicants/               # 申请者 CRUD API
│       ├── evaluate/                 # 评估引擎 API
│       ├── universities/            # 大学数据 API
│       └── ai-resume/               # AI 简历分析 API
│           ├── analyze/route.ts     # AI 诊断与优化
│           ├── extract/route.ts      # 简历解析
│           └── split/route.ts       # 文本分割
├── context/
│   └── LocaleContext.tsx            # 语言切换上下文
└── lib/
    ├── prisma.ts                     # Prisma Client 单例
    ├── evaluation/
    │   └── engine.ts                 # 核心评估逻辑
    ├── ai-client.ts                  # AI 客户端封装
    ├── resume-diagnostics.ts         # 简历诊断逻辑
    ├── resume-optimize.ts            # 简历优化逻辑
    └── resume-parser.ts              # 简历解析逻辑
```

## 核心功能

### 申请者流程

1. **创建档案** — 填写基本信息（姓名、院校、专业）
2. **填写成绩** — GPA（支持不同满分制换算）、雅思/托福成绩
3. **添加课程** — 本科所学课程列表（用于匹配先修要求）
4. **获得结果** — 评估引擎对所有英国工程硕士项目进行分类：
   - `ELIGIBLE` — 符合申请条件
   - `BORDERLINE` — 条件边缘，建议确认
   - `NOT_ELIGIBLE` — 暂不符合条件

### AI 简历助手 (`/ai-resume`)

智能简历优化工具，专门针对英国工程硕士申请场景设计。

#### 功能列表

| 功能 | 说明 |
|------|------|
| **申请方向选择** | 支持 12 种工程方向：机械、电气、电子、控制、能源、材料、土木、计算机、车辆、航空航天、化学等 |
| **简历解析** | 自动识别简历中的教育背景、项目经历、实习经历、科研经历、技能等区块 |
| **AI 诊断报告** | 从四个维度分析简历：结构清晰度、内容完整度、申请适配度、英文表达质量 |
| **本地优化变体** | 提供保守润色版、动词强化版、专业强化版等多种本地优化选项 |
| **AI 智能改写** | AI 生成 2-3 个不同版本的改写（保守润色、工科强化、成果导向），可自由切换查看 |
| **中英文双语** | 界面支持中英文切换，对应诊断结果、提示文本、AI 响应语言同步切换 |
| **补充信息引导** | 系统自动检测简历缺失内容，提示用户补充量化指标、技术工具等 |
| **最终版本导出** | 保存到本地存储、导出为文本文件、同步到申请档案 |

#### 使用流程

```
1. 选择专业方向 + 申请阶段
     ↓
2. 上传或粘贴简历文本
     ↓
3. 确认 AI 解析的简历结构
     ↓
4. 查看 AI 诊断报告 + 本地诊断结果
     ↓
5. 逐段优化（选择本地变体或 AI 改写版本）
     ↓
6. 生成最终版本 → 保存/导出/同步
```

#### 技术亮点

- **本地诊断**：纯前端规则检测，无需 API 调用，实时反馈
- **AI 深度分析**：调用大模型 API，综合评分 + 详细建议
- **多版本解析**：AI 返回的多版本内容自动解析为可选择项
- **语言国际化**：完整的中英文双语支持，UI 和 AI 响应均可切换

### 管理后台

- 查看/搜索/筛选所有项目
- 编辑项目要求（基本信息、课程要求、英语要求）
- **原文对照** — 爬取的原始官网文本与结构化字段并排展示，用于人工验证解析结果
- 软删除项目

### 评估引擎 (`lib/evaluation/engine.ts`)

- **GPA**: 归一化到 4.0 制，差距 ≤0.2 为边缘
- **英语**: 雅思/托福分别评估，差距 ≤0.5（雅思）或 ≤5（托福）为边缘
- **课程匹配**: 关键词模糊匹配申请者课程列表
- **综合判定**: 三项各有权重，两项以上失败判定为 NOT_ELIGIBLE
- **中文解释**: 每项评估均附中文说明

## 种子数据

`prisma/seed.js` 包含：

- **8 所英国大学**：Imperial、Cambridge、Oxford、UCL、Manchester、Edinburgh、Birmingham、Sheffield
- **7 个工程硕士项目**：机械工程、电子电气、电力系统、先进制造等方向
- **1 个示例申请者**（zhangsan@example.com）：上海交大机械工程，GPA 3.5/4.0，雅思 6.5

## 注意事项

- 本系统 MVP 版本不含用户认证，所有数据公开可见
- 管理后台无需权限验证，建议在生产环境中添加管理员认证
- 评估结果仅供参考，最终录取决定权在各院校招生办
