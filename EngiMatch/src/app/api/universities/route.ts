import { prisma } from "@/lib/prisma";
import { apiHandler, successResponse } from "@/lib/api-utils";

// GET /api/universities - Public
export const GET = apiHandler(async () => {
  const universities = await prisma.university.findMany({
    orderBy: [{ rank: "asc" }, { name: "asc" }],
  });
  return successResponse(universities);
});
