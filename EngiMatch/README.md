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
│   └── api/
│       ├── programmes/               # 项目 CRUD API
│       ├── applicants/               # 申请者 CRUD API
│       ├── evaluate/                 # 评估引擎 API
│       └── universities/             # 大学数据 API
└── lib/
    ├── prisma.ts                     # Prisma Client 单例
    └── evaluation/
        └── engine.ts                 # 核心评估逻辑
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
