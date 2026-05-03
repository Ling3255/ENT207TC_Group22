"use client";

import { useDeferredValue, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/context/LocaleContext";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: "STUDENT" | "STAFF" | "SUPER_ADMIN";
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  created_at: string;
  last_login_at: string | null;
  applicant_id: string | null;
}

interface Stats {
  byStatus: Record<string, number>;
  byRole: Record<string, number>;
}

const STATUS_CONFIG: Record<
  User["status"],
  { label: string; labelEn: string; color: string }
> = {
  PENDING: {
    label: "待审批",
    labelEn: "Pending",
    color: "bg-amber-100 text-amber-700",
  },
  APPROVED: {
    label: "已批准",
    labelEn: "Approved",
    color: "bg-green-100 text-green-700",
  },
  REJECTED: {
    label: "已拒绝",
    labelEn: "Rejected",
    color: "bg-red-100 text-red-700",
  },
  SUSPENDED: {
    label: "已停用",
    labelEn: "Suspended",
    color: "bg-slate-100 text-slate-700",
  },
};

const ROLE_CONFIG: Record<
  User["role"],
  { label: string; labelEn: string; icon: string }
> = {
  STUDENT: { label: "学生", labelEn: "Student", icon: "S" },
  STAFF: { label: "工作人员", labelEn: "Staff", icon: "T" },
  SUPER_ADMIN: { label: "超级管理员", labelEn: "Super Admin", icon: "A" },
};

export default function AdminUsersPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const isEnglish = locale === "en";

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "student" | "staff">("all");
  const [searchInput, setSearchInput] = useState("");
  const deferredSearchInput = useDeferredValue(searchInput);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionCheckedRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(deferredSearchInput.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [deferredSearchInput]);

  useEffect(() => {
    let active = true;

    async function verifySessionAndLoadUsers() {
      try {
        if (!sessionCheckedRef.current) {
          const response = await fetch("/api/auth/session", { cache: "no-store" });
          const payload = await response.json();
          const session = payload?.data;

          if (!active) {
            return;
          }

          if (!session?.authenticated) {
            router.replace("/login");
            return;
          }
          if (session.user?.role !== "SUPER_ADMIN") {
            if (active) {
              setError(
                isEnglish
                  ? "Insufficient permissions. This page requires super administrator access."
                  : "权限不足，此页面需要超级管理员权限。"
              );
              setLoading(false);
            }
            return;
          }

          sessionCheckedRef.current = true;
        }

        await fetchUsers({
          searchTerm: search,
          includeStats: stats === null,
        });
      } catch {
        if (active) {
          setError(
            isEnglish
              ? "Failed to load users. Please try again."
              : "加载用户列表失败，请重试。"
          );
          setLoading(false);
        }
      }
    }

    verifySessionAndLoadUsers();

    return () => {
      active = false;
      abortRef.current?.abort();
    };
  }, [filter, router, search, stats]);

  async function fetchUsers({
    searchTerm = search,
    includeStats = false,
  }: {
    searchTerm?: string;
    includeStats?: boolean;
  } = {}) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (filter === "pending") {
        params.set("status", "PENDING");
      } else if (filter === "student") {
        params.set("role", "STUDENT");
      } else if (filter === "staff") {
        params.set("role", "STAFF");
      }

      if (searchTerm) {
        params.set("search", searchTerm);
      }

      if (!includeStats) {
        params.set("includeStats", "false");
      }

      const response = await fetch(`/api/auth/users?${params.toString()}`, {
        signal: controller.signal,
      });
      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.error || (isEnglish ? "Failed to load users." : "加载用户列表失败。")
        );
      }

      setUsers(payload?.data?.users ?? []);
      if (payload?.data?.stats) {
        setStats(payload.data.stats);
      }
      setError(null);
    } catch (loadError) {
      if (loadError instanceof Error && loadError.name === "AbortError") {
        return;
      }

      setError(
        loadError instanceof Error
          ? loadError.message
          : isEnglish
            ? "Failed to load users."
            : "加载用户列表失败。"
      );
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
      }
    }
  }

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setSearch(searchInput.trim());
  }

  async function handleAction(userId: string, action: string) {
    setActionLoading(userId);
    setTempPassword(null);

    try {
      const response = await fetch(`/api/auth/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.error || (isEnglish ? "Action failed." : "操作失败。")
        );
      }

      if (action === "reset_password" && payload?.data?.tempPassword) {
        setTempPassword(payload.data.tempPassword);
      }

      await fetchUsers({ searchTerm: search, includeStats: true });

      if (action !== "reset_password") {
        setSelectedUser(null);
      }
    } catch (actionError) {
      alert(
        actionError instanceof Error
          ? actionError.message
          : isEnglish
            ? "Action failed."
            : "操作失败。"
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleLogout() {
    setLogoutLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  const pendingCount = stats?.byStatus?.PENDING || 0;
  const totalCount = (Object.values(stats?.byStatus || {}) as number[]).reduce(
    (sum, value) => sum + value,
    0
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-800 px-4 py-6 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/home"
                className="mb-2 inline-block text-sm text-slate-400 hover:text-white"
              >
                {isEnglish ? "Back to Home" : "返回首页"}
              </Link>
              <h1 className="text-2xl font-bold">
                {isEnglish ? "User Management" : "用户管理"}
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                {isEnglish ? "Manage student and staff accounts" : "管理学生和工作人员账号"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="rounded-lg bg-slate-700 px-4 py-2 text-sm transition-colors hover:bg-slate-600"
              >
                {isEnglish ? "Profile" : "个人信息"}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={logoutLoading}
                className="rounded-lg bg-slate-600 px-4 py-2 text-sm transition-colors hover:bg-slate-500"
              >
                {logoutLoading
                  ? isEnglish
                    ? "Logging out..."
                    : "退出中..."
                  : isEnglish
                    ? "Logout"
                    : "退出登录"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label={isEnglish ? "Students" : "学生"} value={stats?.byRole?.STUDENT || 0} />
          <StatCard label={isEnglish ? "Staff" : "工作人员"} value={stats?.byRole?.STAFF || 0} />
          <StatCard
            label={isEnglish ? "Pending Approval" : "待审批"}
            value={pendingCount}
            valueClassName="text-amber-600"
          />
          <StatCard label={isEnglish ? "Total Users" : "总用户数"} value={totalCount} />
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <form onSubmit={handleSearch} className="flex flex-1 gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={
                  isEnglish ? "Search by email or name..." : "按邮箱或姓名搜索..."
                }
                className="flex-1 rounded-lg border border-stone-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-slate-600 transition-colors hover:bg-slate-50"
                >
                  {isEnglish ? "Clear" : "清空"}
                </button>
              )}
              <button
                type="submit"
                className="rounded-lg bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-700"
              >
                {isEnglish ? "Search" : "搜索"}
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={filter === "all"}
                onClick={() => setFilter("all")}
                activeClassName="bg-amber-600 text-white"
                idleClassName="bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                {isEnglish ? "All Users" : "全部用户"}
              </FilterButton>
              <FilterButton
                active={filter === "student"}
                onClick={() => setFilter("student")}
                activeClassName="bg-blue-600 text-white"
                idleClassName="bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                {isEnglish ? "Students" : "学生"}
              </FilterButton>
              <FilterButton
                active={filter === "staff"}
                onClick={() => setFilter("staff")}
                activeClassName="bg-purple-600 text-white"
                idleClassName="bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                {isEnglish ? "Staff" : "工作人员"}
              </FilterButton>
              <FilterButton
                active={filter === "pending"}
                onClick={() => setFilter("pending")}
                activeClassName="bg-amber-500 text-white"
                idleClassName="bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                {isEnglish ? "Pending" : "待审批"}
                {pendingCount > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-xs ${
                      filter === "pending" ? "bg-amber-400" : "bg-amber-500 text-white"
                    }`}
                  >
                    {pendingCount}
                  </span>
                )}
              </FilterButton>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            {search
              ? isEnglish
                ? `Showing results for "${search}".`
                : `正在显示 “${search}” 的搜索结果。`
              : isEnglish
                ? "Search updates automatically while you type."
                : "输入时会自动搜索，无需反复点击按钮。"}
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
            {isEnglish ? "Loading..." : "加载中..."}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center text-red-600">
            {error}
            <button
              type="button"
              onClick={() => fetchUsers({ searchTerm: search, includeStats: stats === null })}
              className="ml-4 underline hover:no-underline"
            >
              {isEnglish ? "Retry" : "重试"}
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
            {filter === "pending"
              ? isEnglish
                ? "No pending approvals"
                : "没有待审批的用户"
              : filter === "student"
                ? isEnglish
                  ? "No students found"
                  : "没有找到学生"
                : filter === "staff"
                  ? isEnglish
                    ? "No staff found"
                    : "没有找到工作人员"
                  : isEnglish
                    ? "No users found"
                    : "没有找到用户"}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">
                    {isEnglish ? "User" : "用户"}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">
                    {isEnglish ? "Role" : "角色"}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">
                    {isEnglish ? "Status" : "状态"}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">
                    {isEnglish ? "Registered" : "注册时间"}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">
                    {isEnglish ? "Actions" : "操作"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => {
                  const statusConfig = STATUS_CONFIG[user.status];
                  const roleConfig = ROLE_CONFIG[user.role];

                  return (
                    <tr key={user.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {user.name || (isEnglish ? "Unnamed user" : "未填写姓名")}
                        </div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2 text-sm">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-700">
                            {roleConfig.icon}
                          </span>
                          <span>{isEnglish ? roleConfig.labelEn : roleConfig.label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${statusConfig.color}`}
                        >
                          {isEnglish ? statusConfig.labelEn : statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {new Date(user.created_at).toLocaleDateString(isEnglish ? "en-US" : "zh-CN")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(user)}
                          className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm transition-colors hover:bg-slate-200"
                        >
                          {isEnglish ? "Manage" : "管理"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {isEnglish ? "User Details" : "用户详情"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(null);
                  setTempPassword(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                x
              </button>
            </div>

            <div className="mb-6 space-y-3">
              <DetailRow label={isEnglish ? "Email" : "邮箱"} value={selectedUser.email} />
              <DetailRow
                label={isEnglish ? "Name" : "姓名"}
                value={selectedUser.name || (isEnglish ? "Not provided" : "未填写")}
              />
              <DetailRow
                label={isEnglish ? "Role" : "角色"}
                value={isEnglish ? ROLE_CONFIG[selectedUser.role].labelEn : ROLE_CONFIG[selectedUser.role].label}
              />
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">{isEnglish ? "Status" : "状态"}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CONFIG[selectedUser.status].color}`}
                >
                  {isEnglish
                    ? STATUS_CONFIG[selectedUser.status].labelEn
                    : STATUS_CONFIG[selectedUser.status].label}
                </span>
              </div>
              <DetailRow
                label={isEnglish ? "Registered" : "注册时间"}
                value={new Date(selectedUser.created_at).toLocaleString(isEnglish ? "en-US" : "zh-CN")}
              />
              {selectedUser.last_login_at && (
                <DetailRow
                  label={isEnglish ? "Last Login" : "最后登录"}
                  value={new Date(selectedUser.last_login_at).toLocaleString(isEnglish ? "en-US" : "zh-CN")}
                />
              )}
            </div>

            {tempPassword && (
              <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3">
                <div className="mb-1 text-sm font-medium text-green-700">
                  {isEnglish ? "New Password Generated" : "已生成新密码"}
                </div>
                <div className="text-2xl font-bold tracking-wider text-green-800">
                  {tempPassword}
                </div>
                <div className="mt-2 text-xs text-green-600">
                  {isEnglish
                    ? "Please share this password with the user securely."
                    : "请通过安全方式把这个密码发给用户。"}
                </div>
              </div>
            )}

            {selectedUser.role !== "SUPER_ADMIN" && (
              <div className="space-y-2">
                <h3 className="mb-2 text-sm font-medium text-slate-700">
                  {isEnglish ? "Actions" : "操作"}
                </h3>

                {selectedUser.status === "PENDING" && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAction(selectedUser.id, "approve")}
                      disabled={actionLoading === selectedUser.id}
                      className="w-full rounded-lg bg-green-600 py-2 text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading === selectedUser.id
                        ? isEnglish
                          ? "Processing..."
                          : "处理中..."
                        : isEnglish
                          ? "Approve"
                          : "批准"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(selectedUser.id, "reject")}
                      disabled={actionLoading === selectedUser.id}
                      className="w-full rounded-lg bg-red-100 py-2 text-red-700 transition-colors hover:bg-red-200 disabled:opacity-50"
                    >
                      {isEnglish ? "Reject" : "拒绝"}
                    </button>
                  </>
                )}

                {(selectedUser.status === "APPROVED" ||
                  selectedUser.status === "SUSPENDED") && (
                  <button
                    type="button"
                    onClick={() =>
                      handleAction(
                        selectedUser.id,
                        selectedUser.status === "SUSPENDED" ? "activate" : "suspend"
                      )
                    }
                    disabled={actionLoading === selectedUser.id}
                    className={`w-full rounded-lg py-2 transition-colors disabled:opacity-50 ${
                      selectedUser.status === "SUSPENDED"
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                    }`}
                  >
                    {actionLoading === selectedUser.id
                      ? isEnglish
                        ? "Processing..."
                        : "处理中..."
                      : selectedUser.status === "SUSPENDED"
                        ? isEnglish
                          ? "Activate"
                          : "启用"
                        : isEnglish
                          ? "Suspend"
                          : "停用"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleAction(selectedUser.id, "reset_password")}
                  disabled={actionLoading === selectedUser.id}
                  className="w-full rounded-lg bg-slate-100 py-2 text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
                >
                  {actionLoading === selectedUser.id
                    ? isEnglish
                      ? "Processing..."
                      : "处理中..."
                    : isEnglish
                      ? "Reset Password"
                      : "重置密码"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: number;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className={`text-2xl font-bold text-slate-700 ${valueClassName || ""}`}>{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  activeClassName,
  idleClassName,
  children,
}: {
  active: boolean;
  onClick: () => void;
  activeClassName: string;
  idleClassName: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        active ? activeClassName : idleClassName
      }`}
    >
      <span className="inline-flex items-center gap-1">{children}</span>
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
