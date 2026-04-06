import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/crawl/programme?url=xxx
// Fetches and stores raw programme page content
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "url query param is required" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; EngiMatch/1.0; +https://engimatch.example.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `HTTP ${response.status}` }, { status: response.status });
    }

    const rawHtml = await response.text();
    const title = await extractTitle(rawHtml);

    return NextResponse.json({
      url,
      title,
      rawHtml,
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

async function extractTitle(html: string): Promise<string> {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return match ? match[1].trim() : "";
}

// POST /api/admin/crawl/programme
// Crawl a URL and associate with an existing or new programme record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, programmeId } = body;

    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; EngiMatch/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `HTTP ${response.status}` }, { status: response.status });
    }

    const rawHtml = await response.text();
    const title = await extractTitle(rawHtml);
    const now = new Date();

    if (programmeId) {
      await prisma.programme.update({
        where: { id: programmeId },
        data: {
          raw_requirement_text: rawHtml,
          source_last_checked_at: now,
          source_page_title: title,
          parser_version: null,
          human_verified: false,
        },
      });
      return NextResponse.json({ success: true, programmeId, title, fetched_at: now.toISOString() });
    }

    return NextResponse.json({ success: true, url, title, fetched_at: now.toISOString(), rawHtml });
  } catch (error) {
    console.error("POST /api/admin/crawl/programme error:", error);
    return NextResponse.json({ error: "Crawl failed" }, { status: 500 });
  }
}
