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

// GET /api/timeline - Public
export const GET = apiHandler(async () => {
  const events = await prisma.timelineEvent.findMany({
    orderBy: [{ phase_order: "asc" }, { month_min: "asc" }],
  });
  return successResponse(events);
});

// POST /api/timeline - Admin/Staff only
export const POST = apiHandler(async (request: NextRequest) => {
  await requireRole(request, ["SUPER_ADMIN", "STAFF"]);

  const body = await parseJsonBody<Record<string, unknown>>(request);

  const title = assertString(body.title, "title");
  const phase = assertString(body.phase, "phase");

  if (typeof body.category !== "string" || body.category.length === 0) {
    return errorResponse("category is required", 400);
  }

  const event = await prisma.timelineEvent.create({
    data: {
      title,
      title_en:
        typeof body.title_en === "string" && body.title_en.length > 0
          ? body.title_en
          : title,
      description: typeof body.description === "string" ? body.description : "",
      description_en:
        typeof body.description_en === "string" && body.description_en.length > 0
          ? body.description_en
          : typeof body.description === "string"
          ? body.description
          : "",
      phase,
      phase_order: typeof body.phase_order === "number" ? body.phase_order : 0,
      category: String(body.category),
      month_min: typeof body.month_min === "number" ? body.month_min : 0,
      month_max: typeof body.month_max === "number" ? body.month_max : 12,
      is_required: body.is_required === true,
      icon: typeof body.icon === "string" ? body.icon : "📌",
    },
  });

  return successResponse(event, 201);
});

// DELETE /api/timeline - Admin/Staff only
export const DELETE = apiHandler(async (request: NextRequest) => {
  await requireRole(request, ["SUPER_ADMIN", "STAFF"]);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return errorResponse("Missing id", 400);
  }
  await prisma.timelineEvent.delete({ where: { id } });
  return successResponse({ message: "Timeline event deleted" });
});
