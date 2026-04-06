# 🇬🇧 英国工程硕士申请评估系统 MVP

专为中国本科生申请英国授课型工程硕士打造的自动评估系统，一键评估录取概率，管理员后台支持维护项目要求。

## 🚀 技术栈
- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: PostgreSQL
- **ORM**: Prisma
- **验证**: Zod

## ✨ 核心功能
### 申请人端
1. ✅ 个人档案提交（GPA、本科院校、专业、英语成绩、已修课程）
2. ✅ 智能 eligibility 评估（符合要求/可以冲刺/暂不符合三个等级）
3. ✅ 中文说明未满足的要求
4. ✅ 评估结果页直观展示匹配分数和改进建议

### 管理员端
1. ✅ 项目管理后台
2. ✅ 结构化项目录取要求维护
3. ✅ 原始爬取文本和结构化字段并排展示，方便校验
4. ✅ 支持编辑GPA、语言成绩、先修课程等各类要求

## 🛠️ 快速启动
### 1. 环境准备
- Node.js >= 18
- PostgreSQL >= 14

### 2. 安装依赖
```bash
npm install
```

### 3. 配置数据库
1. 复制 `.env.example` 为 `.env`，修改 `DATABASE_URL` 为你的PostgreSQL连接地址
2. 创建数据库：`createdb uk_master_app`

### 4. 初始化数据库
```bash
npx prisma migrate dev --name init
```

### 5. 导入种子数据（包含3个示例英国工程项目+默认管理员账号）
```bash
npx prisma db seed
```
默认管理员账号：`admin` / `admin123`

### 6. 启动开发服务器
```bash
npm run dev
```
访问 http://localhost:3000 即可使用

## 📁 项目结构
```
├── prisma/
│   ├── schema.prisma    # Prisma 数据模型
│   └── seed.ts          # 种子数据
├── src/
│   ├── app/
│   │   ├── api/         # API 路由
│   │   │   ├── evaluate/      # 评估接口
│   │   │   └── admin/         # 管理员接口
│   │   ├── page.tsx      # 首页-档案提交
│   │   ├── results/      # 评估结果页
│   │   └── admin/        # 管理员后台
│   └── lib/
│       ├── prisma.ts     # Prisma 客户端
│       └── evaluationEngine.ts  # 核心评估引擎
├── package.json
└── README.md
```

## 🎯 核心评估逻辑
1. 院校分层：211/985院校GPA要求降低5分，双非要求提高5分
2. 多维度评估：GPA、语言成绩、先修课程三个核心维度
3. 评分机制：满分100分，80分以上为符合要求，60-80分为可以冲刺，60分以下为暂不符合
4. 中文解释：自动生成未满足要求的中文说明，清晰告知申请人提升方向

## 🔧 自定义配置
### 添加更多项目
1. 管理员登录 `/admin`，进入后台
2. 编辑现有项目或添加新项目（可直接在代码中扩展seed脚本批量导入）
3. 结构化录入录取要求，系统会自动用于评估

### 修改评估规则
编辑 `src/lib/evaluationEngine.ts` 即可自定义评估逻辑，比如修改院校分层规则、评分权重等。

## 🚢 生产部署
```bash
npm run build
npm start
```
建议部署到 Vercel / Netlify / 阿里云ECS，数据库使用 Supabase / 阿里云RDS PostgreSQL。

## 📝 后续迭代方向
- 增加更多院校的Tier列表，更精准的GPA要求匹配
- 支持软背景评估（科研、实习、竞赛等）
- 增加项目录取数据、往届案例参考
- 支持中文专业自动匹配英国院校专业要求
- 生成个性化申请建议报告
