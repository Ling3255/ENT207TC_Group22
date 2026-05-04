export type Locale = "zh" | "en";

export type ResumeSectionType =
  | "education"
  | "project"
  | "internship"
  | "research"
  | "competition"
  | "skill"
  | "award"
  | "summary"
  | "personal_info"
  | "other";

export interface ResumeSection {
  id: string;
  type: ResumeSectionType;
  title: string;
  content: string;
  order: number;
  confirmed: boolean;
}

export type Dimension = "structure" | "completeness" | "target_fit" | "english_quality";

export interface DiagnosticIssue {
  id: string;
  dimension: Dimension;
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  suggestion: string;
  sectionId?: string;
}

export interface OptimizationVariant {
  id: string;
  label: string;
  description: string;
  text: string;
}

export interface OptimizationResult {
  original: string;
  variants: OptimizationVariant[];
  missingHints: string[];
}

export interface ResumeAiSection {
  type: string;
  title: string;
  content: string;
}

export interface ParsedSection {
  title: string;
  type: string;
  content: string;
}
