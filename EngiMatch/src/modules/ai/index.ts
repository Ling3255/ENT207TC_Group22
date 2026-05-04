// Client
export { getOpenAIClient, chatCompletion, getAIConfig } from "./client";

// Prompts
export { buildDiagnosePrompt, getDiagnoseSystemPrompt } from "./prompts/resume-diagnose";
export { buildOptimizePrompt, getOptimizeSystemPrompt } from "./prompts/resume-optimize";
export { buildSplitPrompt, getSplitSystemPrompt } from "./prompts/resume-split";
export {
  buildSuggestPrompt,
  getSuggestSystemPrompt,
  type SuggestPromptApplicant,
  type SuggestPromptModule,
  type SuggestPromptEvaluation,
  type SuggestPromptProgramme,
} from "./prompts/suggest";

// Parsers
export { parseAIResponse, decodeJSONString } from "./parsers";
export { parseAIAnalysis, type AIAnalysis } from "./parsers/diagnose";
export { parseAIOptimizeResponse, type AIOptimizeVariant } from "./parsers/optimize";

// Local engines
export {
  parseResumeText,
  autoSuggestMissingSections,
  SECTION_TYPE_LABELS,
  type ResumeSection,
  type ResumeSectionType,
} from "./local/resume-parser";
export {
  runDiagnostics,
  DIMENSION_META,
  getDimensionMeta,
  type DiagnosticIssue,
  type Dimension,
} from "./local/resume-diagnostics";
export {
  optimizeSection,
  type OptimizationVariant,
  type OptimizationResult,
} from "./local/resume-optimize";

// Taxonomy
export {
  AI_RESUME_MAJOR_OPTIONS,
  normalizeAiResumeMajor,
  getAiResumeMajorOption,
  getAiResumeMajorLabel,
  type AiResumeMajorOption,
} from "./taxonomy/majors";

// Types
export type * from "./types";
