"use client";

import { InformacionManager } from "@/components/informacion-manager";

export default function InformationsPage() {
  return (
    <main className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="bg-white dark:bg-zinc-900/20 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/40 p-4 md:p-6 shadow-sm">
        <InformacionManager />
      </section>
    </main>
  );
}