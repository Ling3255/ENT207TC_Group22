export interface AIAnalysis {
  issues: {
    dimension: string;
    severity: string;
    title: string;
    description: string;
    suggestion: string;
    sectionIndex?: number;
  }[];
  overall_score: number;
  summary: string;
  missing: string[];
}

export function parseAIAnalysis(raw: string): AIAnalysis | null {
  try {
    const json = raw.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    return JSON.parse(json);
  } catch {
    return null;
  }
}
