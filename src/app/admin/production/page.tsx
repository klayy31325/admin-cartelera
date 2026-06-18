"use client";

import { useState, useMemo } from "react";
import { ExcelImportForm } from "@/components/excel-import-form";
import { TotalesForm } from "@/components/totales-form";
import { ProductionList } from "@/components/production-list";
import { ExportModal } from "@/components/export-modal";
import {
  Activity, FileSpreadsheet,
  ClipboardList, Download
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";


type TabId = "import" | "list" | "trabajo";

export default function ProductionPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("list");
  const [showExportModal, setShowExportModal] = useState(false);

  const TABS = useMemo(() => {
    const items: { id: TabId; label: string; icon: typeof Activity }[] = [];
    if (user?.rol === "admin" || user?.rol === "editor" || user?.rol === "operador") {
      items.push({ id: "import", label: "Importar Excel", icon: FileSpreadsheet });
    }
    if (user?.rol === "admin" || user?.rol === "editor" || user?.rol === "operador") {
      items.push({ id: "trabajo", label: "Carga Manual de Totales", icon: ClipboardList });
    }
    return items;
  }, [user?.rol]);

  function handleExport() {
    setShowExportModal(true);
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border border-zinc-200/5 dark:border-white/[0.04] bg-zinc-100/50 dark:bg-zinc-900/30 p-5 rounded-lg relative overflow-hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.35em] text-brand">
            <Activity size={12} />
            PRODUCCIÓN // BITÁCORA
          </div>
          <h1 className="text-base font-black tracking-widest text-foreground uppercase mt-1">
            REGISTROS DE PLANTA
          </h1>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider leading-relaxed">
            Importación y administración manual del historial de metros, desperdicio y eficiencia operativa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Export Button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white transition-all"
            title="Exportar Datos"
          >
            <Download size={14} />
            Exportar
          </button>

          <div className="px-4 py-2.5 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Sincronizado</span>
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
                  ? "bg-brand text-white shadow-lg shadow-brand/20"
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
        {activeTab === "trabajo" && <TotalesForm />}
      </section>

      {/* Footer */}
      <footer className="pt-8 border-t border-zinc-900 flex justify-between items-center text-[15px] text-zinc-700 font-bold uppercase tracking-widest">
        <span>Dev_Port: 042 // Billboard_Sync: Active</span>
        <span>Secured by Curex_Shield v4.2.0</span>
      </footer>

      <ExportModal open={showExportModal} onOpenChange={setShowExportModal} />
    </div>
  );
}
