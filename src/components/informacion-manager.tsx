"use client";

import { useState, useEffect } from "react";
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Info,
  Calendar,
  AlertTriangle,
  ArrowUpCircle,
  X,
  Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api-config";

interface Informacion {
  id: number;
  titulo: string;
  contenido: string;
  prioridad: 'alta' | 'media' | 'baja';
  fecha_publicacion: string;
  fecha_expiracion: string | null;
  activo: boolean;
  empresa_id: number;
}

export function InformacionManager() {
  const [informaciones, setInformaciones] = useState<Informacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({ 
    titulo: "", 
    contenido: "", 
    prioridad: "baja" as 'alta' | 'media' | 'baja',
    fecha_publicacion: new Date().toISOString().split('T')[0],
    fecha_expiracion: ""
  });

  const fetchInformaciones = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/informacion`);
      const data = await res.json();
      const listado = data.success ? data.data : (Array.isArray(data) ? data : []);
      setInformaciones(listado);
    } catch (error) {
      toast.error("Error al conectar con el servidor");
      setInformaciones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInformaciones();
  }, []);

  const resetForm = () => {
    setFormData({
      titulo: "",
      contenido: "",
      prioridad: "baja",
      fecha_publicacion: new Date().toISOString().split('T')[0],
      fecha_expiracion: ""
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo || !formData.contenido) return toast.error("Complete título y contenido");

    try {
      const payload = {
        ...formData,
        empresa_id: 2,
        fecha_expiracion: formData.fecha_expiracion || null,
        activo: true
      };

      const url = editingId 
        ? `${API_BASE_URL}/informacion/${editingId}`
        : `${API_BASE_URL}/informacion`;
      
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingId ? "Anuncio actualizado" : "Anuncio publicado");
        resetForm();
        fetchInformaciones();
      }
    } catch (error) {
      toast.error("Error en la operación");
    }
  };

  const handleEdit = (info: Informacion) => {
    setFormData({
      titulo: info.titulo,
      contenido: info.contenido,
      prioridad: info.prioridad,
      fecha_publicacion: info.fecha_publicacion.split('T')[0],
      fecha_expiracion: info.fecha_expiracion ? info.fecha_expiracion.split('T')[0] : ""
    });
    setEditingId(info.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggle = async (id: number, currentStatus: boolean) => {
    try {
      await fetch(`${API_BASE_URL}/informacion/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !currentStatus }),
      });
      fetchInformaciones();
      toast.success(currentStatus ? "Desactivado" : "Activado");
    } catch (error) {
      toast.error("Error al actualizar");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este anuncio permanentemente?")) return;
    try {
      await fetch(`${API_BASE_URL}/informacion/${id}`, { method: "DELETE" });
      toast.success("Eliminado");
      fetchInformaciones();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const getPriorityStyles = (p: string) => {
    switch(p) {
      case 'alta': return 'text-red-500 bg-red-500/10 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
      case 'media': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16">
      {/* Header Industrial */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white dark:bg-zinc-950 p-10 rounded-2xl border border-zinc-200 dark:border-white/[0.05] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 blur-[100px] -mr-32 -mt-32 rounded-full" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 bg-brand flex items-center justify-center text-black rounded-2xl shadow-xl shadow-brand/20">
            <Megaphone size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase leading-none">Cartelera Digital</h2>
            <p className="text-[10px] font-black text-brand uppercase tracking-[0.4em] mt-3 bg-brand/10 inline-block px-3 py-1 rounded-full border border-brand/20">Terminal de Control de Avisos</p>
          </div>
        </div>
        
        <Button 
          onClick={() => isAdding ? resetForm() : setIsAdding(true)}
          className={cn(
            "h-16 px-10 rounded-xl font-black uppercase tracking-[0.2em] transition-all relative z-10",
            isAdding ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500" : "bg-brand text-black hover:scale-105 shadow-xl shadow-brand/20"
          )}
        >
          {isAdding ? <><X size={20} className="mr-2" /> Cancelar</> : <><Plus size={20} className="mr-2" /> Nuevo Aviso</>}
        </Button>
      </div>

      {/* Formulario Maestro */}
      {isAdding && (
        <Card className="p-10 bg-white dark:bg-zinc-900/40 border-2 border-brand/20 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-500">
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contenido */}
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Cabecera del Mensaje</label>
                  <Input 
                    placeholder="Escriba un título impactante..."
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="bg-zinc-50 dark:bg-black/20 border-zinc-200 dark:border-white/[0.05] h-16 rounded-xl text-lg font-bold"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Cuerpo de la Información</label>
                  <Textarea 
                    placeholder="Detalle el aviso aquí..."
                    value={formData.contenido}
                    onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                    className="bg-zinc-50 dark:bg-black/20 border-zinc-200 dark:border-white/[0.05] rounded-xl text-base font-medium min-h-[160px] p-6"
                  />
                </div>
              </div>

              {/* Configuración de Prioridad y Fechas */}
              <div className="space-y-8 bg-zinc-50/50 dark:bg-white/[0.02] p-8 rounded-2xl border border-zinc-200/50 dark:border-white/[0.03]">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <ArrowUpCircle size={14} className="text-brand" /> Prioridad de Visualización
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['baja', 'media', 'alta'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({ ...formData, prioridad: p as any })}
                        className={cn(
                          "h-14 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                          formData.prioridad === p 
                            ? "bg-brand text-black border-brand shadow-lg shadow-brand/20" 
                            : "bg-white dark:bg-black/40 border-zinc-200 dark:border-white/[0.05] text-zinc-400 hover:border-brand/30"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={14} /> Fecha Inicio
                    </label>
                    <Input 
                      type="date"
                      value={formData.fecha_publicacion}
                      onChange={(e) => setFormData({ ...formData, fecha_publicacion: e.target.value })}
                      className="bg-white dark:bg-black/40 border-zinc-200 dark:border-white/[0.05] h-14 rounded-xl font-bold"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={14} /> Fecha Expiración
                    </label>
                    <Input 
                      type="date"
                      value={formData.fecha_expiracion}
                      onChange={(e) => setFormData({ ...formData, fecha_expiracion: e.target.value })}
                      className="bg-white dark:bg-black/40 border-zinc-200 dark:border-white/[0.05] h-14 rounded-xl font-bold text-red-500/80"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button type="submit" className="bg-brand text-black font-black px-20 h-20 rounded-xl uppercase tracking-[0.3em] text-lg hover:scale-105 transition-all shadow-2xl shadow-brand/30">
                {editingId ? "Actualizar Registro" : "Publicar Aviso"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Galería de Avisos */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <div className="w-16 h-16 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em]">Sincronizando Base de Datos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {informaciones.length === 0 ? (
            <div className="col-span-full py-32 text-center space-y-6 bg-zinc-50/50 dark:bg-zinc-900/10 border-4 border-dashed border-zinc-100 dark:border-white/[0.02] rounded-2xl">
               <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                 <Info size={32} className="text-zinc-300 dark:text-zinc-600" />
               </div>
               <p className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em]">No se encontraron avisos activos en el sistema</p>
            </div>
          ) : (
            informaciones.map((info) => (
              <Card key={info.id} className={cn(
                "group relative overflow-hidden p-10 rounded-2xl border-2 transition-all duration-700 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col h-full",
                info.activo 
                  ? "bg-white dark:bg-zinc-900/40 border-zinc-100 dark:border-white/[0.03]" 
                  : "bg-zinc-50/50 dark:bg-black/40 border-transparent opacity-60 grayscale-[0.8]"
              )}>
                {/* Header Card */}
                <div className="flex items-center justify-between mb-8">
                  <div className={cn(
                    "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border-2",
                    getPriorityStyles(info.prioridad)
                  )}>
                    {info.prioridad === 'alta' ? <AlertTriangle size={12} /> : <ArrowUpCircle size={12} />}
                    {info.prioridad}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", info.activo ? "bg-green-500 animate-pulse" : "bg-zinc-500")} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{info.activo ? "Live" : "Off"}</span>
                  </div>
                </div>

                <div className="space-y-4 flex-1">
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-tight group-hover:text-brand transition-colors duration-500">
                    {info.titulo}
                  </h3>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-5">
                    {info.contenido}
                  </p>
                </div>

                {/* Timeline */}
                <div className="mt-10 pt-8 border-t border-zinc-100 dark:border-white/[0.03] space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    <span className="flex items-center gap-2"><Clock size={14} className="text-brand" /> Desde</span>
                    <span className="font-mono text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/[0.03] px-3 py-1 rounded-lg">
                      {new Date(info.fecha_publicacion).toLocaleDateString()}
                    </span>
                  </div>
                  {info.fecha_expiracion && (
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-red-500/60">
                      <span className="flex items-center gap-2"><Calendar size={14} /> Expira</span>
                      <span className="font-mono bg-red-500/5 px-3 py-1 rounded-lg">
                        {new Date(info.fecha_expiracion).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Industrial Actions */}
                <div className="flex items-center gap-3 mt-8">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleToggle(info.id, info.activo)}
                    className={cn(
                      "flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all",
                      info.activo ? "hover:bg-amber-500/10 hover:text-amber-500 border-transparent hover:border-amber-500/30" : "hover:bg-green-500/10 hover:text-green-500 border-transparent hover:border-green-500/30"
                    )}
                  >
                    {info.activo ? "Pausar" : "Activar"}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleEdit(info)}
                    className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-white/[0.03] text-zinc-400 hover:text-brand hover:bg-brand/10 border border-transparent hover:border-brand/30"
                  >
                    <Edit2 size={18} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDelete(info.id)}
                    className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-white/[0.03] text-zinc-400 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/30"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
