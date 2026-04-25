# EngiMatch — 系统账号密码清单

> 生成时间：2026-04-22  
> 数据来源：`prisma/seed.js` + 数据库实时查询  
> ⚠️ **安全提示**：本文件包含明文测试密码，仅供内部开发/测试使用，请勿上传至公开仓库或生产环境。

---

## 一、账号概览

当前数据库中共有 **5 个用户账号**，均为种子数据（`prisma/seed.js`）初始化时创建，无额外注册用户。

| 序号 | 邮箱 | 姓名 | 角色 | 状态 | 最后登录 |
|:---:|------|------|------|:---:|---------|
| 1 | admin@engimatch.com | 超级管理员 | SUPER_ADMIN | ✅ 已批准 | 2026-04-22 |
| 2 | staff@engimatch.com | 张老师 | STAFF | ✅ 已批准 | 2026-04-22 |
| 3 | staff2@engimatch.com | 李老师 | STAFF | ✅ 已批准 | 2026-04-22 |
| 4 | student@engimatch.com | 王小明 | STUDENT | ✅ 已批准 | 2026-04-22 |
| 5 | student2@engimatch.com | 李小红 | STUDENT | ✅ 已批准 | 2026-04-22 |

---

## 二、Staff（工作人员）账号

| 邮箱 | 密码 | 姓名 | 状态 | 说明 |
|------|------|------|------|------|
| `staff@engimatch.com` | `123456` | 张老师 | 已批准 | 测试用工作人员账号，可直接登录 |
| `staff2@engimatch.com` | `123456` | 李老师 | 已批准 | 测试用工作人员账号，可直接登录 |

**Staff 登录后跳转**：`/staff`（工作人员后台）

**Staff 可访问功能**：
- 项目列表管理 (`/admin/programmes`)
- 数据审核 (`/admin/verify`)
- 添加新项目 (`/admin/programmes/new`)

---

## 三、Student（学生）账号

| 邮箱 | 密码 | 姓名 | 状态 | 说明 |
|------|------|------|------|------|
| `student@engimatch.com` | `123456` | 王小明 | 已批准 | 测试用学生账号 |
| `student2@engimatch.com` | `123456` | 李小红 | 已批准 | 测试用学生账号 |

**Student 登录后跳转**：`/applicant`（申请档案页）

**Student 可访问功能**：
- 填写/修改申请档案 (`/applicant`)
- 查看评估匹配结果 (`/applicant/results`)
- AI 简历助手 (`/ai-resume`)
- 留学时间线 (`/timeline`)

---

## 四、Super Admin（超级管理员）账号

| 邮箱 | 密码 | 姓名 | 状态 | 说明 |
|------|------|------|------|------|
| `admin@engimatch.com` | `123456` | 超级管理员 | 已批准 | 系统初始化时创建 |

**Super Admin 登录后跳转**：`/admin/users`（用户管理后台）

**Super Admin 专属功能**：
- 用户管理（审批 Staff、重置密码、停用账号）
- 项目管理（全部 CRUD 权限）
- 数据审核（原文对照、风险标注）

---

## 五、登录地址

```
http://localhost:3000/login
```

或访问首页后点击登录：
```
http://localhost:3000
```

---

## 六、密码规则说明

系统密码哈希算法为：**SHA-256(password + SALT)**

- 盐值（SALT）读取自环境变量 `PASSWORD_SALT`，默认值为 `engimatch-salt`
- 注册时要求密码至少 **6 位字符**
- 生产环境请务必修改 `JWT_SECRET` 和 `PASSWORD_SALT`

---

*本文档由系统自动生成，如有新增注册用户请手动补充更新。*
