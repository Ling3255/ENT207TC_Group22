import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiHandler, successResponse, parseJsonBody, assertString } from "@/lib/api-utils";
import { hashPassword, verifyPassword } from "@/lib/auth";

// POST /api/auth/password - Change password
export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);
  const body = await parseJsonBody(request) as Record<string, unknown>;

  const currentPassword = assertString(body.currentPassword, "当前密码", { minLength: 1 });
  const newPassword = assertString(body.newPassword, "新密码", { minLength: 6 });

  // Verify current password
  const valid = await verifyPassword(currentPassword, user.password_hash);
  if (!valid) {
    return successResponse({ error: "当前密码错误" }, 400);
  }

  // Hash new password
  const newHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: { password_hash: newHash },
  });

  return successResponse({ message: "密码修改成功" });
});
