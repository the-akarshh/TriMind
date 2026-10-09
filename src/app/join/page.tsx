"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, AlertCircle, ArrowRight } from "lucide-react";

export default function JoinRoomPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [code, setCode] = React.useState("");
  const [displayName, setDisplayName] = React.useState(user ? user.name : "");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user && !displayName) {
      setDisplayName(user.name);
    }
  }, [user, displayName]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length !== 6) {
      setError("Please enter a valid 6-character room PIN.");
      return;
    }

    if (!displayName.trim()) {
      setError("Please enter your display name.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cleanCode,
          displayName: displayName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to join room.");
      }

      // Store player session in sessionStorage for room lobby
      try {
        sessionStorage.setItem("arena_player", JSON.stringify(data.player));
      } catch {
        // Ignore storage errors in restricted contexts
      }
      router.push(`/rooms/${cleanCode}/lobby`);
    } catch (err: any) {
      setError(err.message || "Failed to join competition room.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center mx-auto shadow-xl shadow-violet-500/30">
            <Zap className="w-7 h-7 text-white fill-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Enter Arena PIN
          </h1>
          <p className="text-xs text-slate-400">
            Join your classmates in the live synchronized round.
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/95 shadow-2xl">
          <CardContent className="pt-6">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleJoin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 text-center">
                  Game PIN
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A7K9P2"
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 text-center font-mono font-black text-2xl tracking-widest text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Your Cadet / Display Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={25}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Arjun S."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={loading}
                className="w-full font-bold shadow-lg shadow-violet-500/25"
              >
                Join Arena Room
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
