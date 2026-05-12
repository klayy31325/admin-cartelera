"use client";

import { useState, useEffect } from "react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from "recharts";
import { 
  Activity, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  RefreshCw,
  LayoutDashboard,
  ShieldCheck,
  Cpu
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";

const COLORS = ["#B87333", "#F59E0B", "#EF4444", "#3B82F6", "#10B981", "#8B5CF6"];

export default function GeneralManagementPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [stopSummary, setStopSummary] = useState<any[]>([]);
  const [prodSummary, setProdSummary] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async (date = selectedDate) => {
    setIsLoading(true);
    const token = localStorage.getItem("curex_token");
    try {
      const [stopsRes, prodRes] = await Promise.all([
        fetch(`http://localhost:8000/api/paradas/summary-today?fecha=${date}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`http://localhost:8000/api/produccion/summary-today?fecha=${date}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const stopsData = await stopsRes.json();
      const prodData = await prodRes.json();

      if (stopsData.success) setStopSummary(stopsData.data);
      if (prodData.success) setProdSummary(prodData.data);
    } catch (error) {
      toast.error("Error al cargar datos de gestión");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(selectedDate), 60000); // Actualizar cada minuto
    return () => clearInterval(interval);
  }, [selectedDate]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
  };

  const totalStopMinutes = stopSummary.reduce((acc, curr) => acc + Number(curr.total_minutos), 0);
  const totalMeters = prodSummary.reduce((acc, curr) => acc + Number(curr.metros_totales), 0);
  const avgEfficiency = prodSummary.length > 0 
    ? (prodSummary.reduce((acc, curr) => acc + Number(curr.eficiencia_porcentaje), 0) / prodSummary.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-zinc-200 dark:border-white/[0.05] pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-brand">
            <LayoutDashboard size={12} />
            SISTEMA DE GESTIÓN CENTRAL
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">
            VISTA <span className="text-brand">GENERAL</span>
          </h1>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
            Monitoreo de eficiencia y paradas • {selectedDate}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Filtrar por Fecha</label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={handleDateChange}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl px-4 h-12 text-sm font-bold focus:ring-2 focus:ring-brand outline-none transition-all uppercase"
            />
          </div>
          <div className="flex items-end h-12">
            <Button
              onClick={() => fetchData()}
              disabled={isLoading}
              variant="outline"
              className="border-zinc-200 dark:border-white/10 font-black uppercase tracking-widest px-6 h-full rounded-xl flex items-center gap-2 hover:bg-brand/10 hover:text-brand transition-all"
            >
              {isLoading ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
              REFRESCAR
            </Button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Producción Total" 
          value={`${totalMeters.toLocaleString()} m`}
          subtitle="Metros procesados hoy"
          icon={TrendingUp}
          color="brand"
        />
        <MetricCard 
          title="Tiempo de Parada" 
          value={`${totalStopMinutes} min`}
          subtitle="Acumulado en turnos"
          icon={Clock}
          color="amber"
        />
        <MetricCard 
          title="Eficiencia Promedio" 
          value={`${avgEfficiency}%`}
          subtitle="Rendimiento de planta"
          icon={Activity}
          color="green"
        />
        <MetricCard 
          title="Incidentes Hoy" 
          value={stopSummary.length.toString()}
          subtitle="Motivos registrados"
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart: Motivos de Parada */}
        <Card className="p-8 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-white/[0.05] shadow-soft relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-brand/50 to-transparent opacity-50" />
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white mb-8 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-brand rounded-full" />
            Distribución de Paradas (Minutos)
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stopSummary}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="total_minutos"
                  nameKey="motivo"
                >
                  {stopSummary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#09090b', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Bar Chart: Producción por Máquina */}
        <Card className="p-8 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-white/[0.05] shadow-soft relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500/50 to-transparent opacity-50" />
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white mb-8 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
            Eficiencia por Máquina (%)
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prodSummary}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="maquina" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#71717a' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#71717a' }}
                />
                <Tooltip 
                   cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                   contentStyle={{ 
                    backgroundColor: '#09090b', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="eficiencia_porcentaje" radius={[6, 6, 0, 0]}>
                  {prodSummary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#B87333" : "#3B82F6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Footer Info */}
      <footer className="pt-12 border-t border-zinc-200 dark:border-white/[0.05] flex justify-between items-center text-[9px] text-zinc-400 dark:text-zinc-600 font-bold uppercase tracking-[0.2em]">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand" />
            SISTEMA ACTIVO
          </span>
          <span className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
            ULTIMA SINCRONIZACIÓN: {new Date().toLocaleTimeString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Cpu size={10} />
          <span>v4.2.0-STABLE</span>
        </div>
      </footer>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon, color }: any) {
  const colorMap: any = {
    brand: "text-brand bg-brand/10 border-brand/20",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    green: "text-green-500 bg-green-500/10 border-green-500/20",
    red: "text-red-500 bg-red-500/10 border-red-500/20",
  };

  return (
    <Card className="p-6 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-white/[0.05] shadow-soft hover:border-brand/30 transition-all group overflow-hidden relative">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[color]} transition-all group-hover:scale-110`}>
          <Icon size={24} />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{title}</p>
          <p className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">{value}</p>
          <p className="text-[9px] text-zinc-400 dark:text-zinc-600 font-bold uppercase tracking-tight">{subtitle}</p>
        </div>
      </div>
    </Card>
  );
}
