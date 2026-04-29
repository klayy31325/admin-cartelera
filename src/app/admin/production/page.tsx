import { ProductionForm } from "@/components/production-form";
import { Activity, ShieldAlert } from "lucide-react";

export default function ProductionPage() {
  return (
    <div className="space-y-10">
      {/* Header Estilo CUREX */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
            <Activity size={12} className="text-brand" />
            Location: Central Hub - Sector Alpha
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white">
            PRODUCTION <span className="text-brand">TERMINAL</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
            <ShieldAlert size={16} className="text-red-500" />
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">No Alerts</span>
          </div>
          <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Link Stable</span>
          </div>
        </div>
      </header>

      {/* Formulario Principal */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <ProductionForm />
      </section>

      {/* Footer Técnico */}
      <footer className="pt-12 border-t border-zinc-900 flex justify-between items-center text-[9px] text-zinc-700 font-bold uppercase tracking-widest">
        <span>Dev_Port: 042 // Billboard_Sync: Active</span>
        <span>Secured by Curex_Shield v4.2.0</span>
      </footer>
    </div>
  );
}
