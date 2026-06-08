"use client";

import { useState, useEffect } from "react";
import {
  Plus, X, Edit2, Trash2, CheckCircle2, Clock,
  AlertTriangle, ArrowUpCircle, Calendar, Target,
  Cpu, LayoutList, LayoutGrid, Loader2, ChevronLeft, ChevronRight
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
  estado: 'pendiente' | 'en_progreso' | 'completado';
  fecha_asignada: string;
  orden: number;
}

interface Maquina {
  id: number;
  nombre: string;
}

interface ProduccionInfoFormData {
  maquina_id: string;
  tarea: string;
  meta_valor: string;
  descripcion_secundaria: string;
  estado: 'pendiente' | 'en_progreso' | 'completado';
  fecha_asignada: string;
  orden: string;
}

export function ProduccionInformativaManager() {
  const [items, setItems] = useState<ProduccionInfo[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [ordenError, setOrdenError] = useState<string | null>(null);
  const [editingInlineId, setEditingInlineId] = useState<number | null>(null);
  const [editingInlineValue, setEditingInlineValue] = useState<string>('');

  // Estados para paginación y filtros de historial
  const [activeTab, setActiveTab] = useState<'activas' | 'historial'>('activas');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // Resetear página y selección al cambiar de vista o filtros
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
    setSelectionMode(false);
  }, [activeTab, fechaDesde, fechaHasta]);

  // Estados para el Modal de Confirmación
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id?: number; type: 'single' | 'bulk' | null }>({ type: null });

  const [formData, setFormData] = useState<ProduccionInfoFormData>({
    maquina_id: '',
    tarea: '',
    meta_valor: '',
    descripcion_secundaria: '',
    estado: 'pendiente' as const,
    fecha_asignada: new Date().toISOString().split('T')[0],
    orden: ''
  });

  // Filtrado y Paginación derivados
  const filteredItems = items.filter(item => {
    const isCompleted = item.estado === 'completado';
    if (activeTab === 'activas') {
      return !isCompleted;
    } else {
      if (!isCompleted) return false;
      const itemDate = item.fecha_asignada.split('T')[0];
      if (fechaDesde && itemDate < fechaDesde) return false;
      if (fechaHasta && itemDate > fechaHasta) return false;
      return true;
    }
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  const fetchNextOrden = async () => {
    try {
      const token = localStorage.getItem("curex_token");
      const response = await fetch(`${API_BASE_URL}/produccion-informativa/next-orden`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFormData((prev) => ({ ...prev, orden: String(data.data.nextOrden) }));
        }
      }
    } catch {
      const maxOrden = items.reduce((max, i) => Math.max(max, i.orden || 0), 0);
      setFormData((prev) => ({ ...prev, orden: String(maxOrden + 1) }));
    }
  };

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem("curex_token");
      const response = await fetch(`${API_BASE_URL}/produccion-informativa`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setItems(data.data);
          setSelectedIds((prev) => prev.filter((id) => data.data.some((item: ProduccionInfo) => item.id === id)));
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
    setOrdenError(null);

    if (!formData.maquina_id || !formData.tarea) {
      toast.error("Complete los campos obligatorios");
      return;
    }

    const ordenNum = Number(formData.orden);
    if (!ordenNum || ordenNum < 1) {
      setOrdenError("El orden debe ser un número positivo (mínimo 1)");
      toast.error("El orden debe ser un número positivo");
      return;
    }

    try {
      const url = editingId
        ? `${API_BASE_URL}/produccion-informativa/${editingId}`
        : `${API_BASE_URL}/produccion-informativa`;

      const payload = {
        ...formData,
        meta_valor: formData.meta_valor ? Number(formData.meta_valor) : null,
        orden: ordenNum
      };

      const token = localStorage.getItem("curex_token");
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(editingId ? "Tarea actualizada" : "Tarea creada");
        setFormData({
          maquina_id: '',
          tarea: '',
          meta_valor: '',
          descripcion_secundaria: '',
      estado: 'pendiente',
          fecha_asignada: new Date().toISOString().split('T')[0],
          orden: ''
        });
        setOrdenError(null);
        setIsAdding(false);
        setEditingId(null);
        fetchItems();
        return;
      }

      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error || "Error al guardar";
      if (msg.includes('orden')) {
        setOrdenError(msg);
      }
      toast.error(msg);
    } catch (error) {
      toast.error("Error al conectar con el servidor");
    }
  };

  const handleEdit = (item: ProduccionInfo) => {
    setFormData({
      maquina_id: item.maquina_id.toString(),
      tarea: item.tarea,
      meta_valor: item.meta_valor !== null ? item.meta_valor.toString() : '',
      descripcion_secundaria: item.descripcion_secundaria || '',
      estado: item.estado,
      fecha_asignada: item.fecha_asignada.split('T')[0],
      orden: item.orden !== undefined ? item.orden.toString() : ''
    });
    setOrdenError(null);
    setEditingId(item.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleComplete = async (item: ProduccionInfo) => {
    const nuevoEstado = item.estado === 'completado' ? 'pendiente' : 'completado';
    try {
      const token = localStorage.getItem("curex_token");
      const response = await fetch(`${API_BASE_URL}/produccion-informativa/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (response.ok) {
        toast.success(nuevoEstado === 'completado' ? "Tarea completada" : "Tarea pendiente");
        fetchItems();
      }
    } catch (error) {
      toast.error("Error al actualizar");
    }
  };

  // Edición inline de orden desde la card
  const handleInlineOrdenStart = (item: ProduccionInfo) => {
    setEditingInlineId(item.id);
    setEditingInlineValue(String(item.orden ?? ''));
  };

  const handleInlineOrdenSave = async () => {
    if (editingInlineId === null) return;
    const newOrden = Number(editingInlineValue);
    if (!newOrden || newOrden < 1) {
      toast.error("El orden debe ser un número positivo");
      return;
    }
    try {
      const token = localStorage.getItem("curex_token");
      const response = await fetch(`${API_BASE_URL}/produccion-informativa/${editingInlineId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orden: newOrden })
      });
      if (response.ok) {
        toast.success("Orden actualizado");
        setEditingInlineId(null);
        fetchItems();
      } else {
        const errData = await response.json().catch(() => ({}));
        toast.error(errData?.error || "Error al actualizar orden");
      }
    } catch {
      toast.error("Error al conectar con el servidor");
    }
  };

  const handleInlineOrdenCancel = () => {
    setEditingInlineId(null);
    setEditingInlineValue('');
  };

  // Abre el modal para eliminación individual
  const triggerDelete = (id: number) => {
    setDeleteTarget({ id, type: 'single' });
    setIsConfirmOpen(true);
  };

  // Abre el modal para eliminación masiva
  const triggerBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setDeleteTarget({ type: 'bulk' });
    setIsConfirmOpen(true);
  };

  // Ejecución definitiva del borrado individual
  const executeSingleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem("curex_token");
      const response = await fetch(`${API_BASE_URL}/produccion-informativa/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success("Tarea eliminada");
        setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
        fetchItems();
      }
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  // Ejecución definitiva del borrado masivo
  const executeBulkDelete = async () => {
    try {
      const results = await Promise.allSettled(
        selectedIds.map((id) => {
          const token = localStorage.getItem("curex_token");
          return fetch(`${API_BASE_URL}/produccion-informativa/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
        })
      );

      const deletedCount = results.filter(
        (result) => result.status === 'fulfilled' && result.value.ok
      ).length;

      if (deletedCount > 0) {
        toast.success(`${deletedCount} tarea(s) eliminada(s)`);
      }
      if (deletedCount < selectedIds.length) {
        toast.error("Algunas tareas no se pudieron eliminar");
      }

      setSelectedIds([]);
      setSelectionMode(false);
      fetchItems();
    } catch (error) {
      toast.error("Error al eliminar selección");
    }
  };

  // Manejador del botón de confirmación dentro del modal
  const handleConfirmAction = async () => {
    setIsConfirmOpen(false);
    if (deleteTarget.type === 'single' && deleteTarget.id !== undefined) {
      await executeSingleDelete(deleteTarget.id);
    } else if (deleteTarget.type === 'bulk') {
      await executeBulkDelete();
    }
    setDeleteTarget({ type: null });
  };

  const toggleItemSelection = (id: number) => {
    setSelectedIds((prev) => (
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id]
    ));
  };

  const handleSelectionButton = () => {
    if (!selectionMode) {
      setSelectionMode(true);
      return;
    }

    if (selectedIds.length > 0) {
      triggerBulkDelete();
      return;
    }

    setSelectionMode(false);
    setSelectedIds([]);
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
            <LayoutList size={32} className="text-white" />
          </div>
        </div>
        {/* Selection Button */}
        <div className="flex flex-wrap items-center gap-3">

          <Button
            onClick={() => {
              const opening = !isAdding;
              setIsAdding(opening);
              setOrdenError(null);
              if (opening) {
                setEditingId(null);
                fetchNextOrden();
              }
            }}
            className={cn(
              "h-10 px-8 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl",
              isAdding ? "bg-zinc-100 text-zinc-500 dark:bg-white/5" : "bg-brand text-white hover:scale-105 shadow-brand/20"
            )}
          >
            {isAdding ? <X className="mr-2" size={5} /> : <Plus className="mr-2" size={5} />}
            {isAdding ? "Cerrar Panel" : "GENERAR TAREA"}
          </Button>

          {items.length > 0 && (
            <Button
              type="button"
              onClick={handleSelectionButton}
              className={cn(
                "h-10 px-8 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl",
                isAdding ? "bg-zinc-100 text-zinc-500 dark:bg-white/5" : "bg-brand text-white hover:scale-105 shadow-brand/20"
              )}
            >
              {selectionMode ? (
                selectedIds.length > 0 ? (
                  <>
                    <Trash2 size={16} className="mr-2" />
                    ELIMINAR  ({selectedIds.length})
                  </>
                ) : (
                  <>
                    <X size={14} className="mr-2" />
                    Cancelar selección
                  </>
                )
              ) : (
                <>
                  <Trash2 size={16} className="mr-2" />
                  Eliminar TAREA
                </>
              )}
            </Button>
          )}
        </div>
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
                  <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] ml-2">Orden (posición) *</label>
                  <Input
                    type="number"
                    min="1"
                    required
                    placeholder="Ej: 1"
                    value={formData.orden}
                    onChange={(e) => {
                      setFormData({ ...formData, orden: e.target.value });
                      setOrdenError(null);
                    }}
                    className={cn(
                      "h-12 rounded-xl px-6 font-bold border-2",
                      ordenError
                        ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
                        : "bg-zinc-50 dark:bg-black/40 border-zinc-100 dark:border-white/[0.05]"
                    )}
                  />
                  {ordenError && (
                    <p className="text-[10px] font-bold text-red-500 ml-2">{ordenError}</p>
                  )}
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
              <Button type="submit" className="bg-brand text-white font-black px-20 h-20 rounded-xl uppercase tracking-[0.3em] text-lg hover:scale-105 transition-all shadow-2xl shadow-brand/30">
                {editingId ? "Actualizar Tarea" : "Asignar a Unidad"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Listado de Tareas */}

      <div className="space-y-8">
        {/* Tabs y Filtros de Fecha */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-100 dark:border-white/10 pb-6">
          <div className="flex bg-zinc-100 dark:bg-white/5 p-1 rounded-xl gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('activas')}
              className={cn(
                "px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                activeTab === 'activas'
                  ? "bg-brand text-white shadow-lg shadow-brand/20"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
              )}
            >
              Tareas Activas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('historial')}
              className={cn(
                "px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                activeTab === 'historial'
                  ? "bg-brand text-white shadow-lg shadow-brand/20"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
              )}
            >
              Historial Completado
            </button>
          </div>

          {activeTab === 'historial' && (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Desde</span>
                <Input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="bg-white dark:bg-black/40 border-zinc-200 dark:border-white/[0.05] h-10 rounded-xl font-bold text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Hasta</span>
                <Input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="bg-white dark:bg-black/40 border-zinc-200 dark:border-white/[0.05] h-10 rounded-xl font-bold text-xs"
                />
              </div>
              {(fechaDesde || fechaHasta) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFechaDesde("");
                    setFechaHasta("");
                  }}
                  className="h-10 px-4 rounded-xl font-bold text-xs hover:text-brand"
                >
                  Limpiar
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Listado de Tareas */}
        <div className="space-y-6 relative">
          <AnimatePresence mode="popLayout">
            {paginatedItems.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="py-32 text-center space-y-6 bg-zinc-50/50 dark:bg-zinc-900/10 border-4 border-dashed border-zinc-100 dark:border-white/[0.02] rounded-2xl"
              >
                <p className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em]">
                  {activeTab === 'activas'
                    ? "No hay tareas activas asignadas"
                    : "No se encontraron tareas completadas para el período seleccionado"}
                </p>
              </motion.div>
            ) : (
              paginatedItems.map((item, index) => (
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
                      : "bg-white dark:bg-zinc-900/40 border-zinc-100 dark:border-white/[0.03] hover:shadow-2xl hover:border-brand/20"
                  )}>
                    {selectionMode && (
                      <label className="absolute top-4 right-4 z-10 inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleItemSelection(item.id)}
                          className="h-5 w-5 rounded border-zinc-100 text-white focus:ring-brand"
                        />
                      </label>
                    )}
                    {/* Orden y Estado (Lado Izquierdo) */}
                    <div className="flex flex-row md:flex-col gap-3 min-w-[180px] shrink-0">
                      {editingInlineId === item.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="1"
                            autoFocus
                            value={editingInlineValue}
                            onChange={(e) => setEditingInlineValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { e.preventDefault(); handleInlineOrdenSave(); }
                              if (e.key === 'Escape') handleInlineOrdenCancel();
                            }}
                            className="w-16 h-10 text-center text-lg font-black rounded-xl px-2"
                          />
                        </div>
                      ) : (
                        <div
                          onClick={() => handleInlineOrdenStart(item)}
                          className="w-12 h-12 bg-brand/10 dark:bg-brand/20 border-2 border-brand/20 rounded-xl flex items-center justify-center cursor-pointer hover:bg-brand/20 hover:border-brand/40 transition-all group relative"
                          title="Click para editar orden"
                        >
                          <span className="text-lg font-black text-brand">{item.orden ?? '-'}</span>
                        </div>
                      )}
                      <div className={cn(
                        "flex items-center justify-center gap-2 px-4 py-2 rounded-lg",
                        "bg-zinc-100 dark:bg-white/5"
                      )}>
                        {getStatusIcon(item.estado)}
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-800 dark:text-zinc-400">
                          {item.estado.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Contenido Principal (Centro) */}
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-2 text-brand">
                        <Cpu size={14} className="opacity-70" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                          UNIDAD {item.maquina_id} • {item.maquina_nombre}
                        </span>
                      </div>
                      <h3 className={cn(
                        "text-lg md:text-xl font-black uppercase tracking-tighter leading-tight break-words line-clamp-2 text-black dark:text-white",
                        item.tarea.length > 50 ? "md:text-lg" : "",
                        item.tarea.length > 100 ? "md:text-base" : ""
                      )}>
                        {item.tarea}
                      </h3>
                      {item.descripcion_secundaria && (
                        <p className={cn(
                          "text-sm font-medium break-words line-clamp-2 text-zinc-500 dark:text-zinc-400",
                          item.descripcion_secundaria.length > 100 ? "text-xs" : ""
                        )}>
                          {item.descripcion_secundaria}
                        </p>
                      )}
                    </div>

                    {/* Meta y Acciones (Derecha) */}
                    <div className="flex flex-wrap md:flex-nowrap items-center gap-6 w-full md:w-auto shrink-0">
                      <div className="inline-flex items-center gap-3 px-6 py-3 rounded-lg border transition-all bg-zinc-50 dark:bg-white/5 border-zinc-100 dark:border-white/10 text-zinc-600 dark:text-zinc-300">
                        <Target size={16} className="text-brand" />
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
                              : "bg-zinc-50 dark:bg-white/[0.03] border-zinc-100 dark:border-white/5 text-zinc-400 hover:text-green-500 hover:border-green-500"
                          )}
                        >
                          <CheckCircle2 size={18} />
                        </Button>

                        <div className="h-8 w-px bg-zinc-100 dark:bg-white/10" />

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                          className="w-12 h-12 rounded-lg transition-all border border-transparent hover:border-current bg-zinc-50 dark:bg-white/[0.03] text-zinc-400 hover:text-brand hover:bg-brand/10"
                        >
                          <Edit2 size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => triggerDelete(item.id)}
                          className="w-12 h-12 rounded-lg transition-all border border-transparent hover:border-current bg-zinc-50 dark:bg-white/[0.03] text-zinc-400 hover:text-red-500 hover:bg-red-500/10"
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

        {/* Controles de Paginación */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-zinc-100 dark:border-white/10">
            <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredItems.length)} de {filteredItems.length} tareas
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-10 w-10 p-0 rounded-xl border-2 disabled:opacity-50 flex items-center justify-center"
              >
                <ChevronLeft size={16} />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "h-10 w-10 p-0 rounded-xl font-bold text-xs transition-all",
                      page === currentPage
                        ? "bg-brand text-white shadow-md shadow-brand/20"
                        : "border-2 border-transparent text-zinc-500 hover:border-zinc-200 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white"
                    )}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-10 w-10 p-0 rounded-xl border-2 disabled:opacity-50 flex items-center justify-center"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>


      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <AnimatePresence>
        {isConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Capa de Fondo Desenfocada */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfirmOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Contenedor del Diálogo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-950 border-2 border-zinc-100 dark:border-white/10 p-8 rounded-2xl shadow-2xl z-10 space-y-6 text-center"
            >
              <div className="mx-auto w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center border border-red-500/20 shadow-inner">
                <AlertTriangle size={28} className="animate-bounce" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                  ¿Confirmar Eliminación?
                </h3>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {deleteTarget.type === 'bulk'
                    ? `Se eliminarán permanentemente las ${selectedIds.length} tareas seleccionadas. Esta operación no se puede deshacer.`
                    : "Esta acción removerá la tarea seleccionada de la planificación de forma definitiva."
                  }
                </p>
              </div>

              <div className="flex gap-4 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsConfirmOpen(false)}
                  className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 transition-all"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmAction}
                  className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-500 hover:bg-red-600 text-white transition-all shadow-xl shadow-red-500/20 hover:scale-[1.02]"
                >
                  Eliminar Registro
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}