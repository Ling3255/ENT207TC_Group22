import { NextRequest } from "next/server";
import { clearAuthCookie } from "@/lib/auth";
import { apiHandler, successResponse } from "@/lib/api-utils";

// POST /api/auth/logout - User logout
export const POST = apiHandler(async () => {
  const cookie = clearAuthCookie();
  const response = successResponse({ message: "已退出登录" });
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
});
