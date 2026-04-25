import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  generateToken,
  setAuthCookie,
} from "@/lib/auth";
import {
  apiHandler,
  successResponse,
  errorResponse,
  assertEmail,
  assertString,
  parseJsonBody,
} from "@/lib/api-utils";

// POST /api/auth/login - User login
export const POST = apiHandler(
  async (request: NextRequest) => {
    const body = await parseJsonBody<{
      email: unknown;
      password: unknown;
    }>(request);

    const email = assertEmail(body.email);
    const password = assertString(body.password, "密码", { minLength: 1 });

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return errorResponse("邮箱或密码错误", 401);
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return errorResponse("邮箱或密码错误", 401);
    }

    // Check user status
    if (user.status === "PENDING") {
      return errorResponse("您的账号正在等待审批，请联系超级管理员", 403);
    }
    if (user.status === "REJECTED") {
      return errorResponse("您的账号已被拒绝，请联系超级管理员", 403);
    }
    if (user.status === "SUSPENDED") {
      return errorResponse("您的账号已被停用，请联系超级管理员", 403);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    // Generate token and set cookie
    const token = await generateToken(user.id);
    const cookie = setAuthCookie(token);

    const response = successResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        applicant_id: user.applicant_id,
      },
    });

    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  },
  { rateLimit: { maxRequests: 5, windowMs: 60_000 } }
);
