import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateToken, setAuthCookie } from "@/lib/auth";
import {
  apiHandler,
  successResponse,
  errorResponse,
  parseJsonBody,
  assertEmail,
  assertString,
} from "@/lib/api-utils";

// POST /api/auth/setup - Initial setup (only works if no users exist)
export const POST = apiHandler(
  async (request: NextRequest) => {
    // Check if any users exist
    const userCount = await prisma.user.count();

    if (userCount > 0) {
      return errorResponse("系统已初始化，请使用已有账号登录", 403);
    }

    const body = await parseJsonBody<{
      email?: unknown;
      password?: unknown;
      name?: unknown;
    }>(request);

    const email = assertEmail(body.email ?? "admin@engimatch.com");
    const password = assertString(body.password ?? "admin123", "密码", {
      minLength: 6,
    });
    const name =
      typeof body.name === "string" && body.name.length > 0
        ? body.name
        : "超级管理员";

    const passwordHash = await hashPassword(password);

    const admin = await prisma.user.create({
      data: {
        email,
        password_hash: passwordHash,
        name,
        role: "SUPER_ADMIN",
        status: "APPROVED",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    const token = await generateToken(admin.id);
    const cookie = setAuthCookie(token);

    const response = successResponse(
      {
        admin,
        warning: `请立即登录并修改默认密码！账号：${email}`,
      },
      201
    );
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  },
  { rateLimit: { maxRequests: 3, windowMs: 60_000 } }
);

// GET /api/auth/setup - Check if setup is needed
export const GET = apiHandler(async () => {
  const userCount = await prisma.user.count();
  const superAdminCount = await prisma.user.count({
    where: { role: "SUPER_ADMIN" },
  });

  return successResponse({
    needsSetup: userCount === 0,
    hasSuperAdmin: superAdminCount > 0,
    userCount,
  });
});
