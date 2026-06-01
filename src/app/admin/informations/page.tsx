"use client";

import { InformacionManager } from "@/components/informacion-manager";
import { Megaphone } from "lucide-react";

export default function InformationsPage() {
  return (
    <main className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 bg-brand/5 border border-brand/10 p-6 rounded-[2.5rem] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-[50px] -mr-10 -mt-10 rounded-full group-hover:bg-brand/20 transition-all duration-700" />

        <div className="p-4 rounded-3xl bg-brand/10 border border-brand/20">
          <Megaphone className="w-8 h-8 text-brand" />
        </div>

        <div className="space-y-1">

          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
            Internal Communications & Daily Information
          </p>
        </div>
      </div>

      <InformacionManager />
    </main>
  );
}
