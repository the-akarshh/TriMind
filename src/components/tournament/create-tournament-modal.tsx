"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { SAMPLE_COLLEGES } from "@/lib/services/league-service";
import { X, Trophy, Plus, Check } from "lucide-react";

interface CreateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (tourn: any) => void;
}

export function CreateTournamentModal({
  isOpen,
  onClose,
  onCreated,
}: CreateTournamentModalProps) {
  const [title, setTitle] = React.useState("National Placement Cup 2026");
  const [description, setDescription] = React.useState("Inter-collegiate single elimination championship.");
  const [season, setSeason] = React.useState("Season 1 (Autumn 2026)");
  const [prizePool, setPrizePool] = React.useState("₹2,50,000 Placement Prize");
  const [selectedColleges, setSelectedColleges] = React.useState<string[]>(
    SAMPLE_COLLEGES.slice(0, 8).map((c) => c.collegeId)
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const toggleCollege = (collegeId: string) => {
    if (selectedColleges.includes(collegeId)) {
      if (selectedColleges.length <= 4) {
        setError("At least 4 colleges are required for bracket generation.");
        return;
      }
      setSelectedColleges(selectedColleges.filter((id) => id !== collegeId));
    } else {
      if (selectedColleges.length >= 16) {
        setError("Maximum 16 colleges allowed in single elimination bracket.");
        return;
      }
      setSelectedColleges([...selectedColleges, collegeId]);
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedColleges.length < 4) {
      setError("Please select at least 4 colleges (4, 8, or 16 recommended).");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          season,
          format: "SINGLE_ELIMINATION",
          minColleges: selectedColleges.length,
          maxColleges: selectedColleges.length,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000 * 7).toISOString(),
          prizePool,
          participantCollegeIds: selectedColleges,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create tournament");
      }

      onCreated(data.tournament);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create tournament");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black text-white">Create Elimination Tournament</h2>
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
              Tournament Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Season
              </label>
              <input
                type="text"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Prize Pool
              </label>
              <input
                type="text"
                value={prizePool}
                onChange={(e) => setPrizePool(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300">
                Select Participating Colleges ({selectedColleges.length} Selected)
              </label>
              <span className="text-[10px] text-slate-500">Pick 4, 8, or 16</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SAMPLE_COLLEGES.map((c) => {
                const isSelected = selectedColleges.includes(c.collegeId);
                return (
                  <button
                    key={c.collegeId}
                    type="button"
                    onClick={() => toggleCollege(c.collegeId)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col justify-between h-20 ${
                      isSelected
                        ? "bg-violet-600/20 border-violet-500 text-white"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono font-black text-xs">
                        {c.shortName}
                      </span>
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-violet-400" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </div>
                    <span className="text-[10px] truncate text-slate-300">
                      {c.collegeName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={submitting}>
              {submitting ? "Generating Bracket..." : "Create & Build Bracket"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
