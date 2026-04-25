import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiHandler,
  successResponse,
  errorResponse,
  requireRole,
  parseJsonBody,
  assertString,
} from "@/lib/api-utils";

// GET /api/admin/crawl/programme?url=xxx
export const GET = apiHandler(async (request: NextRequest) => {
  await requireRole(request, ["SUPER_ADMIN", "STAFF"]);

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return errorResponse("url query param is required", 400);
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; EngiMatch/1.0; +https://engimatch.example.com)",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    return errorResponse(`HTTP ${response.status}`, response.status);
  }

  const rawHtml = await response.text();
  const title = extractTitle(rawHtml);

  return successResponse({
    url,
    title,
    rawHtml,
    fetched_at: new Date().toISOString(),
  });
});

// POST /api/admin/crawl/programme
export const POST = apiHandler(async (request: NextRequest) => {
  await requireRole(request, ["SUPER_ADMIN", "STAFF"]);

  const body = await parseJsonBody<Record<string, unknown>>(request);
  const url = assertString(body.url, "url");
  const programmeId =
    typeof body.programmeId === "string" ? body.programmeId : null;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; EngiMatch/1.0)",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    return errorResponse(`HTTP ${response.status}`, response.status);
  }

  const rawHtml = await response.text();
  const title = extractTitle(rawHtml);
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
    return successResponse({
      programmeId,
      title,
      fetched_at: now.toISOString(),
    });
  }

  return successResponse({
    url,
    title,
    fetched_at: now.toISOString(),
    rawHtml,
  });
});

function extractTitle(html: string): string {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return match ? match[1].trim() : "";
}
