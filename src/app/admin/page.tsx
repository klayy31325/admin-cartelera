"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Tv,
  Plus,
  Activity,
  MoreVertical,
  Power,
  Monitor,
  LayoutDashboard,
  ExternalLink,
  Edit2,
  ShieldCheck,
  Trash2,
  X,
  Info,
  Clock,
  MapPin,
  Settings2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TV {
  id: string;
  name: string;
  status: "active" | "inactive";
  location: string;
  lastSync: string;
}

export default function AdminDashboard() {
  const [tvs, setTvs] = useState<TV[]>([
    { id: "1", name: "TV-01", status: "active", location: "Pasillo Principal", lastSync: "2 min atrás" },
    { id: "2", name: "TV-02", status: "active", location: "Línea Producción", lastSync: "5 min atrás" },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTv, setSelectedTv] = useState<TV | null>(null);
  const [editForm, setEditForm] = useState({ name: "", location: "" });

  const toggleStatus = (id: string) => {
    setTvs(tvs.map(tv =>
      tv.id === id
        ? { ...tv, status: tv.status === "active" ? "inactive" : "active" }
        : tv
    ));
  };

  const startEditing = (tv: TV) => {
    setEditingId(tv.id);
    setEditForm({ name: tv.name, location: tv.location });
  };

  const saveEdit = (id: string) => {
    setTvs(tvs.map(tv =>
      tv.id === id ? { ...tv, name: editForm.name, location: editForm.location } : tv
    ));
    setEditingId(null);
  };

  const deleteTv = (id: string) => {
    setTvs(tvs.filter(tv => tv.id !== id));
  };

  const addTv = () => {
    const newId = (tvs.length + 1).toString().padStart(2, '0');
    const newTv: TV = {
      id: Math.random().toString(36).substr(2, 9),
      name: `TV-${newId}`,
      status: "inactive",
      location: "Ubicación por definir",
      lastSync: "Nunca"
    };
    setTvs([...tvs, newTv]);
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
          onClick={addTv}
          className="bg-brand hover:bg-brand-dark text-black font-black uppercase tracking-widest px-6 h-12 rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(184,115,51,0.2)] transition-all"
        >
          <Plus size={18} strokeWidth={3} />
          NUEVA TV
        </Button>
      </header>

      {/* Grid de Carteleras */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {tvs.map((tv) => {
          const isEditing = editingId === tv.id;

          return (
            <Card
              key={tv.id}
              onClick={() => !isEditing && setSelectedTv(tv)}
              className={`bg-card p-4 relative overflow-hidden group transition-all duration-300 flex flex-col justify-between min-h-[200px] cursor-pointer hover:scale-[1.02] border-border shadow-soft ${tv.status === 'active'
                ? 'border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.05)] hover:border-green-500/60'
                : 'hover:border-brand/40'
                }`}
            >
              {/* Decoración superior */}
              <div className={`absolute top-0 left-0 w-full h-[2px] transition-colors ${tv.status === 'active' ? 'bg-green-500' : 'bg-muted'}`} />

              <div className="flex justify-between items-start">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${tv.status === 'active' ? 'bg-green-500/10 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-muted text-muted-foreground'}`}>
                  <Tv size={20} />
                </div>

                <div className="flex gap-1">
                  {isEditing ? (
                    <>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          saveEdit(tv.id);
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white w-7 h-7 rounded-lg p-0"
                      >
                        <ShieldCheck size={12} />
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTv(tv.id);
                        }}
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(tv);
                      }}
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5"
                    >
                      <Edit2 size={12} />
                    </Button>
                  )}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStatus(tv.id);
                    }}
                    variant="ghost"
                    size="icon"
                    className={`w-7 h-7 rounded-lg transition-colors ${tv.status === 'active' ? 'text-green-500 hover:bg-green-500/10' : 'text-zinc-600 hover:bg-zinc-800'}`}
                  >
                    <Power size={12} />
                  </Button>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {isEditing ? (
                  <div className="space-y-2 animate-in fade-in duration-300">
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-xl font-black text-white w-full focus:outline-none focus:border-brand/50"
                      autoFocus
                    />
                    <input
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-[9px] font-bold uppercase text-zinc-400 w-full focus:outline-none focus:border-brand/50"
                    />
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl font-black text-foreground tracking-tight leading-none mb-1 shadow-sm">{tv.name}</h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.15em]">{tv.location}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${tv.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${tv.status === 'active' ? 'text-green-500' : 'text-muted-foreground'}`}>
                      {tv.status === 'active' ? 'EN LINEA' : 'DESCONECTADO'}
                    </span>
                  </div>
                  <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Sinc: {tv.lastSync}</span>
                </div>
              </div>
            </Card>
          );
        })}

        {/* Empty State */}
        {tvs.length === 0 && (
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
            Activos: {tvs.filter(t => t.status === 'active').length}
          </span>
          <span className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-muted" />
            Total: {tvs.length}
          </span>
        </div>
        <span>Morrocel C.A - CUREX C.A // SISTEMA DE PRODUCCION v1.0.0</span>
        </footer>
      </div>

      {/* Drawer de Detalles (Side Panel) - FUERA del contenedor animado */}
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
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedTv.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-zinc-900 text-zinc-600'}`}>
                  <Monitor size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground uppercase tracking-tighter">{selectedTv.name}</h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Información del Dispositivo</p>
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
                    <p className={`text-sm font-black uppercase ${selectedTv.status === 'active' ? 'text-green-500' : 'text-muted-foreground'}`}>
                      {selectedTv.status === 'active' ? 'En Línea' : 'Desconectado'}
                    </p>
                  </div>
                  <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-1">
                    <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">Sincronización</p>
                    <p className="text-sm font-black text-foreground uppercase">{selectedTv.lastSync}</p>
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand">
                  <Info size={12} />
                  Parámetros de Salida
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded-2xl">
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-muted-foreground" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Ubicación</span>
                    </div>
                    <span className="text-xs font-black text-foreground uppercase">{selectedTv.location}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Clock size={16} className="text-muted-foreground" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Tiempo Activo</span>
                    </div>
                    <span className="text-xs font-black text-foreground uppercase">12h 45m</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Settings2 size={16} className="text-muted-foreground" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Resolución</span>
                    </div>
                    <span className="text-xs font-black text-foreground uppercase">1920x1080 (HD)</span>
                  </div>
                </div>
              </div>

              {/* Data Preview (Placeholder) */}
              <div className="mt-auto p-6 bg-brand/5 border border-brand/20 rounded-2xl space-y-3">
                <p className="text-[9px] text-brand font-black uppercase tracking-widest">Vista Previa de Datos</p>
                <div className="h-24 flex items-center justify-center border border-dashed border-brand/30 rounded-xl">
                  <p className="text-[10px] text-zinc-500 font-bold text-center px-4">
                    La previsualización del contenido actual estará disponible una vez se vincule el módulo de producción.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border bg-card/50 backdrop-blur-md space-y-3">
              <Link href="/admin/production" className="w-full">
                <Button 
                  className="w-full bg-brand hover:bg-brand-dark text-black font-black uppercase tracking-widest h-12 rounded-xl flex items-center justify-center gap-2"
                >
                  <Edit2 size={16} />
                  Editar Información
                </Button>
              </Link>
              <Button 
                onClick={() => setSelectedTv(null)}
                variant="outline"
                className="w-full border-border text-foreground hover:bg-muted font-black uppercase tracking-widest h-12 rounded-xl"
              >
                Cerrar Panel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
