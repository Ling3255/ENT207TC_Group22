# EngiMatch — 英国工程硕士项目智能匹配系统

> 文档版本：v1.0  
> 适用版本：v0.1.0  
> 最后更新：2026-04-22

---

## 目录

1. [系统概述](#一系统概述)
2. [技术架构](#二技术架构)
3. [账号体系与权限](#三账号体系与权限)
4. [功能模块详解](#四功能模块详解)
5. [数据库模型](#五数据库模型)
6. [API 接口清单](#六api-接口清单)
7. [部署与运维](#七部署与运维)
8. [使用流程指南](#八使用流程指南)
9. [开发规范](#九开发规范)
10. [注意事项](#十注意事项)

---

## 一、系统概述

**EngiMatch** 是一款面向中国工科本科生的英国工程硕士项目智能匹配系统。系统通过采集英国各大学官方工程硕士项目数据，结合申请者的本科背景、GPA、语言成绩、课程先修情况，运用评估引擎自动计算适配度，将项目分为 **符合申请条件 (ELIGIBLE)**、**条件边缘 (BORDERLINE)**、**暂不符合条件 (NOT_ELIGIBLE)** 三类，并给出详细的中文解释。

同时，系统集成 **AI 简历助手**，针对英国工程硕士申请场景，提供简历解析、AI 诊断、逐段优化、多版本改写等专业服务。

### 核心目标用户

| 用户类型 | 说明 |
|---------|------|
| 学生 (STUDENT) | 中国工科本科生，计划申请英国工程硕士 |
| 工作人员 (STAFF) | 留学顾问、教务人员，负责维护项目数据 |
| 超级管理员 (SUPER_ADMIN) | 系统管理员，全权管理系统用户和数据 |

---

## 二、技术架构

| 层级 | 技术选型 | 说明 |
|-----|---------|------|
| 前端框架 | Next.js 16 (App Router) | React 19 + TypeScript |
| 样式方案 | Tailwind CSS v4 | 原子化 CSS |
| 后端 API | Next.js API Routes | 内置服务端路由 |
| 数据库 | PostgreSQL 16 | 关系型数据库 |
| ORM | Prisma 7.6 | 类型安全的数据库访问 |
| AI 服务 | DeepSeek API | 简历解析、诊断、优化 |
| 认证 | JWT + Cookie | 基于密码哈希的会话管理 |
| 容器化 | Docker Compose | 一键启动数据库服务 |

### 项目结构

```
EngiMatch/
├── prisma/                 # 数据库 Schema + 种子数据
│   ├── schema.prisma       # 数据模型定义
│   └── seed.js             # 初始化种子脚本
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── page.tsx        # 登录页入口
│   │   ├── home/           # 用户首页（功能导航）
│   │   ├── login/          # 登录页
│   │   ├── register/       # 注册页
│   │   ├── setup/          # 首次初始化（创建超级管理员）
│   │   ├── applicant/      # 申请档案 + 评估结果
│   │   ├── ai-resume/      # AI 简历助手（6 步流程）
│   │   ├── timeline/       # 留学申请时间线
│   │   ├── staff/          # 工作人员后台
│   │   ├── admin/          # 超级管理后台
│   │   │   ├── users/      # 用户管理
│   │   │   ├── programmes/ # 项目管理
│   │   │   └── verify/     # 数据审核
│   │   └── api/            # RESTful API
│   ├── components/         # 公共组件
│   ├── context/            # React Context（语言切换等）
│   └── lib/                # 工具库 + 业务逻辑
│       ├── prisma.ts       # Prisma Client 单例
│       ├── evaluation/     # 评估引擎
│       ├── ai-client.ts    # AI 客户端封装
│       └── resume-*.ts     # 简历相关逻辑
├── public/                 # 静态资源
├── .env                    # 环境变量
└── docker-compose.yml      # Docker 配置
```

---

## 三、账号体系与权限

### 3.1 角色定义

系统采用 **RBAC（基于角色的访问控制）** 模型，共三种角色：

| 角色 | 标识 | 权限范围 | 注册方式 |
|-----|------|---------|---------|
| 超级管理员 | `SUPER_ADMIN` | 用户管理、项目全权限、数据审核、系统配置 | 系统初始化时自动创建 |
| 工作人员 | `STAFF` | 项目管理、数据审核、查看项目列表 | 自主注册，需超管审批 |
| 学生 | `STUDENT` | 创建申请档案、查看评估结果、使用 AI 简历助手 | 自主注册，即时可用 |

### 3.2 用户状态

| 状态 | 说明 | 可操作 |
|-----|------|--------|
| `PENDING` | 待审批（仅工作人员） | 不可登录 |
| `APPROVED` | 已批准 | 正常登录使用 |
| `REJECTED` | 已拒绝 | 不可登录 |
| `SUSPENDED` | 已停用 | 不可登录 |

### 3.3 首次使用 — 系统初始化

系统首次部署时，**没有默认账号**。需访问 `/setup` 页面执行初始化：

1. 浏览器访问 `http://localhost:3000/setup`
2. 点击"开始初始化"
3. 系统自动创建超级管理员账号：
   - **账号**：`admin@engimatch.com`
   - **密码**：`admin123`
4. **⚠️ 请立即登录并修改默认密码！**

> 若已存在超级管理员，访问 `/setup` 会自动重定向到登录页。

### 3.4 登录与跳转

登录后系统根据角色自动跳转：

| 角色 | 跳转页面 |
|-----|---------|
| SUPER_ADMIN | `/admin/users`（用户管理后台） |
| STAFF | `/staff`（工作人员后台） |
| STUDENT | `/applicant`（申请档案页） |

### 3.5 用户管理（仅超级管理员）

在 `/admin/users` 页面，超级管理员可以：

- **查看统计**：学生数、工作人员数、待审批数、总用户数
- **搜索筛选**：按邮箱/姓名搜索，按"待审批"筛选
- **审批工作人员**：批准或拒绝待审批的 STAFF 账号
- **账号管理**：停用/激活账号、重置密码（生成临时密码）
- **查看详情**：注册时间、最后登录时间等

---

## 四、功能模块详解

### 4.1 首页导航 (`/home`)

登录后的统一入口，展示四大功能卡片：

| 功能 | 路径 | 图标 | 说明 |
|-----|------|-----|------|
| AI 简历助手 | `/ai-resume` | ✦ | 智能简历诊断与优化 |
| 申请档案 | `/applicant` | 📋 | 填写背景信息，获取匹配结果 |
| 留学时间线 | `/timeline` | 📅 | 从 offer 到入境的全程时间规划 |
| 管理后台 | `/admin` | ⚙️ | 项目管理、用户管理、数据审核 |

### 4.2 申请档案与评估匹配 (`/applicant`)

#### 4.2.1 创建档案（分步表单）

申请者需填写以下信息：

**基本信息**
- 姓名、国籍、邮箱
- 本科院校、本科专业
- 毕业年份

**学术成绩**
- GPA（支持不同满分制自动换算）
- 评分体系（百分制/4.0/4.3/5.0 等）

**语言成绩**（至少填一种）
- 雅思：总分 + 听/说/读/写单项
- 托福：总分 + 各单项
- PTE、多邻国（可选）

**目标方向**
- 可多选：机械、电气、电子、控制、能源、材料、土木、计算机、车辆、航空航天、化学等

**本科课程**
- 支持批量粘贴导入（格式：`课程名 | 成绩 | 学分`）
- 自动解析并匹配先修课程要求

#### 4.2.2 评估结果 (`/applicant/results`)

评估引擎对系统中所有英国工程硕士项目进行自动匹配，结果分为三类：

| 结果等级 | 含义 | 颜色标识 |
|---------|------|---------|
| `ELIGIBLE` | 符合申请条件 | 🟢 绿色 |
| `BORDERLINE` | 条件边缘，建议确认 | 🟡 黄色 |
| `NOT_ELIGIBLE` | 暂不符合条件 | 🔴 红色 |

**评估维度**：

1. **学术成绩**：GPA 归一化到 4.0 制，差距 ≤ 0.2 为边缘
2. **语言成绩**：雅思/托福分别评估，差距 ≤ 0.5（雅思）/ 5（托福）为边缘
3. **课程匹配**：关键词模糊匹配申请者课程列表与项目先修要求
4. **综合判定**：三项各有权重，两项以上失败判定为 NOT_ELIGIBLE

每项评估均附 **中文解释**，说明具体差距和建议。

### 4.3 AI 简历助手 (`/ai-resume`)

专为英国工程硕士申请场景设计的智能简历优化工具，采用 **6 步流程**：

```
1. 选择方向 + 阶段
      ↓
2. 上传或粘贴简历文本
      ↓
3. 确认 AI 解析的简历结构
      ↓
4. 查看 AI 诊断报告 + 本地诊断结果
      ↓
5. 逐段优化（本地变体 / AI 改写版本）
      ↓
6. 生成最终版本 → 保存/导出/同步
```

#### 4.3.1 功能列表

| 功能 | 说明 |
|-----|------|
| **申请方向选择** | 12 种工程方向：机械、电气、电子、控制、能源、材料、土木、计算机、车辆、航空航天、化学等 |
| **申请阶段选择** | 无简历 / 有简历 / 即将投递 |
| **简历解析** | 自动识别教育背景、项目经历、实习经历、科研经历、技能等区块 |
| **AI 诊断报告** | 四维度分析：结构清晰度、内容完整度、申请适配度、英文表达质量 |
| **本地优化变体** | 保守润色版、动词强化版、专业强化版等多种本地优化选项（无需 API 调用） |
| **AI 智能改写** | AI 生成 2-3 个版本（保守润色、工科强化、成果导向），可自由切换 |
| **中英文双语** | 界面支持中英文切换，诊断结果、提示文本、AI 响应语言同步切换 |
| **补充信息引导** | 自动检测简历缺失内容，提示补充量化指标、技术工具等 |
| **最终版本导出** | 保存到本地存储、导出为文本文件 |

#### 4.3.2 技术亮点

- **本地诊断**：纯前端规则检测，无需 API 调用，实时反馈
- **AI 深度分析**：调用 DeepSeek API，综合评价 + 详细建议
- **多版本解析**：AI 返回的多版本内容自动解析为可选项
- **语言国际化**：完整的中英文双语支持

### 4.4 留学时间线 (`/timeline`)

面向 **2026 年 9 月入学** 的英国留学全程时间规划工具。

#### 4.4.1 五大阶段

| 阶段 | 中文 | 英文 | 时间范围 |
|-----|------|------|---------|
| preparation | 准备阶段 | Preparation | 申请前 6-12 个月 |
| application | 申请阶段 | Application | 投递申请、等 offer |
| visa | CAS 与签证 | CAS & Visa | 收到 offer 后 |
| pre_departure | 出行准备 | Pre-Departure | 出发前 1-3 个月 |
| arrival | 抵达注册 | Arrival & Registration | 抵英后 |

#### 4.4.2 功能特性

- **月份导航**：12 个月横向切换，高亮当前月份
- **进度追踪**：每个阶段显示完成百分比
- **事件筛选**：按阶段、类别（申请/语言/材料/财务/签证/健康/住宿/出行/注册/其他）筛选
- **必做标识**：关键节点标注"必做"标签
- **12 月热力图**：直观展示每个月的任务密度
- **状态追踪**：已完成 / 进行中 / 待办

#### 4.4.3 事件类别

📝 申请 · 🗣️ 语言 · 📁 材料 · 💰 财务 · 🛂 签证 · 🏥 健康 · 🏠 住宿 · ✈️ 出行 · 🏫 注册 · 📌 其他

### 4.5 管理后台

#### 4.5.1 工作人员后台 (`/staff`)

已通过审批的工作人员可访问：

- **项目列表** (`/admin/programmes`)：查看、编辑、添加英国工程项目
- **数据审核** (`/admin/verify`)：审核 AI 解析的数据，确保准确性
- **添加项目** (`/admin/programmes/new`)：手动添加新项目

工作人员职责：
- 维护官方大学网站的项目信息准确性
- 在数据上线前审核 AI 解析的数据
- 监控学生申请并提供支持
- 更新时间线事件和截止日期

#### 4.5.2 超级管理后台 (`/admin/users`)

超级管理员专属功能：

- **用户管理**：查看所有用户、审批工作人员、重置密码、停用账号
- **项目管理**：与工作人员相同，拥有全部项目 CRUD 权限
- **数据审核**：审核解析数据，原文对照编辑

### 4.6 项目管理 (`/admin/programmes`)

#### 4.6.1 项目字段结构

每个项目包含以下信息模块：

| 模块 | 字段示例 |
|-----|---------|
| 基本信息 | 项目名称、学位类型、学院、学制、入学学期、官网链接 |
| 申请信息 | 申请系统类型、开放日期、截止日期（签证/非签证） |
| 费用 | 本土学费、海外学费 |
| 学术要求 | 最低学位等级、UK 等级要求（2:1/2:2）、接受背景、不接受背景 |
| 先修课程 | 必修课程列表（含显示名称、最低成绩规则） |
| 语言要求 | 雅思总分/单项、托福、PTE、多邻国、有效期 |
| 申请材料 | 成绩单、个人陈述、推荐信、简历、作品集 |
| 合规信息 | ATAS 可能性、毕业生签证备注、签证截止备注 |
| 元数据 | 爬取原文、解析版本、置信度、人工验证状态 |

#### 4.6.2 数据审核 (`/admin/verify`)

- **原文对照**：爬取的原始官网文本与结构化字段并排展示
- **风险标注**：自动检测缺失截止日期、专业要求模糊、先修要求不清、语言要求需确认、ATAS 待确认、置信度低等问题
- **一键确认**：人工核对后标记为 `human_verified`

#### 4.6.3 数据抓取与解析流程

```
官网页面 ──爬取──→ 原始 HTML ──AI 解析──→ 结构化数据 ──人工验证──→ 上线
                    ↑________________________↓
                          原文对照审核
```

API 端点：
- `POST /api/admin/crawl/programme` — 爬取指定项目页面
- `POST /api/admin/parse/programme` — AI 解析原始文本
- `PATCH /api/admin/verify/programme` — 人工验证确认

---

## 五、数据库模型

### 5.1 核心实体关系

```
User (1) ──────→ (0..1) Applicant
  │
  ├── role: SUPER_ADMIN | STAFF | STUDENT
  └── status: PENDING | APPROVED | REJECTED | SUSPENDED

University (1) ──────→ (*) Programme
  │
  ├── name, slug, rank, official_domain
  └── programmes[]

Programme (1) ──────→ (1) ProgrammeAcademicRequirement
Programme (1) ──────→ (1) ProgrammeLanguageRequirement
Programme (1) ──────→ (1) ProgrammeDocument
Programme (1) ──────→ (1) ProgrammeCompliance
Programme (1) ──────→ (*) PrerequisiteModule
Programme (1) ──────→ (*) Evaluation

Applicant (1) ──────→ (*) ApplicantModule
Applicant (1) ──────→ (*) Evaluation

Applicant (1) + Programme (1) ──────→ (1) Evaluation
```

### 5.2 主要数据表

| 表名 | 说明 | 关键字段 |
|-----|------|---------|
| `users` | 用户账号 | email, password_hash, role, status, applicant_id |
| `universities` | 大学 | name, slug, rank, official_domain |
| `programmes` | 硕士项目 | programme_name, degree_type, official_url, human_verified, confidence_score |
| `programme_academic_requirements` | 学术要求 | min_uk_classification, accepted_backgrounds, prerequisite_module_logic |
| `prerequisite_modules` | 先修课程 | canonical_module_name, display_text, min_grade_rule, required |
| `programme_language_requirements` | 语言要求 | ielts_overall, ielts_lrw_min, toefl_total, pte_total |
| `programme_documents` | 申请材料 | transcript_required, personal_statement_required, references_required_count |
| `programme_compliance` | 合规信息 | atas_possible, graduate_route_note, visa_deadline_note |
| `applicants` | 申请者档案 | full_name, undergrad_university, undergrad_major, gpa_numeric, gpa_scale |
| `applicant_modules` | 申请者课程 | module_name_raw, canonical_module_name, grade_text, credits |
| `evaluations` | 评估结果 | academic_score, module_match_score, language_score, eligibility_band, explanation |
| `saved_resumes` | 保存的简历 | name, major, stage, raw_text, sections |
| `timeline_events` | 时间线事件 | title, phase, category, month_min, month_max, is_required |

### 5.3 种子数据

`prisma/seed.js` 初始化时提供：

- **8 所英国大学**：Imperial、Cambridge、Oxford、UCL、Manchester、Edinburgh、Birmingham、Sheffield
- **7 个工程硕士项目**：机械工程、电子电气、电力系统、先进制造等方向
- **1 个示例申请者**：zhangsan@example.com，上海交大机械工程，GPA 3.5/4.0，雅思 6.5

---

## 六、API 接口清单

### 6.1 认证相关

| 方法 | 路径 | 说明 | 权限 |
|-----|------|------|------|
| GET | `/api/auth/setup` | 检查是否需要初始化 | 公开 |
| POST | `/api/auth/setup` | 执行初始化，创建超管 | 公开 |
| POST | `/api/auth/register` | 注册账号 | 公开 |
| POST | `/api/auth/login` | 登录 | 公开 |
| POST | `/api/auth/logout` | 退出登录 | 需登录 |
| GET | `/api/auth/session` | 获取当前会话 | 需登录 |
| GET | `/api/auth/users` | 获取用户列表 | SUPER_ADMIN |
| PATCH | `/api/auth/users/[id]` | 操作用户（审批/停用/重置密码） | SUPER_ADMIN |

### 6.2 申请档案

| 方法 | 路径 | 说明 |
|-----|------|------|
| POST | `/api/applicants` | 创建申请档案 |
| GET | `/api/applicants/[id]` | 获取档案详情 |
| PATCH | `/api/applicants/[id]` | 更新档案 |
| POST | `/api/applicants/[id]/modules` | 批量添加课程 |

### 6.3 评估引擎

| 方法 | 路径 | 说明 |
|-----|------|------|
| POST | `/api/evaluate` | 运行评估（对指定申请者） |
| POST | `/api/eligibility/run` | 运行适配度检查 |
| GET | `/api/eligibility/[applicantId]/results` | 获取评估结果 |

### 6.4 项目管理

| 方法 | 路径 | 说明 | 权限 |
|-----|------|------|------|
| GET | `/api/programmes` | 获取项目列表 | 公开/登录 |
| POST | `/api/programmes` | 创建新项目 | STAFF+/SUPER_ADMIN |
| GET | `/api/programmes/[id]` | 获取项目详情 | 公开/登录 |
| PATCH | `/api/programmes/[id]` | 更新项目 | STAFF+/SUPER_ADMIN |
| DELETE | `/api/programmes/[id]` | 软删除项目 | STAFF+/SUPER_ADMIN |
| GET | `/api/universities` | 获取大学列表 | 公开 |

### 6.5 AI 简历助手

| 方法 | 路径 | 说明 |
|-----|------|------|
| POST | `/api/ai-resume/extract` | 解析简历文本为结构化数据 |
| POST | `/api/ai-resume/analyze` | AI 诊断与优化建议 |
| POST | `/api/ai-resume/split` | 文本分割处理 |
| POST | `/api/ai-resume/save` | 保存优化后的简历 |

### 6.6 数据管理（爬虫/解析/验证）

| 方法 | 路径 | 说明 | 权限 |
|-----|------|------|------|
| POST | `/api/admin/crawl/programme` | 爬取项目页面 | STAFF+/SUPER_ADMIN |
| POST | `/api/admin/parse/programme` | AI 解析原始数据 | STAFF+/SUPER_ADMIN |
| PATCH | `/api/admin/verify/programme` | 人工验证确认 | STAFF+/SUPER_ADMIN |

### 6.7 时间线

| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | `/api/timeline` | 获取所有时间线事件 |

---

## 七、部署与运维

### 7.1 环境要求

- Node.js 18+
- PostgreSQL 14+
- Docker（可选，用于本地数据库）

### 7.2 环境变量

```env
# 数据库连接（必填）
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/engimatch?schema=public"

# AI 服务（必填）
DEEPSEEK_API_KEY="your-api-key"
OPENAI_BASE_URL="https://api.deepseek.com"
OPENAI_MODEL="deepseek-chat"

# 认证安全（必填，生产环境请修改）
PASSWORD_SALT="engimatch-salt"
JWT_SECRET="engimatch-jwt-secret-change-in-production"
```

### 7.3 快速启动

```bash
# 1. 安装依赖
npm install

# 2. 启动数据库（Docker）
docker-compose up -d

# 3. 初始化数据库
npx prisma generate
npx prisma db push

# 4. 填充种子数据（可选）
npm run db:seed

# 5. 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 7.4 数据库命令

| 命令 | 说明 |
|-----|------|
| `npm run db:generate` | 生成 Prisma Client |
| `npm run db:push` | 同步 schema 到数据库 |
| `npm run db:migrate` | 创建并应用迁移 |
| `npm run db:seed` | 运行种子脚本 |
| `npm run db:studio` | 打开 Prisma Studio 可视化工具 |
| `npm run db:reset` | 重置数据库（⚠️ 数据清空） |

### 7.5 Docker 配置

`docker-compose.yml` 提供本地 PostgreSQL 服务：

- 镜像：`postgres:16-alpine`
- 容器名：`engimatch-db`
- 端口：`5433`（避免与本地 PostgreSQL 5432 冲突）
- 用户名/密码：`postgres` / `postgres`

---

## 八、使用流程指南

### 8.1 系统管理员首次部署

1. 部署代码并配置 `.env`
2. 启动数据库服务
3. 访问 `/setup` 初始化超级管理员
4. 登录超管账号，修改默认密码
5. 进入 `/admin/users` 审批工作人员注册

### 8.2 工作人员日常工作

1. **维护项目数据**
   - 使用爬虫抓取新项目的官网数据
   - 在 `/admin/verify` 审核 AI 解析结果
   - 编辑修正不准确的信息
   - 标记人工验证通过

2. **监控数据质量**
   - 关注风险标签（缺失截止日期、专业要求模糊等）
   - 定期更新申请截止日期和学费信息

### 8.3 学生使用流程

1. **注册账号** → 访问 `/register`，选择"学生"角色
2. **登录系统** → 自动跳转到 `/applicant`
3. **创建档案** → 填写基本信息、学术成绩、语言成绩、目标方向、本科课程
4. **查看评估** → 系统自动运行评估，查看 ELIGIBLE/BORDERLINE/NOT_ELIGIBLE 结果
5. **使用 AI 简历助手** → `/ai-resume`，上传简历获取诊断和优化建议
6. **查看时间线** → `/timeline`，规划申请时间线

---

## 九、开发规范

### 9.1 代码风格

- TypeScript 严格模式
- Tailwind CSS 原子化样式
- React Server Components 优先（页面级）
- Client Components 用于交互逻辑（标记 `"use client"`）

### 9.2 API 规范

- 统一返回格式：`{ data?: T, error?: string }`
- HTTP 状态码规范：200 成功、201 创建、400 请求错误、401 未认证、403 无权限、404 不存在、500 服务器错误
- Prisma 操作通过 `@/lib/prisma` 单例访问

### 9.3 国际化

- 系统支持 **中英文双语**
- 翻译文件位于 `src/context/LocaleContext.tsx`
- 界面文本通过 `useLocale().t(key)` 获取
- AI 提示词根据 `locale` 动态切换语言

---

## 十、注意事项

1. **安全性**
   - 生产环境务必修改 `JWT_SECRET` 和 `PASSWORD_SALT`
   - 默认超管密码 `admin123` 必须在首次登录后立即修改
   - 建议为管理后台增加 IP 白名单或二次验证

2. **数据质量**
   - 评估结果**仅供参考**，最终录取决定权在各院校招生办
   - AI 解析的数据可能存在误差，必须经过人工验证后才能信赖
   - 官网信息变更频繁，建议定期更新项目数据

3. **AI 服务**
   - AI 简历助手依赖 DeepSeek API，需要有效的 API Key
   - API 调用有费用，请合理控制使用量
   - 简历解析支持 `.docx` 和 `.pdf` 格式（需 mammoth/pdf-parse）

4. **性能**
   - 评估引擎在课程较多时可能较慢，建议异步执行
   - 大量项目数据时，前端列表使用分页或虚拟滚动

5. **浏览器兼容**
   - 支持现代浏览器（Chrome、Firefox、Safari、Edge 最新版本）
   - IE 不支持

---

## 附录

### A. 默认账号

| 账号类型 | 邮箱 | 密码 | 说明 |
|---------|------|------|------|
| 超级管理员 | `admin@engimatch.com` | `admin123` | 初始化后创建，需立即修改 |
| 示例学生 | `zhangsan@example.com` | （种子数据无密码） | 仅作数据展示 |

### B. 相关链接

- Next.js 文档：`node_modules/next/dist/docs/`
- Prisma 文档：https://www.prisma.io/docs
- Tailwind CSS 文档：https://tailwindcss.com/docs
- DeepSeek API：https://api.deepseek.com

---

*本文档由 EngiMatch 开发团队维护。如有问题，请联系系统管理员。*
