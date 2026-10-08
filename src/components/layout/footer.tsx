import Link from "next/link";
import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 text-slate-400">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">
              APTITUDE<span className="text-violet-400 ml-1">ARENA</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
            Real-time multiplayer aptitude and logical reasoning competition platform for college students.
            Practice aptitude. Compete live. Get placement-ready.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
            Core Topics
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/questions" className="hover:text-violet-400 transition-colors">
                Quantitative Aptitude
              </Link>
            </li>
            <li>
              <Link href="/questions" className="hover:text-violet-400 transition-colors">
                Logical Reasoning
              </Link>
            </li>
            <li>
              <Link href="/questions" className="hover:text-violet-400 transition-colors">
                Verbal Ability
              </Link>
            </li>
            <li>
              <Link href="/questions" className="hover:text-violet-400 transition-colors">
                Data Interpretation
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
            Platform
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/join" className="hover:text-violet-400 transition-colors">
                Join Game Room
              </Link>
            </li>
            <li>
              <Link href="/league" className="hover:text-violet-400 transition-colors">
                College Leagues
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-violet-400 transition-colors">
                Placement Analytics
              </Link>
            </li>
            <li>
              <Link href="/host" className="hover:text-violet-400 transition-colors">
                Host Portal
              </Link>
            </li>
            <li>
              <Link href="/rules" className="hover:text-violet-400 transition-colors">
                Rules & Fair Play
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
        <p>© {new Date().getFullYear()} Aptitude Arena. Built for competitive collegiate excellence.</p>
        <p className="font-mono text-[11px]">Phase 1 Foundation • Production-Ready Engine</p>
      </div>
    </footer>
  );
}
