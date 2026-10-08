"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../providers/auth-provider";
import { Button } from "../ui/button";
import { Avatar } from "../ui/avatar";
import { Badge } from "../ui/badge";
import {
  Zap,
  Trophy,
  PlusCircle,
  Shield,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  User as UserIcon,
  Wifi,
  WifiOff,
} from "lucide-react";
import { canCreateRooms, canAccessSuperAdmin, canAccessFacultyAnalytics } from "@/lib/auth/rbac";
import { useLowData } from "../providers/low-data-provider";

export function Navbar() {
  const { user, logout } = useAuth();
  const { isLowData, toggleLowData } = useLowData();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                APTITUDE<span className="text-violet-400 ml-1">ARENA</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                href="/join"
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive("/join")
                    ? "bg-violet-500/15 text-violet-400"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                Join Game
              </Link>
              <Link
                href="/dashboard"
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive("/dashboard")
                    ? "bg-violet-500/15 text-violet-400"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/questions"
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive("/questions")
                    ? "bg-violet-500/15 text-violet-400"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                Question Sets
              </Link>
              <Link
                href="/league"
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  isActive("/league")
                    ? "bg-violet-500/15 text-violet-400"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                Leagues
              </Link>
              <Link
                href="/rules"
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive("/rules")
                    ? "bg-violet-500/15 text-violet-400"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                Rules
              </Link>
              {user && canCreateRooms(user.role) && (
                <Link
                  href="/host"
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive("/host")
                      ? "bg-violet-500/15 text-violet-400"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  Host Portal
                </Link>
              )}
              {user && canAccessFacultyAnalytics(user.role) && (
                <Link
                  href="/faculty/analytics"
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive("/faculty/analytics")
                      ? "bg-violet-500/15 text-violet-400"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  Faculty Analytics
                </Link>
              )}
              {user && canAccessSuperAdmin(user.role) && (
                <Link
                  href="/admin"
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1 text-rose-400 hover:bg-rose-950/30 ${
                    isActive("/admin") ? "bg-rose-950/50" : ""
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* Desktop Right Action Area */}
          <div className="hidden md:flex items-center gap-3">
            {user && canCreateRooms(user.role) && (
              <Link href="/rooms/create">
                <Button size="sm" variant="outline" className="gap-1.5 border-violet-500/40">
                  <PlusCircle className="w-4 h-4" />
                  Create Room
                </Button>
              </Link>
            )}

            <button
              onClick={toggleLowData}
              title={isLowData ? "Low-Data Mode active (heavy animations suppressed)" : "Enable Low-Data Mode"}
              aria-label={isLowData ? "Disable Low-Data Mode" : "Enable Low-Data Mode"}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                isLowData
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {isLowData ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              <span className="hidden xl:inline text-[11px]">
                {isLowData ? "Low-Data ON" : "Data Saver"}
              </span>
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800/80 transition-colors"
                >
                  <Avatar name={user.name} size="sm" />
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-bold text-white leading-none">{user.name}</p>
                    <Badge variant="primary" className="text-[9px] px-1.5 py-0 mt-0.5">
                      {user.role}
                    </Badge>
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-xs font-bold text-white truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      Player Profile
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-400" />
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/30 text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 px-4 pt-3 pb-6 space-y-2">
          <Link
            href="/join"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800"
          >
            Join Game
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800"
          >
            Dashboard
          </Link>
          <Link
            href="/questions"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800"
          >
            Question Sets
          </Link>
          <Link
            href="/league"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800"
          >
            Leagues
          </Link>
          <Link
            href="/rules"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800"
          >
            Rules & Fair Play
          </Link>
          {user && canCreateRooms(user.role) && (
            <Link
              href="/host"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-violet-400 hover:bg-slate-800"
            >
              Host Portal
            </Link>
          )}
          {user && canAccessFacultyAnalytics(user.role) && (
            <Link
              href="/faculty/analytics"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-violet-400 hover:bg-slate-800"
            >
              Faculty Analytics
            </Link>
          )}

          <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
            <button
              onClick={() => {
                toggleLowData();
              }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-between ${
                isLowData
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                  : "bg-slate-900 border-slate-800 text-slate-300"
              }`}
            >
              <span className="flex items-center gap-2">
                {isLowData ? <WifiOff className="w-4 h-4 text-amber-400" /> : <Wifi className="w-4 h-4 text-slate-400" />}
                Low-Data / Data Saver Mode
              </span>
              <span className="text-[10px] uppercase font-mono">
                {isLowData ? "Active" : "Off"}
              </span>
            </button>
            {user ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
              >
                Log Out
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" size="sm" className="w-full">
                    Log In
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
