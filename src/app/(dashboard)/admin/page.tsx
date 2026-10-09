"use client";

import * as React from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { Shield, Users, Server, Database, CheckCircle2 } from "lucide-react";
import { SafeUser } from "@/types";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [users, setUsers] = React.useState<SafeUser[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadAdminData() {
      try {
        const res = await fetch("/api/admin/users");
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  if (loading) {
    return <LoadingState message="Loading administrative consoles..." />;
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Platform Administration
          </h1>
          <Badge variant="danger">SUPER ADMIN</Badge>
        </div>
        <p className="text-xs text-slate-400">
          User directories, institutional memberships, and security audit logs.
        </p>
      </div>

      {/* Admin KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-violet-500/15 text-violet-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-slate-400">Total Users</p>
            <p className="text-2xl font-black text-white">{users.length}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-slate-400">Database Engine</p>
            <p className="text-2xl font-black text-white">PostgreSQL</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/15 text-amber-400">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-slate-400">Engine Protocol</p>
            <p className="text-2xl font-black text-white">WebSocket / HTTP</p>
          </div>
        </div>
      </div>

      {/* User Directory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-400" />
            Registered Cadet & Faculty Directory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">User Name</th>
                  <th className="px-4 py-3">Institutional Email</th>
                  <th className="px-4 py-3 text-center">Assigned Role</th>
                  <th className="px-4 py-3">College</th>
                  <th className="px-4 py-3 text-right rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(users || []).map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3.5 font-bold text-white">{u.name}</td>
                    <td className="px-4 py-3.5 text-slate-300 font-mono">{u.email}</td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge
                        variant={
                          u.role === "SUPER_ADMIN"
                            ? "danger"
                            : u.role === "FACULTY"
                            ? "warning"
                            : u.role === "HOST"
                            ? "primary"
                            : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">{u.collegeName || "AIT"}</td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
