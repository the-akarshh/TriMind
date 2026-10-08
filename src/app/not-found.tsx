import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-violet-600/20 text-violet-400 flex items-center justify-center mb-4">
        <Zap className="w-8 h-8" />
      </div>
      <h2 className="text-3xl font-black text-white mb-2">404 - Arena Sector Not Found</h2>
      <p className="text-sm text-slate-400 max-w-sm mb-6">
        The competition room or arena page you are looking for does not exist or has been archived.
      </p>
      <Link href="/">
        <Button variant="primary">Return to Arena Hub</Button>
      </Link>
    </div>
  );
}
