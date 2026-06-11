"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Settings,
  Database,
  LogOut,
  Activity,
  ShieldCheck,
  Megaphone,
  User as UserIcon,
  Clock,
  Terminal,
  Cpu,
  PieChart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api-config";
import { useAuth } from "@/components/auth-provider";
import { useEffect, useState } from "react";

const allMenuItems = [
  { name: "Panel de Control", href: "/admin", icon: LayoutDashboard, roles: ["admin", "editor", "operador", "visor"] },
  { name: "Producción", href: "/admin/production", icon: ClipboardList, roles: ["admin", "editor", "operador"] },
  { name: "Información Diaria", href: "/admin/informations", icon: Megaphone, roles: ["admin", "editor", "visor"] },
  { name: "Producción Informativa", href: "/admin/produccion-informativa", icon: ClipboardList, roles: ["admin", "editor", "visor"] },
  { name: "Logs del Sistema", href: "/admin/logs", icon: Activity, roles: ["admin", "visor"] },
  { name: "Ajustes del Sistema", href: "/admin/settings", icon: Settings, roles: ["admin", "editor", "visor"] },
];

const roleLabels: Record<string, string> = {
  admin: "ADMINISTRADOR",
  editor: "EDITOR",
  operador: "OPERADOR",
  visor: "VISOR",
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const menuItems = allMenuItems.filter((item) => item.roles.includes(user?.rol ?? ""));

  return (
    <aside className="sidebar-dark-theme w-72 bg-zinc-950 border-r border-white/[0.03] flex flex-col h-screen sticky top-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-brand/5 via-transparent to-transparent pointer-events-none opacity-100" />

      <div className="p-8 relative">
        <Link href="/admin/production" className="flex items-center gap-4 group">
          <div className="relative">
            <div className="w-11 h-11 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center justify-center p-2 shadow-[0_0_15px_rgba(249,115,22,0.15)] group-hover:scale-105 transition-all duration-500">
              <img src="/logo-curex.png" alt="Curex Logo" className="w-full h-full object-contain" style={{ mixBlendMode: 'multiply' }} />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-zinc-950 rounded-full" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white group-hover:text-brand transition-colors leading-none">
              CUREX <span className="text-brand">ADMIN</span>
            </h1>
            <p className="text-[7px] uppercase font-black tracking-[0.4em] text-zinc-500 mt-1.5 flex items-center gap-1.5">
              <Cpu size={8} /> SISTEMA CENTRAL v4.2
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto overflow-x-hidden transition-all duration-300 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden relative">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all group relative overflow-hidden",
                isActive
                  ? "bg-brand/10 text-brand border border-brand/20 shadow-[0_0_15px_rgba(184,115,51,0.03)]"
                  : "text-zinc-500 hover:text-white hover:bg-white/[0.02]"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/4 h-1/2 w-[3px] bg-brand rounded-r-full shadow-[0_0_10px_rgba(184,115,51,1)]" />
              )}
              <Icon size={18} className={cn(
                "transition-all duration-300",
                isActive ? "text-brand scale-110 drop-shadow-[0_0_8px_rgba(184,115,51,0.3)]" : "group-hover:text-white"
              )} />
              <span className="relative z-10">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-5 border-t border-white/[0.03] bg-zinc-950">
        <div className="flex items-center justify-between gap-3 mb-2 px-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/[0.05] flex items-center justify-center text-brand overflow-hidden shadow-sm">
              {user ? <span className="font-black text-xs">{user.nombre[0]}{user.apellido[0]}</span> : <UserIcon size={16} />}
            </div>
            <div>
              <p className="text-[10px] font-black text-white uppercase tracking-tighter leading-none">
                {user ? `${user.nombre} ${user.apellido}` : "Operador_01"}
              </p>
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-1 block">
                {user ? roleLabels[user.rol] || user.rol.toUpperCase() : "SIN ACCESO"}
              </span>
            </div>
          </div>
          <button onClick={logout} className="p-2 rounded-lg bg-zinc-900 border border-white/[0.03] text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function RecentLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/logs?limit=4`);
      const data = await res.json();
      if (Array.isArray(data)) setLogs(data);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="space-y-3 px-1">{[1, 2, 3].map(i => <div key={i} className="h-10 animate-pulse bg-zinc-100 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-white/[0.02]" />)}</div>;
  if (logs.length === 0) return <p className="text-[9px] text-zinc-400 italic px-2 font-mono">Buscando actividad...</p>;

  return (
    <div className="space-y-3.5 px-1">
      {logs.map((log) => (
        <div key={log.id} className="group relative pl-4 border-l-2 border-zinc-100 dark:border-zinc-900 hover:border-brand/40 transition-all duration-300">
          <div className="flex items-center justify-between mb-1.5">
            <span className={cn(
              "text-[7px] font-black uppercase px-1.5 py-0.5 rounded-sm tracking-widest",
              log.tipo === 'success' ? "bg-green-500/10 text-green-600 dark:text-green-500" :
                log.tipo === 'warning' ? "bg-amber-500/10 text-amber-600 dark:text-amber-500" :
                  log.tipo === 'error' ? "bg-red-500/10 text-red-600 dark:text-red-500" : "bg-brand/10 text-brand"
            )}>
              {log.accion}
            </span>
            <span className="text-[8px] font-mono text-zinc-400 dark:text-zinc-700 flex items-center gap-1.5">
              <Clock className="w-2.5 h-2.5" />
              {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
          <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-300 transition-colors leading-relaxed line-clamp-2">
            {log.descripcion}
          </p>
        </div>
      ))}
    </div>
  );
}
