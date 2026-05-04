export function buildSplitPrompt(text: string): string {
  return `你是一个专业的简历结构分析助手。请分析以下简历文本，将其分割成语义完整的段落。

**重要规则**：
1. 每个独立的项目/经历必须单独成为一个段落
2. 即使多个项目属于同一类型（如多个科研项目），也要分别分割
3. 段落类型只从以下选项中选择：
   - education（教育背景，整个学历阶段一个段落）
   - project（项目经历，每个独立项目单独一个段落）
   - research（科研经历，每个独立科研项目单独一个段落）
   - internship（实习经历，每个实习单独一个段落）
   - competition（竞赛经历，每个竞赛单独一个段落）
   - skill（技能工具）
   - award（获奖荣誉，每项奖励单独一个段落）
   - summary（个人总结）
   - personal_info（个人信息）
   - other（其他）

4. 每个段落包含：title（标题，用项目名称或类型命名）、type（类型）、content（完整内容）

示例输出格式：
{
  "sections": [
    {"title": "西交利物浦大学", "type": "education", "content": "..."},
    {"title": "低成本机械臂项目", "type": "research", "content": "..."},
    {"title": "冰箱膨胀阀噪声优化", "type": "research", "content": "..."},
    {"title": "ESG碳中和研究", "type": "research", "content": "..."}
  ]
}

简历文本：
${text.slice(0, 8000)}

请直接返回JSON，不要有任何其他文字解释。`;
}

export function getSplitSystemPrompt(): string {
  return "你是一个专业的简历分析助手，擅长识别简历结构并将其分割成语义完整的段落。";
}
