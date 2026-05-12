"use client";

import { useState } from "react";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { leerProduccionDesdeExcel } from "@/lib/excel-utils";
import { toast } from "sonner";

export function ExcelImport() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
      } else {
        toast.error("Por favor, selecciona un archivo Excel válido (.xlsx)");
      }
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const data = await leerProduccionDesdeExcel(file);
      if (data.length === 0) {
        throw new Error("No se encontraron datos válidos en el archivo");
      }

      setProgress({ current: 0, total: data.length });
      const token = localStorage.getItem("curex_token");

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        try {
          const res = await fetch("http://localhost:8000/api/produccion", {
            method: "POST",
            body: JSON.stringify(item),
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
          });

          if (res.ok) successCount++;
          else errorCount++;
        } catch (e) {
          errorCount++;
        }
        setProgress(prev => ({ ...prev, current: i + 1 }));
      }

      toast.success(`Importación finalizada: ${successCount} éxitos, ${errorCount} errores`);
      setFile(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al importar el archivo";
      toast.error(message);
    } finally {
      setIsUploading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {!file ? (
        <div className="relative group">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          />
          <Button
            variant="outline"
            className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 px-8 h-12 rounded-xl text-[15px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border-dashed hover:border-brand/50 hover:text-brand"
          >
            <Upload size={20} />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 pl-4 pr-1 py-1 rounded-xl animate-in fade-in zoom-in-95 duration-300">
          <span className="text-[10px] font-bold text-zinc-400 truncate max-w-[120px]">{file.name}</span>
          <button
            onClick={() => setFile(null)}
            className="p-1 hover:bg-white/5 rounded-lg text-zinc-600 hover:text-red-500 transition-colors"
          >
            <X size={14} />
          </button>
          <Button
            onClick={handleImport}
            disabled={isUploading}
            size="sm"
            className="bg-brand hover:bg-brand/90 text-black font-black h-7 text-[9px] rounded-lg px-3"
          >
            {isUploading ? (
              <Loader2 className="animate-spin" size={12} />
            ) : (
              "CARGAR"
            )}
          </Button>
        </div>
      )}

      {isUploading && (
        <div className="w-48 animate-in slide-in-from-right-2 duration-300">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[8px] font-black text-zinc-600 uppercase">Cargando...</span>
            <span className="text-[8px] font-black text-brand">{progress.current}/{progress.total}</span>
          </div>
          <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
