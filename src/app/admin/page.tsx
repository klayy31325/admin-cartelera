"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Tv,
  Plus,
  Activity,
  Power,
  Monitor,
  LayoutDashboard,
  Edit2,
  ShieldCheck,
  Trash2,
  X,
  Info,
  Clock,
  MapPin,
  Settings2,
  Wifi,
  Save,
  Loader2,
  Building2,
  RefreshCw,
  Terminal
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api-config";

interface TV {
  id: number;
  uid: string;
  empresa: string;
  departamento: string;
  informacion: string;
  ip_address: string;
  estado_conexion: 'online' | 'offline' | 'mantenimiento';
  maquina_id: number | null;
  maquina_nombre: string | null;
  last_sync: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [tvs, setTvs] = useState<TV[]>([]);
  const [machines, setMachines] = useState<{ id: number, name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTv, setSelectedTv] = useState<TV | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTv, setEditingTv] = useState<TV | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    empresa_id: "" as string | number,
    departamento_id: 2, // Producción por defecto
    informacion: "",
    ip_address: "",
    estado_conexion: "offline" as 'online' | 'offline' | 'mantenimiento',
    maquina_id: "" as string | number,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("curex_user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setFormData(prev => ({ ...prev, empresa_id: user.empresa_id }));
    }
    fetchTvs();
    fetchMachines();
  }, []);

  const fetchTvs = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("curex_token");
      const res = await fetch(`${API_BASE_URL}/tv`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setTvs(data.data);
      }
    } catch (error) {
      toast.error("Error al cargar los dispositivos");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMachines = async () => {
    try {
      const token = localStorage.getItem("curex_token");
      const res = await fetch(`${API_BASE_URL}/catalogos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMachines(data.data.machines);
      }
    } catch (error) {
      console.error("Error fetching machines:", error);
    }
  };

  const handleOpenModal = (tv?: TV) => {
    if (tv) {
      setEditingTv(tv);
      setFormData({
        empresa_id: (tv as any).empresa_id,
        departamento_id: (tv as any).departamento_id || 2,
        informacion: tv.informacion,
        ip_address: tv.ip_address,
        estado_conexion: tv.estado_conexion,
        maquina_id: tv.maquina_id || "",
      });
    } else {
      setEditingTv(null);
      setFormData({
        empresa_id: currentUser?.empresa_id || "",
        departamento_id: 2,
        informacion: "",
        ip_address: "",
        estado_conexion: "offline",
        maquina_id: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("curex_token");
    const method = editingTv ? "PUT" : "POST";
    const url = editingTv 
      ? `${API_BASE_URL}/tv/${editingTv.id}` 
      : `${API_BASE_URL}/tv`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...formData,
          maquina_id: formData.maquina_id === "" ? null : Number(formData.maquina_id)
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingTv ? "Dispositivo actualizado" : "Dispositivo registrado");
        setIsModalOpen(false);
        
        if (selectedTv && editingTv && selectedTv.id === editingTv.id) {
            // Resolver el nombre de la máquina para la UI local
            const selectedMachine = machines.find(m => m.id === Number(formData.maquina_id));
            setSelectedTv({
              ...selectedTv, 
              ...formData, 
              maquina_nombre: selectedMachine ? selectedMachine.name : null
            } as any);
        }
        fetchTvs();
      } else {
        toast.error(data.error?.message || "Error al guardar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const forceSync = async (tv: TV) => {
    try {
      const token = localStorage.getItem("curex_token");
      const res = await fetch(`${API_BASE_URL}/tv/${tv.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          estado_conexion: tv.estado_conexion
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTvs();
      }
    } catch (error) {
      console.error("Error forcing sync:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este dispositivo?")) return;
    const token = localStorage.getItem("curex_token");
    try {
      const res = await fetch(`${API_BASE_URL}/tv/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Dispositivo eliminado");
        if (selectedTv?.id === id) setSelectedTv(null);
        fetchTvs();
      }
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const toggleQuickStatus = async (tv: TV) => {
    // Si está online -> lo apagamos (offline)
    // Si está offline o mantenimiento -> lo encendemos (online)
    const newStatus = tv.estado_conexion === 'online' ? 'offline' : 'online';
    const token = localStorage.getItem("curex_token");
    try {
      const res = await fetch(`${API_BASE_URL}/tv/${tv.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ ...tv, estado_conexion: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Dispositivo ${newStatus === 'online' ? 'Encendido' : 'Apagado'}`);
        fetchTvs();
        if (selectedTv?.id === tv.id) setSelectedTv({...selectedTv, estado_conexion: newStatus});
      }
    } catch (error) {
      toast.error("Error al cambiar estado");
    }
  };

  return (
    <div className="relative">
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header Panel Principal */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
              <LayoutDashboard size={12} className="text-brand" />
              PANEL DE CONTROL DE TV
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase">
              SISTEMA DE <span className="text-brand">CARTELERAS</span>
            </h1>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
              Gestión y monitoreo de dispositivos de salida
            </p>
          </div>

          <Button
            onClick={() => handleOpenModal()}
            className="bg-brand hover:bg-brand-dark text-black font-black uppercase tracking-widest px-6 h-12 rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(184,115,51,0.2)] transition-all"
          >
            <Plus size={18} strokeWidth={3} />
            NUEVA TV
          </Button>
        </header>

        {/* Grid de Carteleras */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="bg-card h-[200px] animate-pulse border-border" />
            ))
          ) : tvs.map((tv) => (
            <Card
              key={tv.id}
              onClick={() => setSelectedTv(tv)}
              className={`bg-card p-4 relative overflow-hidden group transition-all duration-300 flex flex-col justify-between min-h-[200px] cursor-pointer hover:scale-[1.02] border-border shadow-soft ${tv.estado_conexion === 'online'
                ? 'border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.05)] hover:border-green-500/60'
                : 'hover:border-brand/40'
                }`}
            >
              {/* Decoración superior */}
              <div className={`absolute top-0 left-0 w-full h-[2px] transition-colors ${
                tv.estado_conexion === 'online' ? 'bg-green-500' : 'bg-muted'
              }`} />

              <div className="flex justify-between items-start">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  tv.estado_conexion === 'online' 
                    ? 'bg-green-500/10 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <Tv size={20} />
                </div>

                <div className="flex gap-1">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenModal(tv);
                    }}
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5"
                  >
                    <Edit2 size={12} />
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleQuickStatus(tv);
                    }}
                    variant="ghost"
                    size="icon"
                    className={`w-7 h-7 rounded-lg transition-colors ${tv.estado_conexion === 'online' ? 'text-green-500 hover:bg-green-500/10' : 'text-zinc-600 hover:bg-zinc-800'}`}
                  >
                    <Power size={12} />
                  </Button>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="text-xl font-black text-foreground tracking-tight leading-none mb-1 shadow-sm uppercase">{tv.departamento}</h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.15em]">
                    {tv.empresa} {tv.maquina_nombre && `// ${tv.maquina_nombre}`}
                  </p>
                  {tv.last_sync && (
                    <p className="text-[8px] text-brand font-bold uppercase tracking-widest mt-1">
                      Sinc: {new Date(tv.last_sync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      tv.estado_conexion === 'online' ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground'
                    }`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                      tv.estado_conexion === 'online' ? 'text-green-500' : 'text-muted-foreground'
                    }`}>
                      {tv.estado_conexion === 'online' ? 'EN LINEA' : 
                       tv.estado_conexion === 'mantenimiento' ? 'MANTENIMIENTO' : 'DESCONECTADO'}
                    </span>
                  </div>
                  <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">IP: {tv.ip_address}</span>
                </div>
              </div>
            </Card>
          ))}

          {/* Empty State */}
          {!isLoading && tvs.length === 0 && (
            <div className="col-span-full py-24 flex flex-col items-center justify-center text-zinc-700 border-2 border-dashed border-zinc-900 rounded-[2.5rem]">
              <Monitor size={64} strokeWidth={1} className="mb-6 opacity-20" />
              <p className="font-black uppercase tracking-[0.3em] text-[10px]">No hay dispositivos vinculados</p>
            </div>
          )}
        </div>

        {/* Footer del Dashboard */}
        <footer className="pt-12 border-t border-border flex justify-between items-center text-[9px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Online: {tvs.filter(t => t.estado_conexion === 'online').length}
            </span>
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-muted" />
              Total: {tvs.length}
            </span>
          </div>
        </footer>
      </div>

      {/* Modal / Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)} />
          <Card className="relative w-full max-w-[410px] bg-zinc-950 border-white/10 p-6 shadow-2xl animate-in zoom-in duration-300 z-[301]">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="mb-4">
              <h2 className="text-xl font-black text-white tracking-tighter uppercase">
                {editingTv ? "Editar" : "Registrar"} <span className="text-brand">Dispositivo</span>
              </h2>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Portal de Configuración de Terminal</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 p-2.5 bg-white/5 border border-white/10 rounded-lg">
                  <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-0.5">Empresa Vinculada</label>
                  <p className="text-[10px] font-black text-brand uppercase">{currentUser?.empresa_nombre || "Empresa Actual"}</p>
                </div>
                <div className="space-y-1 p-2.5 bg-white/5 border border-white/10 rounded-lg">
                  <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-0.5">Depto. Operativo</label>
                  <p className="text-[10px] font-black text-white uppercase">Producción</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Dirección IP</label>
                <div className="relative">
                  <Wifi className="absolute left-3 top-2.5 text-zinc-600" size={16} />
                  <Input 
                    required
                    className="bg-white/5 border-white/10 pl-10 h-10 text-white font-mono text-xs"
                    placeholder="192.168.1.100"
                    value={formData.ip_address}
                    onChange={(e) => setFormData({...formData, ip_address: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Estado</label>
                <select 
                  className="w-full bg-zinc-900 border border-white/10 h-10 rounded-lg px-4 text-xs text-white focus:outline-none focus:border-brand/50 appearance-none cursor-pointer"
                  style={{ backgroundColor: '#18181b' }}
                  value={formData.estado_conexion}
                  onChange={(e) => setFormData({...formData, estado_conexion: e.target.value as any})}
                >
                  <option value="online" style={{ background: '#18181b', color: 'white' }}>Online (Activo)</option>
                  <option value="offline" style={{ background: '#18181b', color: 'white' }}>Offline (Desconectado)</option>
                  <option value="error" style={{ background: '#18181b', color: 'white' }}>Error / Mantenimiento</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Máquina Asignada (Opcional)</label>
                <select 
                  className="w-full bg-zinc-900 border border-white/10 h-10 rounded-lg px-4 text-xs text-white focus:outline-none focus:border-brand/50 appearance-none cursor-pointer"
                  style={{ backgroundColor: '#18181b' }} // Forzar fondo oscuro en select
                  value={formData.maquina_id}
                  onChange={(e) => setFormData({...formData, maquina_id: e.target.value})}
                >
                  <option value="" style={{ background: '#18181b', color: 'white' }}>Todas las máquinas (General)</option>
                  {machines.map(m => (
                    <option key={m.id} value={m.id} style={{ background: '#18181b', color: 'white' }}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Información / Notas</label>
                <textarea 
                  className="w-full bg-white/5 border border-white/10 min-h-[64px] rounded-lg p-3 text-xs text-white focus:outline-none focus:border-brand/50"
                  placeholder="Detalles adicionales sobre este terminal..."
                  value={formData.informacion}
                  onChange={(e) => setFormData({...formData, informacion: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-2">
                {editingTv && (
                  <Button 
                    type="button"
                    onClick={() => handleDelete(editingTv.id)}
                    variant="outline"
                    className="border-red-500/20 text-red-500 hover:bg-red-500/10 h-11 rounded-xl flex-1 font-black uppercase tracking-widest text-xs"
                  >
                    <Trash2 size={16} className="mr-1.5" />
                    Eliminar
                  </Button>
                )}
                <Button 
                  type="submit"
                  className="bg-brand hover:bg-brand-dark text-black font-black uppercase tracking-widest h-11 rounded-xl shadow-[0_0_20px_rgba(184,115,51,0.2)] flex-[2] transition-all text-xs"
                >
                  <Save size={16} className="mr-1.5" />
                  {editingTv ? "Guardar" : "Vincular"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Drawer de Detalles (Side Panel) */}
      {selectedTv && (
        <div className="fixed inset-0 z-[200]">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setSelectedTv(null)}
          />
          
          {/* Panel */}
          <div className="fixed top-0 right-0 w-full max-w-md bg-card backdrop-blur-xl border-l border-border shadow-2xl h-screen animate-in slide-in-from-right duration-500 flex flex-col z-[201]">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedTv.estado_conexion === 'online' ? 'bg-green-500/10 text-green-500' : 'bg-zinc-900 text-zinc-600'}`}>
                  <Monitor size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground uppercase tracking-tighter">{selectedTv.departamento}</h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{selectedTv.empresa}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSelectedTv(null)}
                className="text-zinc-500 hover:text-white hover:bg-white/5 rounded-full"
              >
                <X size={20} />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Status Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand">
                  <Activity size={12} />
                  Estado del Sistema
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-1">
                    <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">Conexión</p>
                    <p className={`text-sm font-black uppercase ${selectedTv.estado_conexion === 'online' ? 'text-green-500' : 'text-muted-foreground'}`}>
                      {selectedTv.estado_conexion === 'online' ? 'En Línea' : selectedTv.estado_conexion === 'mantenimiento' ? 'Mantenimiento' : 'Desconectado'}
                    </p>
                  </div>
                  <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-1">
                    <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">Dirección IP</p>
                    <p className="text-sm font-black text-foreground uppercase font-mono">{selectedTv.ip_address}</p>
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand">
                  <Info size={12} />
                  Parámetros de Dispositivo
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Terminal size={16} className="text-muted-foreground" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Unit Focus</span>
                    </div>
                    <span className="text-xs font-black text-brand uppercase">{selectedTv.maquina_nombre || 'General (Todas)'}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Building2 size={16} className="text-muted-foreground" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Empresa</span>
                    </div>
                    <span className="text-xs font-black text-foreground uppercase">{selectedTv.empresa}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded-2xl">
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-muted-foreground" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Departamento</span>
                    </div>
                    <span className="text-xs font-black text-foreground uppercase">{selectedTv.departamento}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Clock size={16} className="text-muted-foreground" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Último Acceso</span>
                    </div>
                    <span className="text-xs font-black text-foreground uppercase">
                      {selectedTv.last_sync ? new Date(selectedTv.last_sync).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              {selectedTv.informacion && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand">
                    <Settings2 size={12} />
                    Notas Adicionales
                  </div>
                  <div className="p-4 bg-muted/10 border border-border rounded-2xl">
                    <p className="text-xs text-zinc-400 leading-relaxed italic">
                      "{selectedTv.informacion}"
                    </p>
                  </div>
                </div>
              )}

              {/* Data Preview */}
              <div className="mt-auto p-6 bg-brand/5 border border-brand/20 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] text-brand font-black uppercase tracking-widest">Vista Previa de Salida</p>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", selectedTv.estado_conexion === 'online' ? "bg-green-500" : "bg-red-500")} />
                    <span className="text-[8px] font-bold text-muted-foreground uppercase">{selectedTv.estado_conexion}</span>
                  </div>
                </div>
                <div className="relative aspect-video w-full border border-brand/30 rounded-xl bg-black/40 overflow-hidden group">
                  <iframe 
                    src={`http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:5173/?preview_uid=${selectedTv.uid}`}
                    className="w-[1280px] h-[720px] border-none origin-top-left"
                    style={{ 
                      transform: 'scale(0.245)', // Ajustado para un panel de aprox 315px
                      pointerEvents: 'none' 
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 gap-2">
                    <p className="text-[8px] text-zinc-400 font-black uppercase tracking-[0.2em]">
                      {selectedTv.maquina_nombre 
                        ? `En vivo: ${selectedTv.maquina_nombre}`
                        : "En vivo: Planta General"}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-7 w-full text-[8px] font-black uppercase tracking-widest bg-brand/10 text-brand hover:bg-brand hover:text-black transition-all border border-brand/20"
                      onClick={() => {
                        toast.info("Comando de sincronización enviado");
                        forceSync(selectedTv); 
                      }}
                    >
                      <RefreshCw size={10} className="mr-1.5" />
                      Sincronizar Nodo Real
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border bg-card/50 backdrop-blur-md flex gap-3">
              <Button 
                onClick={() => handleOpenModal(selectedTv)}
                className="flex-1 bg-brand hover:bg-brand-dark text-black font-black uppercase tracking-widest h-12 rounded-xl flex items-center justify-center gap-2"
              >
                <Edit2 size={16} />
                Editar Datos
              </Button>
              <Button 
                onClick={() => setSelectedTv(null)}
                variant="outline"
                className="flex-1 border-border text-foreground hover:bg-muted font-black uppercase tracking-widest h-12 rounded-xl"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
