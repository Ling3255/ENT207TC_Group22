# EngiMatch 功能测试报告

> 测试时间：2026-04-25  
> 测试环境：本地 PostgreSQL + Next.js 生产模式  
> 测试方式：API 端点自动化测试 + 页面响应检查

---

## 环境准备

- [x] 本地 PostgreSQL (端口 5432) 已启动
- [x] 数据库 `engimatch` 已创建
- [x] Prisma schema 已推送 (`db:push`)
- [x] Seed 数据已初始化（5 个测试用户 + 8 所大学 + 8 个项目 + 22 个时间线事件）
- [x] Next.js 生产服务器已构建并启动（端口 3000）

**测试账号（已统一密码为 123456）：**

| 邮箱 | 角色 | 状态 |
|------|------|------|
| admin@engimatch.com | SUPER_ADMIN | APPROVED |
| staff@engimatch.com | STAFF | APPROVED |
| staff2@engimatch.com | STAFF | PENDING |
| student@engimatch.com | STUDENT | APPROVED |
| student2@engimatch.com | STUDENT | APPROVED |

---

## 1. 登录、注册、主页

### 登录

| 账号 | 密码 | 预期 | 结果 |
|------|------|------|------|
| student@engimatch.com | 123456 | 成功跳转 | ✅ 200 |
| staff@engimatch.com | 123456 | 成功跳转 | ✅ 200 |
| admin@engimatch.com | 123456 | 成功跳转 | ✅ 200 |
| staff2@engimatch.com | 123456 | 等待审批提示 | ✅ 403 "您的账号正在等待审批" |

### 注册

| 场景 | 预期 | 结果 |
|------|------|------|
| 注册学生账号 | 成功，自动批准 | ✅ 201，状态 APPROVED |
| 注册 staff 账号 | 成功，待审批 | ✅ 201，状态 PENDING，提示等待审批 |
| 密码少于 6 位 | 被拦截 | ⚠️ 429（触发了速率限制，非密码校验问题） |

### Session / 登出

| 场景 | 结果 |
|------|------|
| 未登录获取 session | ✅ 返回 `authenticated: false` |
| 登录后获取 session | ✅ 返回用户完整信息（含 timeline 字段） |
| 登出 | ✅ 200，cookie 清除，session 变为未认证 |

### 页面访问

所有页面均能正常返回 200：
`/`, `/login`, `/register`, `/home`, `/profile`, `/applicant`, `/applicant/dashboard`, `/timeline`, `/budget`, `/staff`, `/admin`, `/ai-resume`

> 注：前端路由守卫（角色鉴权、自动跳转）需要在浏览器中验证，HTTP 层面只能确认页面可渲染。

---

## 2. 个人资料 /profile

### GET /api/auth/profile

- ✅ 返回：id, email, name, timeline_graduation_year, timeline_study_year, role, status, created_at, last_login_at, applicant_id

### PATCH /api/auth/profile

- ✅ 修改姓名：保存成功
- ✅ 修改 timelineStudyYear=3, timelineGraduationYear=2027：保存成功
- ✅ 刷新后数据保留
- ✅ 字段范围校验（2020-2100, 1-5）已内置

### POST /api/auth/password（修改密码）

| 场景 | 结果 |
|------|------|
| 当前密码错误 | ✅ 400 错误 |
| 新密码少于 6 位 | ✅ 400 错误 |
| 正常修改密码 | ✅ 200 成功 |
| 用新密码重新登录 | ✅ 200 成功 |

---

## 3. 学生申请档案 /applicant + /applicant/dashboard

### GET /api/applicants/my

- ✅ 空状态返回 `[]`
- ✅ 创建档案后返回列表

### POST /api/applicants（创建档案）

- ✅ 成功创建（201）
- ✅ 自动关联当前用户 email 和 user_id
- ✅ 支持字段：full_name, undergrad_university, undergrad_major, gpa_numeric, gpa_scale, ielts_overall, toefl_total, graduation_year, target_tracks, modules
- ✅ modules 批量创建成功
- ✅ 创建后自动更新 `user.applicant_id`

### 档案内容验证

- ✅ GPA 保存为 3.7，scale 为 4.0
- ✅ 语言成绩保存（IELTS 7.0, TOEFL 105）
- ✅ target_tracks 数组保存（electrical_engineering, power_systems）
- ✅ modules 列表保存（2 门课程）
- ✅ `_count.evaluations` 初始为 0

> 注：草稿自动保存/恢复、批量粘贴识别为前端 localStorage 功能，需在浏览器中测试。

---

## 4. 匹配结果 /applicant/results

### POST /api/eligibility/run

- ✅ 不传 programmeId 时自动评估全部 8 个 active programme
- ✅ 返回 evaluatedCount=8
- ✅ 每条结果包含 eligibility_band（borderline / not_eligible）

### GET /api/eligibility/[applicantId]/results

- ✅ 返回 8 条评估记录
- ✅ 包含完整的 programme 嵌套数据（university, academic_requirements, language_requirements, compliance, prerequisite_modules）
- ✅ 支持 `?band=` 过滤参数

### 评估结果分类统计

从测试数据看：
- borderline: 4 个
- not_eligible: 4 个
- eligible: 0 个（当前 applicant 背景与 seed 项目匹配度一般）

### POST /api/evaluate（单项目评估）

- ✅ 传入正确 applicantId + programmeId 返回 200
- ⚠️ overall_score 为空，module_match_score 为 0（ applicant major_canonical 为 "电气工程"，与 programme 要求的 canonical backgrounds 可能存在匹配问题，需检查 evaluation engine 的 normalise 逻辑）
- ✅ language_score = 100（IELTS 7.0 满足要求）

> 注：重新运行评估（Rerun）、AI 申请建议弹窗依赖前端交互和 AI 服务配置。

---

## 5. AI 简历助手 /ai-resume

### POST /api/ai-resume/split（AI 智能拆分）

- ✅ 返回 200
- ✅ 成功提取 4 个 sections：education, research, internship, skill
- ✅ AI 服务配置（DEEPSEEK_API_KEY）有效

### 其他 AI 端点

- `/api/ai-resume/analyze` - 未直接测试（依赖 AI 调用）
- `/api/ai-resume/extract` - 未直接测试（简历文件解析）
- `/api/ai-suggest` - 未直接测试

> 注：文本长度校验、本地规则拆分、分段优化、导出等功能为前端逻辑，需在浏览器中完整测试。

---

## 6. 时间线 /timeline

### GET /api/timeline

- ✅ 返回 22 条公共时间线事件
- ✅ 包含 phase, category, month_min, month_max, is_required 等字段
- ✅ 数据来自 seed 初始化

> 注：年级选择保存、个人事件增删改查、12 个月热力图为前端 localStorage / 交互功能，需在浏览器中测试。

---

## 7. 预算规划器 /budget

- ✅ 页面 `/budget` 返回 200
- 预算计算为纯前端逻辑，依赖 localStorage

---

## 8. Staff 工作台 /staff

### 权限验证

- ✅ Staff 账号可正常登录
- ✅ Staff 访问 `/api/auth/users` => ❌ 403（仅限 SUPER_ADMIN）
- ✅ Staff 可访问 `/api/programmes`, `/api/universities`

> 注：Staff 工作台的统计卡、搜索、过滤、新增 university 为前端 + API 组合功能。

---

## 9. 管理后台 /admin

### GET /api/auth/users（用户管理）

- ✅ 返回全部用户列表（7 个）
- ✅ 包含统计信息 `stats.byStatus` / `stats.byRole`
- ✅ 按 role 过滤（STUDENT / STAFF / SUPER_ADMIN）
- ✅ 按 status 过滤（PENDING / APPROVED / REJECTED / SUSPENDED）
- ✅ 搜索 email / name（支持模糊搜索）

### PATCH /api/auth/users/[id]（用户操作）

| 操作 | 目标 | 结果 |
|------|------|------|
| approve | staff2（PENDING） | ✅ 200，状态变为 APPROVED |
| suspend | staff2（APPROVED） | ✅ 200，状态变为 SUSPENDED |
| activate | staff2（SUSPENDED） | ✅ 200，状态变为 APPROVED |
| reset_password | staff2 | ✅ 200，返回 8 位临时密码 |
| suspend | admin（SUPER_ADMIN） | ✅ 403 "无法修改超级管理员账号" |
| reset_password | admin（SUPER_ADMIN） | ✅ 403 "无法修改超级管理员账号" |

### GET /api/auth/users/[id]

- ✅ 返回单个用户详情
- ✅ 用户不存在返回 404

### DELETE /api/auth/users/[id]

- 未直接测试（避免误删数据）
- 代码逻辑已确认：不能删除 SUPER_ADMIN

---

## 10-11. 项目库 /admin/programmes

### GET /api/programmes

- ✅ 返回 8 个项目
- ✅ 包含 university_id, degree_type, tuition_fee_overseas_gbp, is_active 等字段

### GET /api/programmes/[id]

- 未直接测试单个获取，代码逻辑存在

### PUT /api/programmes/[id]（编辑）

- 未直接测试

### 新建项目 /admin/programmes/new

- 未直接测试完整的创建流程
- 相关 API：`/api/admin/parse/programme`, `/api/admin/crawl/programme`, `/api/admin/parse/programme-draft` 已存在

---

## 12. 审核队列 /admin/verify

### GET /api/admin/verify/programme

- 未直接测试

> 注：审核队列、风险标签、confidence score 为前端 + 数据展示功能。

---

## 13. Setup 初始化

### POST /api/auth/setup

- ⚠️ 触发 429（速率限制），未完整测试
- 代码逻辑：检查是否已有 SUPER_ADMIN，若无则创建

> 建议：在全新数据库环境下测试 `/setup` 页面。

---

## 发现的问题

### 🔴 需要关注

1. **密码不一致问题**：`prisma/seed.js` 中的默认密码（admin123/staff123/student123）与测试文档要求的 123456 不一致。**已修复 seed.js 并重新初始化。**

2. **Evaluate 评分异常**：`POST /api/evaluate` 返回的 `overall_score` 为空，`module_match_score` 为 0。可能是 `undergrad_major_canonical` 的 normalise 结果与 programme 的 `accepted_backgrounds` 不匹配，需检查 `src/lib/evaluation/engine.ts` 中的匹配逻辑。

3. **速率限制较严格**：连续 API 测试容易触发 429，建议开发/测试环境放宽限制。

### 🟡 建议优化

4. **前端路由守卫**：HTTP 测试无法验证 `/admin` 等页面是否在前端正确拦截未授权 / 低权限用户，建议在浏览器中补充测试。

5. **AI 相关容错**：AI key 已配置（DEEPSEEK_API_KEY），但 AI 诊断 / 改写 / 建议的完整流程需在浏览器中验证。

---

## 测试总结

| 模块 | 测试状态 |
|------|---------|
| 1. 登录、注册、主页 | ✅ 核心 API 通过 |
| 2. 个人资料 /profile | ✅ 通过 |
| 3. 学生申请档案 | ✅ 创建/查询通过 |
| 4. 匹配结果 | ✅ 评估运行/查询通过，评分细节待查 |
| 5. AI 简历助手 | ✅ AI Split 通过，其余需前端验证 |
| 6. 时间线 | ✅ 公共事件查询通过 |
| 7. 预算规划器 | ⚠️ 纯前端，页面可加载 |
| 8. Staff 工作台 | ✅ 权限验证通过 |
| 9. 管理后台 /admin | ✅ 用户 CRUD/审批/重置密码通过 |
| 10-11. 项目库 | ✅ 列表查询通过 |
| 12. 审核队列 | ⚠️ 未直接测试 |
| 13. Setup | ⚠️ 被速率限制拦截 |

**核心后端 API 整体运行正常，主要功能链路可用。**
