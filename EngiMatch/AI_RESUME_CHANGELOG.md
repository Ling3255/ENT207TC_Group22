# AI 简历助手修改日志

## 📋 概述

本文档记录了 `ai-resume` 模块的所有开发工作，包括新功能、bug 修复和优化。

---

## 2024年4月 重大更新

### 1. 中英文双语支持

**问题**：用户切换到英文模式后，界面仍然显示中文，AI 分析结果也是中文。

**修改文件**：
- `src/lib/resume-diagnostics.ts`
- `src/lib/resume-optimize.ts`
- `src/app/api/ai-resume/analyze/route.ts`
- `src/app/ai-resume/diagnose/page.tsx`
- `src/app/ai-resume/optimize/page.tsx`

**实现内容**：
- 诊断问题文本双语化：创建 `ISSUE_TEXT` 对象，包含所有诊断问题的中英文标题、描述、建议
- `runDiagnostics()` 新增 `locale` 参数，根据语言环境返回对应语言的诊断结果
- 优化版本标签双语化：`VARIANT_LABELS` 支持中英文标签和描述
- 提示文本双语化：`MISSING_HINTS` 支持中英文
- API 国际化：接收 `locale` 参数，英文模式下 AI 返回英文内容

```typescript
// 示例：诊断问题的多语言支持
const ISSUE_TEXT: Record<string, { title: { zh: string; en: string }; desc: { zh: string; en: string }; sugg: { zh: string; en: string } }> = {
  weak_methodology: {
    title: { zh: "项目方法描述不足", en: "Insufficient Project Methodology Description" },
    desc: {
      zh: "简历中的项目描述较少涉及具体方法、工具或流程。英国工科申请希望看到你 '如何做的'，而不仅仅是 '做了什么'。",
      en: "Your project descriptions lack specific methods, tools, or processes. UK engineering admissions want to see HOW you did it, not just WHAT you did.",
    },
    // ...
  },
};
```

---

### 2. AI 优化版本选择功能

**问题**：AI 返回的 3 个版本（保守润色版、工科强化版、成果导向版）显示在一个文本框中，用户无法分别选择。

**修改文件**：
- `src/app/ai-resume/optimize/page.tsx`

**实现内容**：
- 新增状态：`aiVariants` 存储解析后的多版本数组，`selectedAiVariant` 记录当前选中版本
- 版本解析逻辑：使用 `---` 分隔符拆分 AI 返回内容，自动识别版本标题
- 版本选择器 UI：显示「选项 1」「选项 2」「选项 3」按钮，点击切换查看不同版本

```typescript
// 解析 AI 返回的多版本
const parts = data.optimized.split(/^---+$/m);
for (const part of parts) {
  const titleMatch = part.match(/^(?:【|\[)([^\]】]+)(?::|】|\])/);
  if (titleMatch) {
    const label = titleMatch[1].trim();
    const text = part.replace(/^[^\n]*\n/, "").trim();
    variants.push({ label, text });
  }
}
```

---

### 3. Bug 修复：Record 类型兼容性

**问题**：Turbopack 构建时报错 `ReferenceError: Record is not defined`

**修改文件**：
- `src/app/ai-resume/optimize/page.tsx`

**实现内容**：
- 将 `useState<Record<string, string>>({})` 改为显式类型别名

```typescript
type StringRecord = { [key: string]: string };
type VariantArrayRecord = { [key: string]: Array<{ label: string; text: string }> };

// 使用
const [aiVariants, setAiVariants] = useState<VariantArrayRecord>({});
const [selectedAiVariant, setSelectedAiVariant] = useState<StringRecord>({});
```

---

### 4. Bug 修复：AI 优化版本未保存到最终版本

**问题**：用户在 AI 优化页面选择了 AI 改写版本，但最终版本中没有应用该版本。

**修改文件**：
- `src/app/ai-resume/optimize/page.tsx`

**原因**：原代码只检查 `customEdits` 和本地变体，未检查 `aiOptimizations`

**实现内容**：
- 修改 `handleGenerateFinal()` 函数，调整内容优先级：
  1. `customEdits`（用户手动编辑）最高优先级
  2. `aiOptimizations`（AI 优化版本）
  3. `selectedVariant`（本地变体选择）
  4. 原内容兜底

```typescript
const handleGenerateFinal = () => {
  const finalSections = sections.map(s => {
    let content = s.content;
    let optimized = false;

    if (customEdits[s.id]) {
      content = customEdits[s.id];
      optimized = true;
    } else if (aiOptimizations[s.id]) {
      content = aiOptimizations[s.id];
      optimized = true;
    } else if (selectedVariant[s.id]) {
      content = optimized[s.id]?.variants.find(v => v.id === selectedVariant[s.id])?.text ?? s.content;
      optimized = true;
    }

    return { ...s, content, optimized };
  });
  sessionStorage.setItem("ai_resume_final", JSON.stringify(finalSections));
};
```

---

## 📁 文件结构

```
src/
├── app/
│   ├── ai-resume/
│   │   ├── page.tsx           # AI 简历助手首页
│   │   ├── upload/page.tsx   # 上传简历页
│   │   ├── review/page.tsx    # 解析结果确认页
│   │   ├── diagnose/page.tsx  # AI 诊断报告页
│   │   ├── optimize/page.tsx  # 逐段优化页
│   │   └── final/page.tsx     # 最终版本页
│   └── api/ai-resume/
│       ├── analyze/route.ts   # AI 分析 API
│       ├── extract/route.ts    # 简历解析 API
│       └── split/route.ts      # 文本分割 API
├── context/
│   └── LocaleContext.tsx      # 语言切换上下文
└── lib/
    ├── ai-client.ts           # AI 客户端封装
    ├── resume-diagnostics.ts  # 简历诊断逻辑
    ├── resume-optimize.ts     # 简历优化逻辑
    └── resume-parser.ts       # 简历解析逻辑
```

---

## 🔧 核心功能流程

```
1. 选择申请方向 (专业方向、申请阶段)
     ↓
2. 上传/粘贴简历文本
     ↓
3. AI 解析简历结构 (提取区块类型和内容)
     ↓
4. 确认解析结果 (可手动调整)
     ↓
5. AI 诊断报告
   - 本地诊断 (结构/完整性/适配度/英文质量)
   - AI 深度分析 (综合评分和详细建议)
     ↓
6. 逐段优化
   - 本地优化变体 (保守润色/动词强化/专业强化)
   - AI 改写版本 (可选多个版本对比)
     ↓
7. 生成最终版本
   - 预览和编辑
   - 保存/导出/同步到申请档案
```

---

## 🌐 语言切换逻辑

```
用户切换语言 (locale = "zh" | "en")
     ↓
LocaleContext 更新 state 和 localStorage
     ↓
所有子组件通过 useLocale() 获取当前语言
     ↓
显示对应语言的文本，API 传递 locale 参数
```

---

## 📝 待优化项

- [ ] 添加简历导出为 PDF 功能
- [ ] 支持简历模板下载
- [ ] 添加历史版本对比功能
- [ ] 支持批量处理多份简历
