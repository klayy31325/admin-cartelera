"use client";

import { useState } from "react";
import { ExcelImportForm } from "@/components/excel-import-form";
import { TrabajoForm } from "@/components/trabajo-form";
import { VelocidadForm } from "@/components/velocity-form";
import { WasteForm } from "@/components/waste-form";
import { ProductionList } from "@/components/production-list";
import {
  Activity, ShieldAlert, FileSpreadsheet,
  ClipboardList, Zap, Trash2, Download
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";

const TABS = [
  { id: "import", label: "Importar Excel", icon: FileSpreadsheet },
  { id: "list", label: "Bitácora Producción", icon: Activity },
  { id: "trabajo", label: "Carga Manual (Aux)", icon: ClipboardList },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ProductionPage() {
  const [activeTab, setActiveTab] = useState<TabId>("import");

  function handleExport() {
    const token = localStorage.getItem("curex_token");
    window.open(`${API_BASE_URL}/trabajos/export?token=${token}`, "_blank");
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-900 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
            <Activity size={12} className="text-brand" />
          </div>

        </div>

        <div className="flex items-center gap-3">
          {/* Export Button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-2 bg-zinc-100 hover:bg-zinc-500 border border-zinc-700 hover:border-brand/40 rounded-xl text-[15px] font-black uppercase tracking-widest text-zinc-900 hover:text-brand transition-all"
          >
            <Download size={20} />
          </button>

          <div className="px-5 py-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-zinc-900/50 p-1.5 rounded-2xl w-fit border border-zinc-800">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest
                transition-all duration-200
                ${isActive
                  ? "bg-brand text-black shadow-lg shadow-brand/20"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                }
              `}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <section className="animate-in fade-in slide-in-from-bottom-3 duration-500">
        {activeTab === "import" && <ExcelImportForm />}
        {activeTab === "list" && <ProductionList />}
        {activeTab === "trabajo" && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest text-center">
                Atención: Use la carga manual solo si el Excel no está disponible.
              </p>
            </div>
            <TrabajoForm />
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="pt-8 border-t border-zinc-900 flex justify-between items-center text-[8px] text-zinc-700 font-bold uppercase tracking-widest">
        <span>Dev_Port: 042 // Billboard_Sync: Active</span>
        <span>Secured by Curex_Shield v4.2.0</span>
      </footer>
    </div>
  );
}
