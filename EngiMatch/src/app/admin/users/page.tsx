"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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

const STATUS_CONFIG: Record<string, { label: string; labelEn: string; color: string }> = {
  PENDING: { label: "待审批", labelEn: "Pending", color: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "已批准", labelEn: "Approved", color: "bg-green-100 text-green-700" },
  REJECTED: { label: "已拒绝", labelEn: "Rejected", color: "bg-red-100 text-red-700" },
  SUSPENDED: { label: "已停用", labelEn: "Suspended", color: "bg-slate-100 text-slate-700" },
};

const ROLE_CONFIG: Record<string, { label: string; labelEn: string; icon: string }> = {
  STUDENT: { label: "学生", labelEn: "Student", icon: "🎓" },
  STAFF: { label: "工作人员", labelEn: "Staff", icon: "👨‍💼" },
  SUPER_ADMIN: { label: "超级管理员", labelEn: "Super Admin", icon: "🔐" },
};

export default function AdminUsersPage() {
  const { t, locale } = useLocale();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filter, setFilter] = useState<"all" | "pending">("all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === "pending") {
        params.set("status", "PENDING");
      }
      if (search) {
        params.set("search", search);
      }
      
      const res = await fetch(`/api/auth/users?${params}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "获取用户列表失败");
      }
      
      setUsers(data.users);
      setStats(data.stats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleAction = async (userId: string, action: string) => {
    setActionLoading(userId);
    setTempPassword(null);
    
    try {
      const res = await fetch(`/api/auth/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "操作失败");
      }

      // If password reset, show temp password
      if (action === "reset_password" && data.tempPassword) {
        setTempPassword(data.tempPassword);
      }
      
      // Refresh list
      fetchUsers();
      
      // Close modal if not password reset
      if (action !== "reset_password") {
        setSelectedUser(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "操作失败");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const pendingCount = stats?.byStatus?.PENDING || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-800 text-white py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/home" className="text-sm text-slate-400 hover:text-white mb-2 inline-block">← {locale === "en" ? "Back to Home" : "返回首页"}</Link>
              <h1 className="text-2xl font-bold">
                {locale === "en" ? "User Management" : "用户管理"}
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                {locale === "en" ? "Manage students and staff accounts" : "管理学生和工作人员账号"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
            >
              {locale === "en" ? "Logout" : "退出登录"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-slate-700">{stats?.byRole?.STUDENT || 0}</div>
            <div className="text-sm text-slate-500">{locale === "en" ? "Students" : "学生"}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-slate-700">{stats?.byRole?.STAFF || 0}</div>
            <div className="text-sm text-slate-500">{locale === "en" ? "Staff" : "工作人员"}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
            <div className="text-sm text-slate-500">{locale === "en" ? "Pending Approval" : "待审批"}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-slate-700">
              {(Object.values(stats?.byStatus || {}) as number[]).reduce((a, b) => a + b, 0)}
            </div>
            <div className="text-sm text-slate-500">{locale === "en" ? "Total Users" : "总用户数"}</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={locale === "en" ? "Search by email or name..." : "搜索邮箱或姓名..."}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {locale === "en" ? "Search" : "搜索"}
              </button>
            </form>
            <div className="flex gap-2">
              <button
                onClick={() => { setFilter("all"); fetchUsers(); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "all" 
                    ? "bg-indigo-600 text-white" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {locale === "en" ? "All Users" : "全部用户"}
              </button>
              <button
                onClick={() => { setFilter("pending"); fetchUsers(); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                  filter === "pending" 
                    ? "bg-amber-500 text-white" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {locale === "en" ? "Pending" : "待审批"}
                {pendingCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                    filter === "pending" ? "bg-amber-400" : "bg-amber-500 text-white"
                  }`}>
                    {pendingCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            {locale === "en" ? "Loading..." : "加载中..."}
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-red-200 p-8 text-center text-red-600">
            {error}
            <button onClick={fetchUsers} className="ml-4 underline hover:no-underline">
              {locale === "en" ? "Retry" : "重试"}
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            {filter === "pending" 
              ? (locale === "en" ? "No pending approvals" : "没有待审批的用户")
              : (locale === "en" ? "No users found" : "没有找到用户")}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                    {locale === "en" ? "User" : "用户"}
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                    {locale === "en" ? "Role" : "角色"}
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                    {locale === "en" ? "Status" : "状态"}
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                    {locale === "en" ? "Registered" : "注册时间"}
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-slate-600">
                    {locale === "en" ? "Actions" : "操作"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => {
                  const statusCfg = STATUS_CONFIG[user.status];
                  const roleCfg = ROLE_CONFIG[user.role];
                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{user.name || "—"}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-sm">
                          <span>{roleCfg.icon}</span>
                          <span>{locale === "en" ? roleCfg.labelEn : roleCfg.label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
                          {locale === "en" ? statusCfg.labelEn : statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {new Date(user.created_at).toLocaleDateString(locale === "en" ? "en-US" : "zh-CN")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          {locale === "en" ? "Manage" : "管理"}
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

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                {locale === "en" ? "User Details" : "用户详情"}
              </h2>
              <button onClick={() => { setSelectedUser(null); setTempPassword(null); }} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">{locale === "en" ? "Email" : "邮箱"}</span>
                <span className="font-medium">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{locale === "en" ? "Name" : "姓名"}</span>
                <span className="font-medium">{selectedUser.name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{locale === "en" ? "Role" : "角色"}</span>
                <span className="font-medium">
                  {ROLE_CONFIG[selectedUser.role]?.icon} {locale === "en" ? ROLE_CONFIG[selectedUser.role]?.labelEn : ROLE_CONFIG[selectedUser.role]?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{locale === "en" ? "Status" : "状态"}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[selectedUser.status].color}`}>
                  {locale === "en" ? STATUS_CONFIG[selectedUser.status].labelEn : STATUS_CONFIG[selectedUser.status].label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{locale === "en" ? "Registered" : "注册时间"}</span>
                <span className="text-sm">{new Date(selectedUser.created_at).toLocaleString(locale === "en" ? "en-US" : "zh-CN")}</span>
              </div>
              {selectedUser.last_login_at && (
                <div className="flex justify-between">
                  <span className="text-slate-500">{locale === "en" ? "Last Login" : "最后登录"}</span>
                  <span className="text-sm">{new Date(selectedUser.last_login_at).toLocaleString(locale === "en" ? "en-US" : "zh-CN")}</span>
                </div>
              )}
            </div>

            {/* Temp Password Display */}
            {tempPassword && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                <div className="text-sm text-green-700 font-medium mb-1">
                  {locale === "en" ? "New Password Generated" : "新密码已生成"}
                </div>
                <div className="text-2xl font-mono font-bold text-green-800 tracking-wider">
                  {tempPassword}
                </div>
                <div className="text-xs text-green-600 mt-2">
                  {locale === "en" 
                    ? "Please share this password with the user securely." 
                    : "请安全地将此密码分享给用户。"}
                </div>
              </div>
            )}

            {/* Actions */}
            {selectedUser.role !== "SUPER_ADMIN" && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-700 mb-2">
                  {locale === "en" ? "Actions" : "操作"}
                </h3>
                
                {selectedUser.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => handleAction(selectedUser.id, "approve")}
                      disabled={actionLoading === selectedUser.id}
                      className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === selectedUser.id 
                        ? (locale === "en" ? "Processing..." : "处理中...")
                        : (locale === "en" ? "✓ Approve" : "✓ 批准")}
                    </button>
                    <button
                      onClick={() => handleAction(selectedUser.id, "reject")}
                      disabled={actionLoading === selectedUser.id}
                      className="w-full py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
                    >
                      {locale === "en" ? "✗ Reject" : "✗ 拒绝"}
                    </button>
                  </>
                )}

                {(selectedUser.status === "APPROVED" || selectedUser.status === "SUSPENDED") && (
                  <button
                    onClick={() => handleAction(selectedUser.id, selectedUser.status === "SUSPENDED" ? "activate" : "suspend")}
                    disabled={actionLoading === selectedUser.id}
                    className={`w-full py-2 rounded-lg disabled:opacity-50 transition-colors ${
                      selectedUser.status === "SUSPENDED"
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                    }`}
                  >
                    {actionLoading === selectedUser.id 
                      ? (locale === "en" ? "Processing..." : "处理中...")
                      : selectedUser.status === "SUSPENDED"
                      ? (locale === "en" ? "✓ Activate" : "✓ 激活")
                      : (locale === "en" ? "⚠ Suspend" : "⚠ 停用")}
                  </button>
                )}

                <button
                  onClick={() => handleAction(selectedUser.id, "reset_password")}
                  disabled={actionLoading === selectedUser.id}
                  className="w-full py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
                >
                  {actionLoading === selectedUser.id 
                    ? (locale === "en" ? "Processing..." : "处理中...")
                    : (locale === "en" ? "🔑 Reset Password" : "🔑 重置密码")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
