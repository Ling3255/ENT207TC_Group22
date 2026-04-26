import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./prisma";
import { verifyToken } from "./auth";
import { checkRateLimit, getClientIp } from "./rate-limit";

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

function shouldApplyRateLimit() {
  if (process.env.RATE_LIMIT_ENABLED === "true") return true;
  if (process.env.RATE_LIMIT_ENABLED === "false") return false;
  return process.env.NODE_ENV === "production";
}

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
      if (options?.rateLimit && shouldApplyRateLimit()) {
        const maxRequests = options.rateLimit.maxRequests ?? 10;
        const windowMs = options.rateLimit.windowMs ?? 60_000;
        const ip = getClientIp(request);
        const { allowed, remaining, resetTime } = checkRateLimit(
          ip,
          maxRequests,
          windowMs
        );

        if (!allowed) {
          return errorResponse("Too many requests, please try again later.", 429);
        }

        const response = await handler(request, context);
        response.headers.set("X-RateLimit-Limit", String(maxRequests));
        response.headers.set("X-RateLimit-Remaining", String(remaining));
        response.headers.set("X-RateLimit-Reset", String(resetTime));
        return response;
      }

      return await handler(request, context);
    } catch (err) {
      if (err instanceof ApiError) {
        return errorResponse(err.message, err.statusCode, err.details);
      }

      console.error("[API Error]", err);
      return errorResponse(
        "Internal server error",
        500,
        process.env.NODE_ENV === "development" && err instanceof Error
          ? err.message
          : undefined
      );
    }
  };
}

export async function requireAuth(request: NextRequest) {
  const token = request.cookies.get("engimatch_token")?.value;
  if (!token) throw new ApiError("Not authenticated", 401);

  const payload = await verifyToken(token);
  if (!payload) throw new ApiError("Session expired, please log in again", 401);

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) throw new ApiError("User not found", 401);
  if (user.status === "PENDING") {
    throw new ApiError("Your account is pending approval", 403);
  }
  if (user.status === "REJECTED") {
    throw new ApiError("Your account has been rejected", 403);
  }
  if (user.status === "SUSPENDED") {
    throw new ApiError("Your account has been suspended", 403);
  }

  return user;
}

export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
) {
  const user = await requireAuth(request);

  if (!allowedRoles.includes(user.role)) {
    throw new ApiError(`Required role: ${allowedRoles.join(" or ")}`, 403);
  }

  return user;
}

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
    throw new ApiError(`${fieldName} is required`, 400);
  }

  if (options?.minLength !== undefined && value.length < options.minLength) {
    throw new ApiError(
      `${fieldName} must be at least ${options.minLength} characters`,
      400
    );
  }

  if (options?.maxLength !== undefined && value.length > options.maxLength) {
    throw new ApiError(
      `${fieldName} must be at most ${options.maxLength} characters`,
      400
    );
  }

  if (options?.pattern && !options.pattern.test(value)) {
    throw new ApiError(`${fieldName} format is invalid`, 400);
  }

  return value;
}

export function assertEmail(value: unknown): string {
  const email = assertString(value, "email", { maxLength: 254 });
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw new ApiError("Invalid email format", 400);
  }

  return email;
}

export function assertArray<T>(value: unknown, fieldName: string): T[] {
  if (!Array.isArray(value)) {
    throw new ApiError(`${fieldName} must be an array`, 400);
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
      `${fieldName} must be one of: ${allowed.join(", ")}`,
      400
    );
  }

  return str as T;
}
