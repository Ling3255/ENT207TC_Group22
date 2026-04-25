import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import {
  apiHandler,
  successResponse,
  errorResponse,
  requireRole,
  parseJsonBody,
  assertOneOf,
  assertString,
} from "@/lib/api-utils";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/auth/users/[id] - Get single user
export const GET = apiHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    await requireRole(request, ["SUPER_ADMIN"]);

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
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
    });

    if (!user) {
      return errorResponse("用户不存在", 404);
    }

    return successResponse(user);
  }
);

// PATCH /api/auth/users/[id] - Update user (approve, reject, suspend, etc.)
export const PATCH = apiHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    await requireRole(request, ["SUPER_ADMIN"]);

    const { id } = await params;
    const body = await parseJsonBody<{
      action: unknown;
      role?: unknown;
    }>(request);
    const action = assertString(body.action, "操作类型");

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return errorResponse("用户不存在", 404);
    }

    // Prevent modifying super admin
    if (user.role === "SUPER_ADMIN") {
      return errorResponse("无法修改超级管理员账号", 403);
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case "approve":
        if (user.status !== "PENDING") {
          return errorResponse("只有待审批的用户可以批准", 400);
        }
        updateData.status = "APPROVED";
        break;

      case "reject":
        if (user.status !== "PENDING") {
          return errorResponse("只有待审批的用户可以拒绝", 400);
        }
        updateData.status = "REJECTED";
        break;

      case "suspend":
        if (user.status === "SUSPENDED") {
          return errorResponse("用户已经是停用状态", 400);
        }
        updateData.status = "SUSPENDED";
        break;

      case "activate":
        if (user.status !== "SUSPENDED") {
          return errorResponse("只有停用的用户可以激活", 400);
        }
        updateData.status = "APPROVED";
        break;

      case "change_role": {
        const newRole = assertOneOf(body.role, "角色", [
          "STUDENT",
          "STAFF",
        ] as const);
        updateData.role = newRole;
        break;
      }

      case "reset_password": {
        const tempPassword = Math.random().toString(36).slice(-8);
        updateData.password_hash = await hashPassword(tempPassword);
        updateData.status = "APPROVED";

        await prisma.user.update({
          where: { id },
          data: updateData,
        });

        return successResponse({
          tempPassword,
          message: `密码已重置，新密码：${tempPassword}，请告知用户`,
        });
      }

      default:
        return errorResponse("无效的操作", 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    const messageMap: Record<string, string> = {
      approve: "已批准该用户",
      reject: "已拒绝该用户",
      suspend: "已停用该用户",
      activate: "已激活该用户",
      change_role: "角色已更新",
    };

    return successResponse({
      user: updatedUser,
      message: messageMap[action] || "更新成功",
    });
  }
);

// DELETE /api/auth/users/[id] - Delete user (Super Admin only)
export const DELETE = apiHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    await requireRole(request, ["SUPER_ADMIN"]);

    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return errorResponse("用户不存在", 404);
    }

    // Prevent deleting super admin
    if (user.role === "SUPER_ADMIN") {
      return errorResponse("无法删除超级管理员账号", 403);
    }

    await prisma.user.delete({ where: { id } });

    return successResponse({ message: "用户已删除" });
  }
);
