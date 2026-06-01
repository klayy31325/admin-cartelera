"use client";

import { useState, useEffect } from "react";
import { 
  Plus, X, Edit2, Trash2, CheckCircle2, Clock, 
  AlertTriangle, ArrowUpCircle, Calendar, Target,
  Cpu, LayoutList, LayoutGrid, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "@/lib/api-config";

interface ProduccionInfo {
  id: number;
  empresa_id: number;
  maquina_id: number;
  maquina_nombre?: string;
  tarea: string;
  meta_valor: number | null;
  descripcion_secundaria: string | null;
  prioridad: 'baja' | 'media' | 'alta';
  estado: 'pendiente' | 'en_progreso' | 'completado';
  fecha_asignada: string;
}

interface Maquina {
  id: number;
  nombre: string;
}

export function ProduccionInformativaManager() {
  const [items, setItems] = useState<ProduccionInfo[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    maquina_id: '',
    tarea: '',
    meta_valor: '',
    descripcion_secundaria: '',
    prioridad: 'baja' as const,
    estado: 'pendiente' as const,
    fecha_asignada: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchItems();
    fetchMaquinas();
  }, []);

  const fetchMaquinas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/public/maquinas`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMaquinas(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching machines:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/produccion-informativa`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setItems(data.data);
        }
      }
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.maquina_id || !formData.tarea) {
      toast.error("Complete los campos obligatorios");
      return;
    }

    try {
      const url = editingId 
        ? `${API_BASE_URL}/produccion-informativa/${editingId}` 
        : `${API_BASE_URL}/produccion-informativa`;
      
      const payload = {
        ...formData,
        meta_valor: formData.meta_valor ? Number(formData.meta_valor) : null
      };

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(editingId ? "Tarea actualizada" : "Tarea creada");
        setFormData({
          maquina_id: '',
          tarea: '',
          meta_valor: '',
          descripcion_secundaria: '',
          prioridad: 'baja',
          estado: 'pendiente',
          fecha_asignada: new Date().toISOString().split('T')[0]
        });
        setIsAdding(false);
        setEditingId(null);
        fetchItems();
      }
    } catch (error) {
      toast.error("Error al guardar");
    }
  };

  const handleEdit = (item: ProduccionInfo) => {
    setFormData({
      maquina_id: item.maquina_id.toString(),
      tarea: item.tarea,
      meta_valor: item.meta_valor !== null ? item.meta_valor.toString() : '',
      descripcion_secundaria: item.descripcion_secundaria || '',
      prioridad: item.prioridad,
      estado: item.estado,
      fecha_asignada: item.fecha_asignada.split('T')[0]
    });
    setEditingId(item.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleComplete = async (item: ProduccionInfo) => {
    const nuevoEstado = item.estado === 'completado' ? 'pendiente' : 'completado';
    try {
      const response = await fetch(`${API_BASE_URL}/produccion-informativa/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, estado: nuevoEstado })
      });
      if (response.ok) {
        toast.success(nuevoEstado === 'completado' ? "Tarea completada" : "Tarea pendiente");
        fetchItems();
      }
    } catch (error) {
      toast.error("Error al actualizar");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta tarea?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/produccion-informativa/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success("Tarea eliminada");
        fetchItems();
      }
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const getPriorityStyles = (p: string) => {
    switch (p) {
      case 'alta': return "bg-red-500/10 text-red-500 border-red-500/20";
      case 'media': return "bg-brand/10 text-brand border-brand/20";
      default: return "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-white/5 dark:border-white/10";
    }
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'completado': return <CheckCircle2 size={14} className="text-green-500" />;
      case 'en_progreso': return <Clock size={14} className="text-brand animate-pulse" />;
      case 'en_progreso_dark': return <Clock size={14} className="text-zinc-950 animate-pulse" />;
      default: return <Clock size={14} className="text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-brand rounded-xl flex items-center justify-center shadow-2xl shadow-brand/20">
            <LayoutList size={32} className="text-black" />
          </div>
        </div>
        
        <Button 
          onClick={() => {
            setIsAdding(!isAdding);
            if (isAdding) setEditingId(null);
          }}
          className={cn(
            "h-16 px-8 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl",
            isAdding ? "bg-zinc-100 text-zinc-500 dark:bg-white/5" : "bg-brand text-black hover:scale-105 shadow-brand/20"
          )}
        >
          {isAdding ? <X className="mr-2" size={18} /> : <Plus className="mr-2" size={18} />}
          {isAdding ? "Cerrar Panel" : "Nueva Tarea"}
        </Button>
      </div>

      {/* Formulario */}
      {isAdding && (
        <Card className="p-10 rounded-2xl border-2 border-brand/20 bg-white dark:bg-zinc-900/40 shadow-2xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Plus size={120} className="text-brand" />
          </div>
          
          <form onSubmit={handleSubmit} className="relative z-10 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] ml-2">Unidad / Máquina</label>
                <select 
                  value={formData.maquina_id}
                  onChange={(e) => setFormData({ ...formData, maquina_id: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-black/40 border-2 border-zinc-100 dark:border-white/[0.05] h-14 rounded-xl px-6 font-bold text-zinc-900 dark:text-white focus:border-brand transition-all outline-none"
                >
                  <option value="">Seleccione máquina</option>
                  {maquinas.map(m => (
                    <option key={m.id} value={m.id}>{m.id} - {m.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] ml-2">Meta / Valor (MTS)</label>
                <Input 
                  type="number"
                  placeholder="Ej: 5000"
                  value={formData.meta_valor}
                  onChange={(e) => setFormData({ ...formData, meta_valor: e.target.value })}
                  className="bg-zinc-50 dark:bg-black/40 border-2 border-zinc-100 dark:border-white/[0.05] h-14 rounded-xl px-6 font-bold"
                />
              </div>

              <div className="space-y-4 md:col-span-1">
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] ml-2">Descripción de la Tarea</label>
                <Textarea 
                  placeholder="Describa la actividad o meta del día..."
                  value={formData.tarea}
                  onChange={(e) => setFormData({ ...formData, tarea: e.target.value })}
                  className="bg-zinc-50 dark:bg-black/40 border-2 border-zinc-100 dark:border-white/[0.05] min-h-[120px] rounded-xl p-6 font-bold"
                />
              </div>

              <div className="space-y-4 md:col-span-1">
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] ml-2">Descripción Secundaria</label>
                <Textarea 
                  placeholder="Detalles adicionales..."
                  value={formData.descripcion_secundaria}
                  onChange={(e) => setFormData({ ...formData, descripcion_secundaria: e.target.value })}
                  className="bg-zinc-50 dark:bg-black/40 border-2 border-zinc-100 dark:border-white/[0.05] min-h-[120px] rounded-xl p-6 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:col-span-2">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] ml-2">Prioridad</label>
                  <div className="flex gap-2">
                    {['baja', 'media', 'alta'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({ ...formData, prioridad: p as any })}
                        className={cn(
                          "flex-1 h-12 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all",
                          formData.prioridad === p 
                            ? "bg-brand border-brand text-black" 
                            : "bg-transparent border-zinc-100 dark:border-white/5 text-zinc-400"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] ml-2">Estado</label>
                  <select 
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                    className="w-full bg-zinc-50 dark:bg-black/40 border-2 border-zinc-100 dark:border-white/[0.05] h-12 rounded-xl px-4 font-bold text-[9px] uppercase tracking-widest outline-none"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_progreso">En Progreso</option>
                    <option value="completado">Completado</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] ml-2">Fecha</label>
                  <Input 
                    type="date"
                    value={formData.fecha_asignada}
                    onChange={(e) => setFormData({ ...formData, fecha_asignada: e.target.value })}
                    className="bg-white dark:bg-black/40 border-zinc-200 dark:border-white/[0.05] h-12 rounded-xl font-bold text-[9px]"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button type="submit" className="bg-brand text-black font-black px-20 h-20 rounded-xl uppercase tracking-[0.3em] text-lg hover:scale-105 transition-all shadow-2xl shadow-brand/30">
                {editingId ? "Actualizar Tarea" : "Asignar a Unidad"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Listado de Tareas */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <div className="w-16 h-16 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em]">Cargando planificación...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {items.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="py-32 text-center space-y-6 bg-zinc-50/50 dark:bg-zinc-900/10 border-4 border-dashed border-zinc-100 dark:border-white/[0.02] rounded-2xl"
              >
                 <p className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em]">No hay tareas informativas asignadas para hoy</p>
              </motion.div>
            ) : (
              items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className={cn(
                    "group relative overflow-hidden p-6 rounded-2xl border-2 transition-all duration-700 flex flex-col md:flex-row items-start md:items-center gap-8",
                    item.estado === 'completado' 
                      ? "bg-zinc-100 dark:bg-black/40 border-transparent opacity-60" 
                      : item.prioridad === 'alta'
                        ? "bg-brand dark:bg-brand border-transparent shadow-2xl shadow-brand/20"
                        : "bg-white dark:bg-zinc-900/40 border-zinc-100 dark:border-white/[0.03] hover:shadow-2xl hover:border-brand/20"
                  )}>
                    {/* Prioridad y Estado (Lado Izquierdo) */}
                    <div className="flex flex-row md:flex-col gap-3 min-w-[140px] shrink-0">
                      <div className={cn(
                        "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border-2",
                        item.prioridad === 'alta' && item.estado !== 'completado'
                          ? "text-zinc-950 bg-black/10 border-black/20"
                          : getPriorityStyles(item.prioridad)
                      )}>
                        {item.prioridad === 'alta' ? <AlertTriangle size={12} /> : <ArrowUpCircle size={12} />}
                        {item.prioridad}
                      </div>
                      <div className={cn(
                        "flex items-center justify-center gap-2 px-4 py-2 rounded-lg",
                        item.prioridad === 'alta' && item.estado !== 'completado'
                          ? "bg-black/10"
                          : "bg-zinc-100 dark:bg-white/5"
                      )}>
                        {getStatusIcon(item.estado === 'en_progreso' && item.prioridad === 'alta' ? 'en_progreso_dark' : item.estado)}
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest",
                          item.prioridad === 'alta' && item.estado !== 'completado' ? "text-zinc-950" : "text-zinc-800 dark:text-zinc-400"
                        )}>
                          {item.estado.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Contenido Principal (Centro) */}
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className={cn(
                        "flex items-center gap-2",
                        item.prioridad === 'alta' && item.estado !== 'completado' ? "text-zinc-900/70" : "text-brand"
                      )}>
                        <Cpu size={14} className="opacity-70" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                          UNIDAD {item.maquina_id} • {item.maquina_nombre}
                        </span>
                      </div>
                      <h3 className={cn(
                        "text-lg md:text-xl font-black uppercase tracking-tighter leading-tight break-words line-clamp-2",
                        item.prioridad === 'alta' && item.estado !== 'completado' ? "text-zinc-950" : "text-black dark:text-white",
                        item.tarea.length > 50 ? "md:text-lg" : "",
                        item.tarea.length > 100 ? "md:text-base" : ""
                      )}>
                        {item.tarea}
                      </h3>
                      {item.descripcion_secundaria && (
                        <p className={cn(
                          "text-sm font-medium break-words line-clamp-2",
                          item.prioridad === 'alta' && item.estado !== 'completado' ? "text-zinc-800/80" : "text-zinc-500 dark:text-zinc-400",
                          item.descripcion_secundaria.length > 100 ? "text-xs" : ""
                        )}>
                          {item.descripcion_secundaria}
                        </p>
                      )}
                    </div>

                    {/* Meta y Acciones (Derecha) */}
                    <div className="flex flex-wrap md:flex-nowrap items-center gap-6 w-full md:w-auto shrink-0">
                      <div className={cn(
                        "inline-flex items-center gap-3 px-6 py-3 rounded-lg border transition-all",
                        item.prioridad === 'alta' && item.estado !== 'completado'
                          ? "bg-black/10 border-black/10 text-zinc-950"
                          : "bg-zinc-50 dark:bg-white/5 border-zinc-100 dark:border-white/10 text-zinc-600 dark:text-zinc-300"
                      )}>
                        <Target size={16} className={item.prioridad === 'alta' ? "text-zinc-950" : "text-brand"} />
                        <span className="text-base font-black tracking-tight">{item.meta_valor ? `${item.meta_valor} MTS` : "S/M"}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => toggleComplete(item)}
                          className={cn(
                            "w-12 h-12 rounded-lg transition-all border-2",
                            item.estado === 'completado'
                              ? "bg-green-500 border-green-500 text-white"
                              : item.prioridad === 'alta'
                                ? "bg-black/10 border-black/10 text-zinc-950 hover:bg-black/20"
                                : "bg-zinc-50 dark:bg-white/[0.03] border-zinc-100 dark:border-white/5 text-zinc-400 hover:text-green-500 hover:border-green-500"
                          )}
                        >
                          <CheckCircle2 size={18} />
                        </Button>

                        <div className={cn(
                          "h-8 w-px",
                          item.prioridad === 'alta' && item.estado !== 'completado' ? "bg-black/10" : "bg-zinc-100 dark:bg-white/10"
                        )} />

                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEdit(item)}
                          className={cn(
                            "w-12 h-12 rounded-lg transition-all border border-transparent hover:border-current",
                            item.prioridad === 'alta' && item.estado !== 'completado' 
                              ? "text-zinc-950 hover:bg-black/10" 
                              : "bg-zinc-50 dark:bg-white/[0.03] text-zinc-400 hover:text-brand hover:bg-brand/10"
                          )}
                        >
                          <Edit2 size={18} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                          className={cn(
                            "w-12 h-12 rounded-lg transition-all border border-transparent hover:border-current",
                            item.prioridad === 'alta' && item.estado !== 'completado'
                              ? "text-zinc-950 hover:bg-black/20"
                              : "bg-zinc-50 dark:bg-white/[0.03] text-zinc-400 hover:text-red-500 hover:bg-red-500/10"
                          )}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
