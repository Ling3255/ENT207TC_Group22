// HTML cleaner — strips boilerplate from UK university programme pages
// Removes nav, footer, cookie banners, ads, and script tags

export function cleanHtml(rawHtml: string): string {
  if (!rawHtml) return "";

  return rawHtml
    // Remove script, style, noscript, svg, and comment tags entirely
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, "")
    // Remove elements by class/role patterns (cookie banners, nav, footers)
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<div[^>]*(?:cookie|cookie-banner|consent)[^>]*>[\s\S]*?<\/div>/gi, "")
    .replace(/<div[^>]*(?:sidebar|nav)[^>]*>[\s\S]*?<\/div>/gi, "")
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "")
    // Remove common ad/utility classes
    .replace(/<div[^>]*(?:advertisement|ad-|promo|popup|modal)[^>]*>[\s\S]*?<\/div>/gi, "")
    // Remove all attributes except href/src for links/images
    .replace(/<a\s+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '<a href="$1">$2</a>')
    .replace(/<img\s+src="([^"]*)"[^>]*(?:\/|>)/gi, '<img src="$1">')
    // Normalise whitespace
    .replace(/\s+/g, " ")
    .trim();
}

export function extractTextContent(html: string): string {
  const cleaned = cleanHtml(html);
  // Strip all remaining tags
  return cleaned
    .replace(/<[^>]+>/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function splitIntoSections(text: string): string[] {
  // Split by common heading patterns used in UK uni pages
  return text
    .split(/(?:\n|^)\s*(?:Entry requirements?|Admission requirements?|Academic requirements?|English language requirements?|Modules?|Programme overview|Course description|How to apply|Application deadlines?|Fees?|Career prospects?|Entry criteria)[\s:.]*\n/gi)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function extractTableOfContents(text: string): string[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const toc: string[] = [];
  let inList = false;
  for (const line of lines) {
    if (/^[\d]+\.\s/.test(line) || /^[-*•]\s/.test(line)) {
      toc.push(line.replace(/^[\d]+\.\s|^[-*•]\s/, ""));
      inList = true;
    } else if (inList && line.length < 80) {
      toc.push(line);
    } else {
      inList = false;
    }
  }
  return toc;
}
