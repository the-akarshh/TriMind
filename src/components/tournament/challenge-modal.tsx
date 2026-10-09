"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { SAMPLE_COLLEGES } from "@/lib/services/league-service";
import { X, Swords, Send } from "lucide-react";

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (challenge: any) => void;
}

export function ChallengeModal({ isOpen, onClose, onCreated }: ChallengeModalProps) {
  const [opponentId, setOpponentId] = React.useState(
    SAMPLE_COLLEGES[1]?.collegeId || SAMPLE_COLLEGES[0]?.collegeId || ""
  );
  const [message, setMessage] = React.useState("Our cadet squadron challenges your campus to a 15-question speed clash!");
  const [scheduledAt, setScheduledAt] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opponentCollegeId: opponentId,
          message,
          scheduledAt: scheduledAt || new Date(Date.now() + 3600000 * 2).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to issue challenge");
      }

      onCreated(data.challenge);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to issue challenge");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-black text-white">Issue Campus Challenge</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Select Rival College
            </label>
            <select
              value={opponentId}
              onChange={(e) => setOpponentId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            >
              {SAMPLE_COLLEGES.slice(1).map((c) => (
                <option key={c.collegeId} value={c.collegeId}>
                  {c.collegeName} ({c.shortName}) - MMR {c.eloRating}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Challenge Provocation & Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Scheduled Match Time (Optional)
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={submitting}>
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {submitting ? "Sending..." : "Dispatch Challenge"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
