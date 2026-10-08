"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../providers/auth-provider";
import {
  LayoutDashboard,
  Trophy,
  BookOpen,
  Tv,
  User,
  Shield,
  Zap,
  GraduationCap,
  Layers,
  Flame,
} from "lucide-react";
import { canCreateRooms, canAccessSuperAdmin, canAccessFacultyAnalytics } from "@/lib/auth/rbac";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/daily", label: "Daily Challenge", icon: Flame },
    { href: "/questions", label: "Question Sets", icon: BookOpen },
    { href: "/questions/library", label: "Question Bank", icon: Layers },
    { href: "/league", label: "College League", icon: Trophy },
    { href: "/profile", label: "My Profile", icon: User },
  ];

  if (user && canCreateRooms(user.role)) {
    links.splice(2, 0, { href: "/host", label: "Host Arena", icon: Tv });
  }

  if (user && canAccessFacultyAnalytics(user.role)) {
    links.push({ href: "/faculty/analytics", label: "Faculty Analytics", icon: GraduationCap });
  }

  if (user && canAccessSuperAdmin(user.role)) {
    links.push({ href: "/admin", label: "Admin Console", icon: Shield });
  }

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/60 p-4 hidden md:flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Arena Menu
          </p>
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? "bg-violet-600/15 text-violet-400 border border-violet-500/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Daily Challenge Sidebar Teaser */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-violet-950/40 to-indigo-950/40 border border-violet-800/30 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-violet-300 mb-1">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Daily Sprint Active</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug mb-2">
            Test your speed on 5 questions to maintain your collegiate streak.
          </p>
          <Link
            href="/dashboard#daily"
            className="text-[11px] font-bold text-violet-400 hover:underline inline-flex items-center"
          >
            Play Daily Sprint →
          </Link>
        </div>
      </div>
    </aside>
  );
}
