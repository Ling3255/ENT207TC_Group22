import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiHandler,
  successResponse,
  requireRole,
} from "@/lib/api-utils";

type StatusCount = Awaited<ReturnType<typeof prisma.user.groupBy>>[number] & {
  status: string;
  _count: number;
};

type RoleCount = Awaited<ReturnType<typeof prisma.user.groupBy>>[number] & {
  role: string;
  _count: number;
};

// GET /api/auth/users - List all users (Super Admin only)
export const GET = apiHandler(async (request: NextRequest) => {
  await requireRole(request, ["SUPER_ADMIN"]);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("pageSize") || "20"))
  );
  const role = searchParams.get("role");
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.trim() ?? "";
  const includeStats = searchParams.get("includeStats") !== "false";

  const where: Record<string, unknown> = {};
  if (role && ["STUDENT", "STAFF", "SUPER_ADMIN"].includes(role)) {
    where.role = role;
  }
  if (
    status &&
    ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"].includes(status)
  ) {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total, statusCounts, roleCounts] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        created_at: true,
        last_login_at: true,
        applicant_id: true,
      },
    }),
    prisma.user.count({ where }),
    includeStats
      ? prisma.user.groupBy({
          by: ["status"],
          _count: true,
        })
      : Promise.resolve([]),
    includeStats
      ? prisma.user.groupBy({
          by: ["role"],
          _count: true,
        })
      : Promise.resolve([]),
  ]);

  return successResponse({
    users,
    total,
    page,
    pageSize,
    ...(includeStats
      ? {
          stats: {
            byStatus: (statusCounts as StatusCount[]).reduce<Record<string, number>>(
              (acc, s) => ({ ...acc, [s.status]: s._count }),
              {}
            ),
            byRole: (roleCounts as RoleCount[]).reduce<Record<string, number>>(
              (acc, r) => ({ ...acc, [r.role]: r._count }),
              {}
            ),
          },
        }
      : {}),
  });
});
