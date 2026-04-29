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
  User as UserIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const menuItems = [
  {
    group: "Administration", items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Production", href: "/admin/production", icon: ClipboardList },
      { name: "Monitoring", href: "/admin/monitoring", icon: Activity },
      { name: "System Logs", href: "/admin/logs", icon: Database },
    ]
  },
  {
    group: "Config", items: [
      { name: "Settings", href: "/admin/settings", icon: Settings },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 bg-zinc-500/10 backdrop-blur-xl border-r border-border flex flex-col h-screen sticky top-0 shadow-soft transition-colors duration-500">
      {/* Logo Area */}
      <div className="p-8">
        <Link href="/admin/production" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-black shadow-[0_0_15px_rgba(184,115,51,0.3)] group-hover:scale-110 transition-transform">
            <ShieldCheck size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter text-foreground group-hover:text-brand transition-colors leading-none uppercase">
              ADMIN  <span className="text-brand">  CARTELERA</span>
            </h1>
            <p className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold mt-1">SISTEMA DE PRODUCCION</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-8 overflow-y-auto">
        {menuItems.map((group) => (
          <div key={group.group} className="space-y-2">
            <h2 className="px-4 text-[10px] uppercase font-black text-zinc-700 tracking-[0.2em]">
              {group.group}
            </h2>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group relative overflow-hidden",
                      isActive
                        ? "bg-brand/10 text-brand shadow-[inset_0_0_10px_rgba(184,115,51,0.05)]"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 w-1 h-full bg-brand" />
                    )}
                    <Icon size={18} className={cn(isActive ? "text-brand" : "group-hover:text-brand transition-colors")} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Area */}
      <div className="p-4 border-t border-zinc-900 space-y-4">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
            <UserIcon size={20} />
          </div>
          <div>
            <p className="text-xs font-black text-foreground uppercase tracking-tighter">Admin User</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Online</span>
            </div>
          </div>
        </div>

        <Link href="/">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 h-12 rounded-xl font-bold text-xs uppercase tracking-widest"
          >
            <LogOut size={16} />
            Terminal Logout
          </Button>
        </Link>
      </div>
    </aside>
  );
}
