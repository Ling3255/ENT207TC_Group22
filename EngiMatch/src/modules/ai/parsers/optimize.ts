export interface AIOptimizeVariant {
  label: string;
  text: string;
}

export function parseAIOptimizeResponse(raw: string, locale: "zh" | "en" = "zh"): AIOptimizeVariant[] {
  const parts = raw.split(/^---+\s*$/m);
  const variants: AIOptimizeVariant[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    const titleMatch = part.match(
      /^(?:【|\[)([^\]】]+)(?::|】|\])|^\*\*\s*([^*]+?)\s*\*\*|^(?:\d+\.\s*)?(?:版本[一二三四五]|Version\s*\d+)\s*[:：]\s*(.+)$|^([^\n]+?)[:：]\s*$/m
    );
    if (titleMatch) {
      const label = (titleMatch[1] || titleMatch[2] || titleMatch[3] || titleMatch[4] || "").trim();
      const text = part.replace(/^[^\n]*\n/, "").trim();
      variants.push({
        label: label || (locale === "en" ? `Version ${i + 1}` : `版本 ${i + 1}`),
        text,
      });
    } else {
      const labels = locale === "en"
        ? ["Version 1", "Version 2", "Version 3"]
        : ["版本 1", "版本 2", "版本 3"];
      const firstLine = part.split("\n")[0].trim();
      const looksLikeTitle = /^(?:版本|Version|选项|Option|保守|专业|成果|Conservative|Major|Results)/i.test(firstLine);
      const text = looksLikeTitle ? part.replace(/^[^\n]*\n/, "").trim() : part;
      variants.push({
        label: labels[i] || (locale === "en" ? `Version ${i + 1}` : `版本 ${i + 1}`),
        text,
      });
    }
  }

  return variants;
}
