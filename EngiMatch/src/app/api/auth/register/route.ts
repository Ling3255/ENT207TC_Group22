import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateToken, setAuthCookie } from "@/lib/auth";
import {
  apiHandler,
  successResponse,
  errorResponse,
  assertEmail,
  assertString,
  assertOneOf,
  parseJsonBody,
} from "@/lib/api-utils";

// POST /api/auth/register - Register new user
export const POST = apiHandler(
  async (request: NextRequest) => {
    const body = await parseJsonBody<{
      email: unknown;
      password: unknown;
      name?: unknown;
      role?: unknown;
    }>(request);

    const email = assertEmail(body.email);
    const password = assertString(body.password, "密码", { minLength: 6 });
    const name =
      typeof body.name === "string" && body.name.length > 0
        ? body.name
        : null;
    const role = assertOneOf(body.role ?? "STUDENT", "角色", [
      "STUDENT",
      "STAFF",
    ] as const);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return errorResponse("该邮箱已被注册", 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Staff users need approval (PENDING), students are auto-approved
    const userStatus = role === "STAFF" ? "PENDING" : "APPROVED";

    const user = await prisma.user.create({
      data: {
        email,
        password_hash: passwordHash,
        name,
        role,
        status: userStatus,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        created_at: true,
      },
    });

    // Generate token and set cookie
    const token = await generateToken(user.id);
    const cookie = setAuthCookie(token);

    const response = successResponse(
      {
        user,
        message:
          role === "STAFF"
            ? "注册成功！请等待超级管理员审批通过后登录。"
            : "注册成功！",
      },
      201
    );

    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  },
  { rateLimit: { maxRequests: 5, windowMs: 60_000 } }
);
