"use client";

import { useState, useCallback } from "react";
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api-config";

interface ImportResult {
  insertados: number;
  duplicados: number;
  errores: { fila: number; razon: string }[];
  velocidad_insertada: number;
  desperdicio_insertado: number;
  preview?: Record<string, unknown>[];
}

export function ExcelImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [maquina, setMaquina] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, unknown>[] | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith(".xlsx") || dropped?.name.endsWith(".xls")) {
      setFile(dropped);
      setPreviewData(null);
      setResult(null);
    } else {
      toast.error("Solo se aceptan archivos .xlsx o .xls");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreviewData(null);
      setResult(null);
    }
  };

  async function sendRequest(preview: boolean) {
    if (!file) return toast.error("Selecciona un archivo Excel");
    if (!maquina) return toast.error("Selecciona la máquina");

    setIsLoading(true);
    const toastId = toast.loading(preview ? "Analizando archivo Excel..." : "Importando datos desde Excel...");

    try {
      const token = localStorage.getItem("curex_token");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("maquina", maquina);

      const res = await fetch(
        `${API_BASE_URL}/trabajos/import${preview ? "?preview=true" : ""}`,
        { method: "POST", body: formData, headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Error en la importación");

      toast.dismiss(toastId);

      if (preview) {
        setPreviewData(data.data.preview || []);
        toast.success(`Vista previa: ${data.data.preview?.length ?? 0} trabajos encontrados en el Excel`);
      } else {
        setResult(data.data);
        setPreviewData(null);
        
        const hasErrors = data.data.errores && data.data.errores.length > 0;
        const hasDuplicates = data.data.duplicados > 0;
        if (hasErrors) {
          toast.warning(
            `Importación parcial: ${data.data.insertados} guardados, ${data.data.duplicados} duplicados omitidos, ${data.data.errores.length} filas con errores`,
            { duration: 6000 }
          );
        } else if (hasDuplicates) {
          toast.success(`Importación completada: ${data.data.insertados} trabajos guardados, ${data.data.duplicados} duplicados omitidos`);
        } else {
          toast.success(`Importación exitosa: ${data.data.insertados} trabajos registrados correctamente`);
        }
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err instanceof Error ? err.message : "Error desconocido al procesar el archivo");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden group bg-white/95 dark:bg-zinc-950/70 backdrop-blur-md p-6 md:p-8 rounded-xl border border-zinc-200 dark:border-brand/20 hover:border-brand/35 dark:hover:border-brand/40 shadow-soft dark:shadow-[0_0_30px_rgba(249,115,22,0.05)] hover:dark:shadow-[0_0_40px_rgba(249,115,22,0.1)] transition-all duration-500 space-y-8 max-w-4xl mx-auto">
      {/* Glow horizontal top brand line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="text-brand" size={18} />
        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-foreground">IMPORTAR DESDE EXCEL</h4>
        <div className="h-[1px] flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dropzone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={cn(
            "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-4 min-h-[200px]",
            isDragging ? "border-brand bg-brand/10" : "border-zinc-200 hover:border-brand/40 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-brand/40 dark:hover:bg-zinc-900/40",
            file && "border-green-500/40 bg-green-500/5"
          )}
          onClick={() => document.getElementById("excel-file-input")?.click()}
        >
          <input
            id="excel-file-input"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          {file ? (
            <>
              <CheckCircle2 size={40} className="text-green-400" />
              <div>
                <p className="text-sm font-black text-green-400">{file.name}</p>
                <p className="text-[10px] text-zinc-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewData(null); setResult(null); }}
                className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-200"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <UploadCloud size={40} className="text-zinc-500" />
              <div>
                <p className="text-sm font-black text-zinc-400">Arrastra el archivo Excel aquí</p>
                <p className="text-[10px] text-zinc-600 mt-1">o haz clic para seleccionar</p>
              </div>
              <p className="text-[9px] text-zinc-700 uppercase tracking-widest">.xlsx / .xls</p>
            </>
          )}
        </div>

        {/* Selector de máquina + acciones */}
        <div className="flex flex-col gap-4 justify-center">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Máquina del Informe</label>
            <Select value={maquina} onValueChange={setMaquina}>
              <SelectTrigger className="bg-background border-border h-11 rounded-xl text-base font-bold">
                <SelectValue placeholder="Seleccionar máquina" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="OLYMPIA">OLYMPIA</SelectItem>
                <SelectItem value="NOVOFLEX">NOVOFLEX</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            onClick={() => sendRequest(true)}
            disabled={isLoading || !file || !maquina}
            variant="outline"
            className="h-11 rounded-xl font-black border-zinc-700 hover:border-brand/50 hover:bg-brand/10"
          >
            {isLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
            PREVISUALIZAR DATOS
          </Button>

          <Button
            type="button"
            onClick={() => sendRequest(false)}
            disabled={isLoading || !file || !maquina}
            className="h-11 rounded-xl font-black bg-brand hover:bg-brand/90 text-white"
          >
            {isLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
            CONFIRMAR IMPORTACIÓN
          </Button>
        </div>
      </div>

      {/* Resultado */}
      {result && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-green-600 dark:text-green-400">{result.insertados}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-green-500/60 mt-1">Trabajos</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{result.velocidad_insertada}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500/60 mt-1">Velocidades</p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-purple-600 dark:text-purple-400">{result.desperdicio_insertado}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-500/60 mt-1">Desperdicios</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{result.duplicados}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/60 mt-1">Duplicados</p>
          </div>
          {result.errores.length > 0 && (
            <div className="col-span-2 md:col-span-4 bg-red-500/10 border border-red-500/20 rounded-xl p-6 space-y-3 animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-500">
                <AlertTriangle size={20} />
                <p className="text-sm font-black uppercase tracking-widest">
                  DETALLE DE FALLOS EN EL EXCEL ({result.errores.length})
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {result.errores.map((e, i) => (
                  <div key={i} className="flex gap-3 items-start bg-red-500/5 p-2 rounded-lg border border-red-500/10">
                    <span className="text-[10px] font-black bg-red-500 text-white px-2 py-0.5 rounded uppercase">Fila {e.fila}</span>
                    <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">{e.razon}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-zinc-500 italic mt-2">
                * Las filas que no aparecen en esta lista se guardaron correctamente. Corrija estos errores en el Excel y vuelva a subirlo.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Vista previa */}
      {previewData && previewData.length > 0 && (
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Vista Previa — {previewData.length} registros
          </p>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/50">
                  {["Pedido", "Fecha", "Cliente", "Velocidad", "Desperdicio", "Paradas", "Estado"].map(h => (
                    <th key={h} className="px-4 py-3 font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.slice(0, 15).map((row: any, i) => {
                  const vel = row.velocidad || {};
                  const desp = row.desperdicio || {};
                  const rendimiento = vel.teorica > 0 ? Math.round((vel.real / vel.teorica) * 100) : 0;

                  return (
                    <tr key={i} className="border-b border-zinc-200/60 dark:border-zinc-800/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/20">
                      <td className="px-4 py-3">
                        <div className="font-black text-brand">{String(row.numero_pedido ?? "")}</div>
                        <div className="text-[9px] text-zinc-600 truncate max-w-[120px]">{String(row.producto ?? "")}</div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{String(row.fecha ?? "")}</td>
                      <td className="px-4 py-3 text-zinc-300 max-w-[150px] truncate">{String(row.cliente ?? "")}</td>
                      
                      {/* Velocidad */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-zinc-200">{Math.round(vel.real || 0)}</span>
                          <span className="text-[9px] text-zinc-600">/ {Math.round(vel.teorica || 0)}</span>
                          {rendimiento > 0 && (
                            <span className={cn(
                              "text-[9px] font-black px-1 rounded-sm",
                              rendimiento >= 85 ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
                            )}>
                              {rendimiento}%
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Desperdicio */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-purple-400">{((desp.kg_film || 0) + (desp.tinta_kg || 0)).toFixed(1)} Kg</span>
                          <span className="text-[9px] text-zinc-600">{desp.solvente_lts || 0} Lts Solv.</span>
                        </div>
                      </td>

                      {/* Paradas */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-300">{row.tiempo_parada_total_min || 0} min</span>
                          {row.paradas?.length > 0 && (
                            <span className="text-[8px] bg-zinc-800 text-zinc-500 px-1 rounded border border-zinc-700">
                              {row.paradas.length} cat.
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-zinc-700 text-zinc-300 text-[9px] font-black uppercase">
                          {String(row.status_orden ?? "")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {previewData.length > 15 && (
              <p className="px-4 py-2 text-[10px] text-zinc-600 font-black">
                ...y {previewData.length - 15} registros más
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
