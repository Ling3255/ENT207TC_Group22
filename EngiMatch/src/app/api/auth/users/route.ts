import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  apiHandler,
  successResponse,
  requireRole,
} from "@/lib/api-utils";

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
  const search = searchParams.get("search");

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
        applicant: {
          select: { full_name: true },
        },
      },
    }),
    prisma.user.count({ where }),
    prisma.user.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.user.groupBy({
      by: ["role"],
      _count: true,
    }),
  ]);

  return successResponse({
    users,
    total,
    page,
    pageSize,
    stats: {
      byStatus: statusCounts.reduce(
        (acc, s) => ({ ...acc, [s.status]: s._count }),
        {}
      ),
      byRole: roleCounts.reduce(
        (acc, r) => ({ ...acc, [r.role]: r._count }),
        {}
      ),
    },
  });
});
