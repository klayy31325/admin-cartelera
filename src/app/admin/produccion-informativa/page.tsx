"use client";

import { ProduccionInformativaManager } from "@/components/produccion-informativa-manager";
import { ClipboardList } from "lucide-react";

export default function ProduccionInformativaPage() {
  return (
    <main className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 bg-brand/5 border border-brand/10 p-6 rounded-[2.5rem] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-[50px] -mr-10 -mt-10 rounded-full group-hover:bg-brand/20 transition-all duration-700" />
        
        <div className="p-4 rounded-3xl bg-brand/10 border border-brand/20">
          <ClipboardList className="w-8 h-8 text-brand" />
        </div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-black dark:text-white">Planificación Diaria</h1>
            <p className="text-xs font-black text-zinc-500 dark:text-zinc-500 uppercase tracking-[0.3em]">Gestión de producción informativa</p>

      </div>

      <ProduccionInformativaManager />
    </main>
  );
}
