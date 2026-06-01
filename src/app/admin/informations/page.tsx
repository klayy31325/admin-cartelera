"use client";

import { InformacionManager } from "@/components/informacion-manager";
import { Megaphone } from "lucide-react";

export default function InformationsPage() {
  return (
    <main className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border border-zinc-200/5 dark:border-white/[0.04] bg-zinc-100/50 dark:bg-zinc-900/30 p-5 rounded-lg relative overflow-hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.35em] text-brand">
            <Megaphone size={12} />
            COMUNICACIONES // NOVEDADES
          </div>
          <h1 className="text-base font-black tracking-widest text-foreground uppercase mt-1">
            INFORMACIÓN DIARIA
          </h1>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider leading-relaxed">
            Publicación de comunicados internos, metas diarias y noticias generales para el personal de planta.
          </p>
        </div>
      </header>

      <InformacionManager />
    </main>
  );
}
