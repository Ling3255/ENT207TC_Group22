// ══════════════════════════════════════════════════════════════════
// Unified API Utilities
// Standard response format, auth guards, request helpers
// ══════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./prisma";
import { verifyToken } from "./auth";
import { checkRateLimit, getClientIp } from "./rate-limit";

// ─── Error Class ───────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Response Helpers ──────────────────────────────────────────────

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(
  message: string,
  status = 500,
  details?: unknown
) {
  return NextResponse.json(
    { success: false, error: message, details },
    { status }
  );
}

/**
 * Wrap an API handler with automatic error formatting and optional rate limiting.
 */
export function apiHandler<TContext = unknown>(
  handler: (
    request: NextRequest,
    context: TContext
  ) => Promise<NextResponse> | NextResponse,
  options?: {
    rateLimit?: { maxRequests?: number; windowMs?: number };
  }
) {
  return async (
    request: NextRequest,
    context: TContext
  ): Promise<NextResponse> => {
    try {
      // Rate limiting
      if (options?.rateLimit) {
        const ip = getClientIp(request);
        const { allowed, remaining } = checkRateLimit(
          ip,
          options.rateLimit.maxRequests ?? 10,
          options.rateLimit.windowMs ?? 60_000
        );
        if (!allowed) {
          return errorResponse("请求过于频繁，请稍后再试", 429);
        }
        const response = await handler(request, context);
        // Attach rate limit headers if it's a standard JSON response
        if (response.headers) {
          response.headers.set("X-RateLimit-Remaining", String(remaining));
        }
        return response;
      }

      return await handler(request, context);
    } catch (err) {
      if (err instanceof ApiError) {
        return errorResponse(err.message, err.statusCode, err.details);
      }
      console.error("[API Error]", err);
      return errorResponse(
        "服务器内部错误",
        500,
        process.env.NODE_ENV === "development"
          ? err instanceof Error
            ? err.message
            : undefined
          : undefined
      );
    }
  };
}

// ─── Auth Guards ───────────────────────────────────────────────────

export async function requireAuth(request: NextRequest) {
  const token = request.cookies.get("engimatch_token")?.value;
  if (!token) throw new ApiError("未登录", 401);

  const payload = await verifyToken(token);
  if (!payload) throw new ApiError("登录已过期，请重新登录", 401);

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) throw new ApiError("用户不存在", 401);
  if (user.status === "PENDING")
    throw new ApiError("您的账号正在等待审批，请联系超级管理员", 403);
  if (user.status === "REJECTED")
    throw new ApiError("您的账号已被拒绝，请联系超级管理员", 403);
  if (user.status === "SUSPENDED")
    throw new ApiError("您的账号已被停用，请联系超级管理员", 403);

  return user;
}

export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
) {
  const user = await requireAuth(request);
  if (!allowedRoles.includes(user.role)) {
    const roleLabels: Record<string, string> = {
      SUPER_ADMIN: "超级管理员",
      STAFF: "工作人员",
      STUDENT: "学生",
    };
    throw new ApiError(
      `需要 ${allowedRoles.map((r) => roleLabels[r] || r).join(" 或 ")} 权限`,
      403
    );
  }
  return user;
}

// ─── Request Helpers ───────────────────────────────────────────────

export async function parseJsonBody<T = unknown>(
  request: NextRequest
): Promise<T> {
  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    throw new ApiError("Content-Type must be application/json", 400);
  }
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError("Invalid JSON body", 400);
  }
}

export function assertString(
  value: unknown,
  fieldName: string,
  options?: { minLength?: number; maxLength?: number; pattern?: RegExp }
): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new ApiError(`${fieldName} 是必填项`, 400);
  }
  if (options?.minLength !== undefined && value.length < options.minLength) {
    throw new ApiError(`${fieldName} 至少需要 ${options.minLength} 个字符`, 400);
  }
  if (options?.maxLength !== undefined && value.length > options.maxLength) {
    throw new ApiError(`${fieldName} 不能超过 ${options.maxLength} 个字符`, 400);
  }
  if (options?.pattern && !options.pattern.test(value)) {
    throw new ApiError(`${fieldName} 格式不正确`, 400);
  }
  return value;
}

export function assertEmail(value: unknown): string {
  const email = assertString(value, "邮箱", { maxLength: 254 });
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError("邮箱格式不正确", 400);
  }
  return email;
}

export function assertArray<T>(
  value: unknown,
  fieldName: string
): T[] {
  if (!Array.isArray(value)) {
    throw new ApiError(`${fieldName} 必须是数组`, 400);
  }
  return value as T[];
}

export function assertOneOf<T extends string>(
  value: unknown,
  fieldName: string,
  allowed: readonly T[]
): T {
  const str = assertString(value, fieldName);
  if (!allowed.includes(str as T)) {
    throw new ApiError(
      `${fieldName} 必须是 ${allowed.join("、")} 之一`,
      400
    );
  }
  return str as T;
}
