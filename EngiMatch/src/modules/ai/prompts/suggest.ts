export interface SuggestPromptApplicant {
  fullName: string;
  undergradUniversity: string;
  undergradMajor: string;
  gpaNumeric: string | number | null;
  gpaScale: string | number | null;
  ieltsOverall: string | number | null;
  toeflTotal: string | number | null;
  targetTracks: string[];
}

export interface SuggestPromptModule {
  moduleName: string;
  grade: string | null;
  credits: string | number | null;
}

export interface SuggestPromptEvaluation {
  universityName: string;
  programmeName: string;
  band: string;
}

export interface SuggestPromptProgramme {
  universityName: string;
  programmeName: string;
  minClassification: string | null;
  ieltsOverall: string | number | null;
  prerequisites: string[];
}

export function buildSuggestPrompt(params: {
  applicant: SuggestPromptApplicant;
  modules: SuggestPromptModule[];
  evaluations: SuggestPromptEvaluation[];
  programmes: SuggestPromptProgramme[];
}): string {
  const { applicant, modules, evaluations, programmes } = params;

  const modulesText = modules
    .map((m) => `- ${m.moduleName} (${m.grade || "N/A"}, ${m.credits || "N/A"} credits)`)
    .join("\n");

  const evalSummary = evaluations
    .map((e) => `- ${e.universityName} - ${e.programmeName}: ${e.band}`)
    .join("\n");

  const programmesText = programmes
    .slice(0, 20)
    .map((p) => {
      return `- ${p.universityName}: ${p.programmeName}
  要求: ${p.minClassification || "N/A"}, 雅思 ${p.ieltsOverall || "N/A"}
  先修: ${p.prerequisites.join(", ") || "无"}`;
    })
    .join("\n");

  return `你是一位英国工程硕士申请顾问。请根据以下学生背景，给出 3-5 所最适合申请的英国大学及专业建议，并说明理由。

【学生背景】
- 姓名: ${applicant.fullName || "未填写"}
- 本科院校: ${applicant.undergradUniversity || "未填写"}
- 本科专业: ${applicant.undergradMajor || "未填写"}
- GPA: ${applicant.gpaNumeric || "N/A"}/${applicant.gpaScale}
- 雅思: ${applicant.ieltsOverall || "未提交"}
- 托福: ${applicant.toeflTotal || "未提交"}
- 目标方向: ${applicant.targetTracks.join(", ") || "未选择"}
- 课程列表:
${modulesText || "未填写"}

【系统匹配结果】
${evalSummary || "暂无匹配结果"}

【可选项目】
${programmesText}

请按以下格式回答（使用中文）：

## 综合评估
简要分析学生的优势和不足。

## 推荐院校（按冲刺/主申/保底分类）

### 冲刺院校 (Reach)
1. **大学名称 - 项目名称**
   - 推荐理由
   - 申请建议

### 主申院校 (Match)
1. **大学名称 - 项目名称**
   - 推荐理由
   - 申请建议

### 保底院校 (Safety)
1. **大学名称 - 项目名称**
   - 推荐理由
   - 申请建议

## 提升建议
针对该学生背景，给出具体的提升建议（如语言成绩、课程补充、实习经历等）。`;
}

export function getSuggestSystemPrompt(): string {
  return "你是一位资深的英国工程硕士留学申请顾问，熟悉英国各大院校的录取要求和申请策略。请给出专业、具体、可操作的建议。";
}
