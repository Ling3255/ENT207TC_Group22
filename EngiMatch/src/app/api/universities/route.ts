import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiHandler,
  errorResponse,
  parseJsonBody,
  requireRole,
  successResponse,
} from "@/lib/api-utils";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// GET /api/universities - Public
export const GET = apiHandler(async () => {
  const universities = await prisma.university.findMany({
    orderBy: [{ rank: "asc" }, { name: "asc" }],
  });
  return successResponse(universities);
});

// POST /api/universities - Admin/Staff only
export const POST = apiHandler(async (request: NextRequest) => {
  await requireRole(request, ["SUPER_ADMIN", "STAFF"]);

  const body = await parseJsonBody<Record<string, unknown>>(request);
  const name = String(body.name ?? "").trim();
  const officialDomain = String(body.official_domain ?? "").trim();
  const country = String(body.country ?? "UK").trim() || "UK";
  const rankValue = body.rank;

  if (!name || !officialDomain) {
    return errorResponse("Missing required fields: name, official_domain", 400);
  }

  const slugBase = slugify(String(body.slug ?? "") || name);
  if (!slugBase) {
    return errorResponse("Unable to generate a valid university slug", 400);
  }

  const existing = await prisma.university.findFirst({
    where: {
      OR: [{ name }, { slug: slugBase }, { official_domain: officialDomain }],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      official_domain: true,
    },
  });

  if (existing) {
    return errorResponse("A university with the same name, slug, or domain already exists", 409);
  }

  const university = await prisma.university.create({
    data: {
      name,
      slug: slugBase,
      country,
      official_domain: officialDomain,
      rank:
        rankValue === null || rankValue === undefined || String(rankValue).trim() === ""
          ? null
          : parseInt(String(rankValue), 10),
    },
  });

  return successResponse(university, 201);
});
