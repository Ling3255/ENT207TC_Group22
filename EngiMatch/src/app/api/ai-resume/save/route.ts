import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiHandler,
  successResponse,
  errorResponse,
  requireAuth,
  parseJsonBody,
} from "@/lib/api-utils";

export const POST = apiHandler(async (req: NextRequest) => {
  await requireAuth(req);

  const body = await parseJsonBody<Record<string, unknown>>(req);
  const rawText = body.rawText;
  const sections = body.sections;

  if (!rawText || !sections) {
    return errorResponse("Missing required fields", 400);
  }

  const saved = await prisma.savedResume.create({
    data: {
      name:
        typeof body.name === "string"
          ? body.name
          : `Resume Draft ${new Date().toLocaleDateString()}`,
      major: typeof body.major === "string" ? body.major : "",
      stage: typeof body.stage === "string" ? body.stage : "",
      raw_text: String(rawText),
      sections: sections as object,
    },
  });

  return successResponse({ id: saved.id }, 201);
});

export const GET = apiHandler(async (req: NextRequest) => {
  await requireAuth(req);

  const resumes = await prisma.savedResume.findMany({
    orderBy: { created_at: "desc" },
    take: 50,
  });
  return successResponse(resumes);
});
