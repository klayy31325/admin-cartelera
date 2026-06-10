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
import { useAuth } from "@/components/auth-provider";

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
  const { user } = useAuth();
  const isAdmin = user?.rol === "admin";
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
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border border-zinc-200/5 dark:border-white/[0.04] bg-zinc-100/50 dark:bg-zinc-900/30 p-5 rounded-lg relative overflow-hidden">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.35em] text-brand">
              <LayoutDashboard size={12} />
              DISPOSITIVOS // TV PANEL
            </div>
            <h1 className="text-base font-black tracking-widest text-foreground uppercase mt-1">
              GESTIÓN DE CARTELERAS
            </h1>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider leading-relaxed">
              Monitoreo, vinculación y control de terminales de visualización industrial en tiempo real.
            </p>
          </div>

          {isAdmin && (
            <Button
              onClick={() => handleOpenModal()}
              className="bg-brand hover:bg-brand-dark text-white font-black uppercase tracking-widest px-6 h-11 rounded-lg flex items-center gap-2 shadow-[0_0_20px_rgba(184,115,51,0.15)] transition-all text-xs"
            >
              <Plus size={16} strokeWidth={3} />
              NUEVA TV
            </Button>
          )}
        </header>

        {/* Grid de Carteleras — TV Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-card border border-border rounded-[1.8rem] h-[140px]" />
                <div className="mx-auto w-16 h-2 bg-card border border-border rounded-b-lg -mt-px" />
              </div>
            ))
          ) : tvs.map((tv, idx) => (
            <div
              key={tv.id}
              className="group"
              style={{ animation: `tvCardIn 0.5s ease-out ${idx * 80}ms both` }}
            >
              {/* TV Screen */}
              <Card
                onClick={() => setSelectedTv(tv)}
                className={`relative overflow-hidden cursor-pointer transition-all duration-300 rounded-[1.8rem] border-[3px] hover:-translate-y-1 hover:shadow-2xl ${
                  tv.estado_conexion === 'online'
                    ? 'border-zinc-300 dark:border-zinc-700 shadow-[0_4px_30px_rgba(34,197,94,0.08)] hover:shadow-[0_8px_40px_rgba(34,197,94,0.15)]'
                    : 'border-zinc-300 dark:border-zinc-800 shadow-lg hover:shadow-xl hover:border-zinc-400 dark:hover:border-zinc-600'
                }`}
              >
                {/* Screen Content */}
                <div className={`relative p-5 flex items-stretch gap-5 min-h-[130px] ${
                  tv.estado_conexion === 'online'
                    ? 'bg-gradient-to-br from-zinc-50 via-white to-green-50/30 dark:from-zinc-900 dark:via-zinc-900/95 dark:to-green-950/20'
                    : 'bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-900 dark:via-zinc-900/95 dark:to-zinc-950'
                }`}>
                  {/* Screen Glare — hover shine */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-white/10 dark:via-white/[0.02] dark:to-white/[0.04]" />

                  {/* Left: TV Icon & LED */}
                  <div className="flex flex-col items-center justify-between py-1 shrink-0">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                      tv.estado_conexion === 'online'
                        ? 'bg-green-500/10 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.15)] group-hover:shadow-[0_0_25px_rgba(34,197,94,0.25)]'
                        : 'bg-muted/60 text-muted-foreground'
                    }`}>
                      <Tv size={22} className="transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    {/* LED indicator */}
                    <div className={`w-2 h-2 rounded-full mt-2 transition-all duration-500 ${
                      tv.estado_conexion === 'online'
                        ? 'bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse'
                        : 'bg-zinc-400 dark:bg-zinc-600'
                    }`} />
                  </div>

                  {/* Center: Info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                    <div>
                      <h3 className="text-sm font-mono font-black text-foreground tracking-widest leading-none uppercase truncate">{tv.uid}</h3>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1.5 truncate">
                        {tv.departamento} // {tv.empresa} {tv.maquina_nombre && `// ${tv.maquina_nombre}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${
                        tv.estado_conexion === 'online' ? 'text-green-500' : 'text-muted-foreground'
                      }`}>
                        {tv.estado_conexion === 'online' ? '● EN LÍNEA' :
                         tv.estado_conexion === 'mantenimiento' ? '◉ MANTENIMIENTO' : '○ DESCONECTADO'}
                      </span>
                      <span className="text-[8px] text-muted-foreground font-mono tracking-wide">IP {tv.ip_address}</span>
                      {tv.last_sync && (
                        <span className="text-[8px] text-brand font-bold uppercase tracking-widest">
                          Sinc {new Date(tv.last_sync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col items-center justify-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {isAdmin && (
                      <>
                        <Button
                          onClick={(e) => { e.stopPropagation(); handleOpenModal(tv); }}
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-xl text-muted-foreground hover:text-brand hover:bg-brand/10 transition-all"
                        >
                          <Edit2 size={13} />
                        </Button>
                        <Button
                          onClick={(e) => { e.stopPropagation(); toggleQuickStatus(tv); }}
                          variant="ghost"
                          size="icon"
                          className={`w-8 h-8 rounded-xl transition-all ${
                            tv.estado_conexion === 'online'
                              ? 'text-green-500 hover:bg-green-500/10'
                              : 'text-muted-foreground hover:bg-muted/60'
                          }`}
                        >
                          <Power size={13} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>

              {/* TV Stand */}
              <div className="flex justify-center">
                <div className="w-20 h-[6px] bg-zinc-300 dark:bg-zinc-700 rounded-b-lg border-x-[3px] border-b-[3px] border-zinc-300 dark:border-zinc-700 -mt-[1px]" />
              </div>
            </div>
          ))}

          {/* Empty State */}
          {!isLoading && tvs.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-3xl">
              <div className="relative mb-6">
                <Monitor size={56} strokeWidth={1} className="opacity-20" />
                <div className="absolute inset-0 animate-ping opacity-10"><Monitor size={56} strokeWidth={1} /></div>
              </div>
              <p className="font-black uppercase tracking-[0.3em] text-[10px]">No hay dispositivos vinculados</p>
              <p className="text-[9px] text-muted-foreground mt-1 tracking-wider">Agregá tu primera TV para comenzar</p>
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
          <div className="absolute inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)} />
          <Card className="relative w-full max-w-[410px] bg-background dark:bg-zinc-950 border-zinc-200 dark:border-white/10 p-6 shadow-2xl animate-in zoom-in duration-300 z-[301] text-foreground">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X size={18} />
            </button>

            <div className="mb-4">
              <h2 className="text-xl font-black text-foreground dark:text-white tracking-tighter uppercase">
                {editingTv ? "Editar" : "Registrar"} <span className="text-brand">Dispositivo</span>
              </h2>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Portal de Configuración de Terminal</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 p-2.5 bg-muted/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg">
                  <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block mb-0.5">Empresa Vinculada</label>
                  <p className="text-[10px] font-black text-brand uppercase">{currentUser?.empresa_nombre || "Empresa Actual"}</p>
                </div>
                <div className="space-y-1 p-2.5 bg-muted/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg">
                  <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block mb-0.5">Depto. Operativo</label>
                  <p className="text-[10px] font-black text-foreground dark:text-white uppercase">Producción</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Dirección IP</label>
                <div className="relative">
                  <Wifi className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                  <Input 
                    required
                    className="bg-muted/50 dark:bg-white/5 border-zinc-200 dark:border-white/10 pl-10 h-10 text-foreground dark:text-white font-mono text-xs focus:ring-brand focus:border-brand"
                    placeholder="192.168.1.100"
                    value={formData.ip_address}
                    onChange={(e) => setFormData({...formData, ip_address: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Estado</label>
                <select 
                  className="w-full bg-background dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 h-10 rounded-lg px-4 text-xs text-foreground dark:text-white focus:outline-none focus:border-brand/50 appearance-none cursor-pointer"
                  value={formData.estado_conexion}
                  onChange={(e) => setFormData({...formData, estado_conexion: e.target.value as any})}
                >
                  <option value="online" className="bg-background dark:bg-zinc-900 text-foreground dark:text-white">Online (Activo)</option>
                  <option value="offline" className="bg-background dark:bg-zinc-900 text-foreground dark:text-white">Offline (Desconectado)</option>
                  <option value="error" className="bg-background dark:bg-zinc-900 text-foreground dark:text-white">Error / Mantenimiento</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Máquina Asignada (Opcional)</label>
                <select 
                  className="w-full bg-background dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 h-10 rounded-lg px-4 text-xs text-foreground dark:text-white focus:outline-none focus:border-brand/50 appearance-none cursor-pointer"
                  value={formData.maquina_id}
                  onChange={(e) => setFormData({...formData, maquina_id: e.target.value})}
                >
                  <option value="" className="bg-background dark:bg-zinc-900 text-foreground dark:text-white">Todas las máquinas (General)</option>
                  {machines.map(m => (
                    <option key={m.id} value={m.id} className="bg-background dark:bg-zinc-900 text-foreground dark:text-white">{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Información / Notas</label>
                <textarea 
                  className="w-full bg-muted/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 min-h-[64px] rounded-lg p-3 text-xs text-foreground dark:text-white focus:outline-none focus:border-brand/50"
                  placeholder="Detalles adicionales sobre este terminal..."
                  value={formData.informacion}
                  onChange={(e) => setFormData({...formData, informacion: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-2">
                {editingTv && isAdmin && (
                  <Button 
                    type="button"
                    onClick={() => handleDelete(editingTv.id)}
                    variant="outline"
                    className="border-red-500/20 text-red-500 hover:bg-red-500/10 h-11 rounded-lg flex-1 font-black uppercase tracking-widest text-xs"
                  >
                    <Trash2 size={16} className="mr-1.5" />
                    Eliminar
                  </Button>
                )}
                <Button 
                  type="submit"
                  className="bg-brand hover:bg-brand-dark text-white font-black uppercase tracking-widest h-11 rounded-lg shadow-[0_0_20px_rgba(184,115,51,0.15)] flex-[2] transition-all text-xs"
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
                      className="h-7 w-full text-[8px] font-black uppercase tracking-widest bg-brand/10 text-brand hover:bg-brand hover:text-white transition-all border border-brand/20"
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
              {isAdmin && (
                <Button 
                  onClick={() => handleOpenModal(selectedTv)}
                  className="flex-1 bg-brand hover:bg-brand-dark text-white font-black uppercase tracking-widest h-12 rounded-xl flex items-center justify-center gap-2"
                >
                  <Edit2 size={16} />
                  Editar Datos
                </Button>
              )}
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
