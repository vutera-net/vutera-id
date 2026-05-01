"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"users" | "logs">("users");
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersRes, logsRes] = await Promise.all([
          fetch("/api/admin/users"),
          fetch("/api/admin/logs"),
        ]);

        if (usersRes.status === 403 || logsRes.status === 403) {
          setError("Bạn không có quyền truy cập trang này.");
          return;
        }

        if (!usersRes.ok || !logsRes.ok) {
          throw new Error("Failed to fetch admin data");
        }

        setUsers(await usersRes.json());
        setLogs(await logsRes.json());
      } catch (err) {
        setError("Đã xảy ra lỗi khi tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Đang tải dữ liệu quản trị...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Truy cập bị từ chối</h1>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/auth/profile")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Quay lại Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setView("users")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                view === "users" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Quản lý User
            </button>
            <button
              onClick={() => setView("logs")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                view === "logs" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Audit Logs
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {view === "users" ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">User</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((user: any) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{user.name || "N/A"}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-700"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">User</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Action</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Field</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Change</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{log.user?.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{log.action}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono text-xs">{log.field}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className="text-red-500 line-through">{log.oldValue}</span>
                      <span className="mx-2">→</span>
                      <span className="text-green-600">{log.newValue}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
