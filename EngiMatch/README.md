# EngiMatch

英国工程硕士项目智能匹配系统 — 为中国工科本科生评估英国院校适配度，提供 AI 简历优化与院校推荐。

## 技术栈

- **Framework**: Next.js 16.2.2 (App Router)
- **语言**: TypeScript 5
- **React**: 19.2.4
- **数据库**: PostgreSQL + Prisma 7.6.0
- **样式**: Tailwind CSS 4
- **AI**: DeepSeek API (via OpenAI SDK)
- **认证**: PBKDF2 + HMAC-SHA256 JWT，httpOnly Cookie

## 快速开始

### 前置要求

- Node.js 18+
- PostgreSQL 数据库

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/engimatch"
JWT_SECRET="your-jwt-secret"
PASSWORD_SALT="your-password-salt"
DEEPSEEK_API_KEY="your-deepseek-api-key"
OPENAI_BASE_URL="https://api.deepseek.com"
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npx prisma generate

# 同步数据库结构
npx prisma db push

# 填充种子数据
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
| `npm run db:migrate` | 运行数据库迁移 |
| `npm run db:seed` | 运行种子脚本 |
| `npm run db:studio` | 打开 Prisma Studio |
| `npm run db:reset` | 重置数据库 |

## 项目结构

```
src/
├── app/
│   ├── page.tsx                      # 首页
│   ├── applicant/
│   │   ├── page.tsx                  # 申请档案创建（3步表单）
│   │   ├── dashboard/page.tsx        # 申请档案仪表盘
│   │   └── results/page.tsx          # 评估结果 + AI 院校推荐
│   ├── admin/
│   │   ├── page.tsx                  # 管理后台首页
│   │   ├── users/page.tsx            # 用户管理（SUPER_ADMIN）
│   │   └── programmes/               # 项目管理
│   ├── staff/                        # 员工工作台
│   │   └── page.tsx                  # 项目审核与数据验证
│   ├── ai-resume/                    # AI 简历助手
│   │   ├── page.tsx                  # 选择方向和阶段
│   │   ├── upload/page.tsx           # 上传简历（PDF/DOCX/TXT）
│   │   ├── review/page.tsx           # 解析结果确认（支持手动调整）
│   │   ├── diagnose/page.tsx         # AI 诊断报告
│   │   ├── optimize/page.tsx         # 逐段优化（本地 + AI 改写）
│   │   └── final/page.tsx            # 最终版本保存/导出
│   └── api/
│       ├── auth/                     # 登录/注册/会话/用户管理
│       ├── programmes/               # 项目 CRUD
│       ├── applicants/               # 申请者 CRUD
│       ├── evaluate/                 # 评估引擎
│       ├── eligibility/              # 资格评估批量运行
│       ├── ai-resume/                # AI 简历 API
│       │   ├── analyze/route.ts      # AI 诊断 + AI 改写
│       │   ├── extract/route.ts      # 文件文本提取
│       │   ├── split/route.ts        # AI 简历分段
│       │   └── save/route.ts         # 保存最终版本
│       └── ai-suggest/route.ts       # AI 院校推荐
├── components/
│   ├── AppShell.tsx                  # 主导航布局（侧边栏 + 顶部）
│   └── SubNavTabs.tsx                # 子模块标签导航
├── context/
│   └── LocaleContext.tsx             # 中英文语言切换
└── lib/
    ├── prisma.ts                     # Prisma Client 单例
    ├── ai-client.ts                  # DeepSeek API 封装
    ├── auth.ts                       # JWT / 密码哈希 / 认证
    ├── api-utils.ts                  # API 工具（handler / 校验 / 限流）
    ├── evaluation/
    │   └── engine.ts                 # 核心评估引擎
    ├── resume-diagnostics.ts         # 本地简历诊断
    ├── resume-optimize.ts            # 本地简历优化
    └── resume-parser.ts              # 简历文本解析
```

## 核心功能

### 1. 用户认证与角色系统

- **注册 / 登录**：邮箱 + 密码，PBKDF2 哈希
- **JWT 会话**：httpOnly Cookie，自动续期
- **角色权限**：
  - `STUDENT` — 学生用户，使用申请匹配和 AI 简历
  - `STAFF` — 工作人员，访问 `/staff` 工作台
  - `SUPER_ADMIN` — 超级管理员，访问 `/admin` 全部功能

### 2. 申请者评估流程

1. **创建档案** — 基本信息、院校、专业、目标方向
2. **填写成绩** — GPA（支持不同满分制换算）、雅思/托福/PTE/Duolingo
3. **添加课程** — 本科课程列表（用于匹配先修要求）
4. **运行评估** — 引擎对所有英国工程硕士项目分类：
   - `eligible` — 符合申请条件
   - `borderline` — 条件边缘，建议确认
   - `not_eligible` — 暂不符合条件
5. **AI 院校推荐** — 基于背景和评估结果，AI 推荐冲刺/主申/保底院校

### 3. AI 简历助手 (`/ai-resume`)

6 步简历优化工作流：

| 步骤 | 页面 | 功能 |
|------|------|------|
| ① 选择方向 | `/ai-resume` | 22 种工程方向 + 申请阶段 |
| ② 上传简历 | `/ai-resume/upload` | 支持 PDF / DOCX / TXT / 直接粘贴 |
| ③ 确认结构 | `/ai-resume/review` | AI 自动分段，可手动增删改 |
| ④ AI 诊断 | `/ai-resume/diagnose` | 结构 / 完整度 / 适配度 / 英文质量 |
| ⑤ 逐段优化 | `/ai-resume/optimize` | 本地变体 + AI 改写 2-3 版本卡片对比 |
| ⑥ 最终版本 | `/ai-resume/final` | 保存到数据库 / 导出文本 / 同步档案 |

**AI 改写特点**：
- 调用 DeepSeek API，生成 **保守润色版 / 专业强化版 / 成果导向版** 三个版本
- 三个版本以**卡片形式并排展示**，直接对比内容，一键采纳
- 已采纳卡片绿色高亮，支持取消采纳

### 4. 评估引擎 (`lib/evaluation/engine.ts`)

纯规则引擎，**不依赖 AI**：

- **GPA**：归一化到 4.0 制，差距 ≤0.2 为边缘
- **英语**：雅思/托福/PTE/Duolingo 分别评估
- **背景匹配**：本科专业与项目接受范围对比
- **先修课程**：关键词模糊匹配申请者课程列表
- **合规检查**：ATAS、截止日期、Graduate Route
- **综合判定**：权重打分，输出中文解释

### 5. 管理后台

- `/admin` — 项目列表、编辑、原文对照验证（SUPER_ADMIN + STAFF）
- `/admin/users` — 用户管理（SUPER_ADMIN 独占）
- `/staff` — 项目审核工作台、数据验证（STAFF）

## AI 功能概览

| 功能 | API 路由 | 说明 |
|------|----------|------|
| 简历分段 | `POST /api/ai-resume/split` | AI 将简历文本分割为结构化段落 |
| 简历诊断 | `POST /api/ai-resume/analyze` (action=diagnose) | 四维度分析 + 综合评分 JSON |
| 简历改写 | `POST /api/ai-resume/analyze` (action=optimize) | 2-3 版本改写，卡片展示 |
| 院校推荐 | `POST /api/ai-suggest` | 基于背景推荐冲刺/主申/保底院校 |

## 部署建议

生产环境推荐：

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Nginx     │────►│  PM2 (Next) │────►│  PostgreSQL  │
│  (反向代理)  │     │  (npm start) │     │  (云 RDS)    │
└─────────────┘     └─────────────┘     └─────────────┘
```

1. `npm run build` 构建
2. `pm2 start npm --name engimatch -- start`
3. Nginx 反向代理到 `localhost:3000`
4. 云 PostgreSQL（阿里云 RDS / 腾讯云 PostgreSQL）

无需拆分前后端，保持 Next.js 全栈单部署。

## 种子数据

`prisma/seed.js` 包含：

- **8 所英国大学**：Imperial、Cambridge、Oxford、UCL、Manchester、Edinburgh、Birmingham、Sheffield
- **多个工程硕士项目**：机械、电子电气、计算机、航空航天等方向
- **示例用户和申请者**

## 环境变量清单

| 变量 | 必需 | 说明 |
|------|------|------|
| `DATABASE_URL` | ✅ | PostgreSQL 连接字符串 |
| `JWT_SECRET` | ✅ | JWT 签名密钥 |
| `PASSWORD_SALT` | ✅ | 密码哈希盐值 |
| `DEEPSEEK_API_KEY` | ⚠️ | DeepSeek API Key（AI 功能必需）|
| `OPENAI_BASE_URL` | ❌ | 默认 `https://api.deepseek.com` |
| `OPENAI_MODEL` | ❌ | 默认 `deepseek-chat` |
| `RATE_LIMIT_ENABLED` | ❌ | 生产环境默认启用 API 限流 |

## 注意事项

- 评估结果仅供参考，最终录取决定权在各院校招生办
- AI 功能依赖 DeepSeek API，需配置有效 API Key
- 首次使用请先访问 `/setup` 创建管理员账号
