"use client";

import { useState } from "react";
import { Download, Loader2, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { API_BASE_URL } from "@/lib/api-config";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportModal({ open, onOpenChange }: ExportModalProps) {
  const [maquina, setMaquina] = useState<string>("todas");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
      return toast.error("La fecha de inicio no puede ser mayor que la fecha fin");
    }

    setIsExporting(true);
    const toastId = toast.loading("Generando reporte Excel...");

    try {
      const token = localStorage.getItem("curex_token");
      const params = new URLSearchParams();
      if (maquina !== "todas") params.set("maquina_id", maquina);
      if (fechaInicio) params.set("fecha_inicio", fechaInicio);
      if (fechaFin) params.set("fecha_fin", fechaFin);
      params.set("token", token || "");

      const url = `${API_BASE_URL}/trabajos/export?${params.toString()}`;
      const res = await fetch(url);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || "Error al generar el reporte");
      }

      const blob = await res.blob();
      const filename = `produccion_resumen_${maquina === "todas" ? "ambas" : maquina === "1" ? "olympia" : "novoflex"}_${fechaInicio || "inicio"}_${fechaFin || "fin"}.xlsx`;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast.dismiss(toastId);
      toast.success("Reporte exportado exitosamente");
      onOpenChange(false);
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(error instanceof Error ? error.message : "Error al exportar");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet size={18} />
            Exportar Reporte
          </DialogTitle>
          <DialogDescription>
            Selecciona la máquina y el rango de fechas para generar el reporte de resumen mensual y totales de paradas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="maquina">Máquina</Label>
            <Select value={maquina} onValueChange={setMaquina}>
              <SelectTrigger id="maquina">
                <SelectValue placeholder="Seleccionar máquina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las máquinas</SelectItem>
                <SelectItem value="1">OLYMPIA</SelectItem>
                <SelectItem value="2">NOVOFLEX</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fechaInicio">Fecha inicio</Label>
              <Input
                id="fechaInicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaFin">Fecha fin</Label>
              <Input
                id="fechaFin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="gap-2"
          >
            {isExporting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            {isExporting ? "Exportando..." : "Exportar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
