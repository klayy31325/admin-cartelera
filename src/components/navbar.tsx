"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ClipboardList, Settings, Database } from "lucide-react";

const navItems = [
  { name: "Producción", href: "/admin/production", icon: ClipboardList },
  { name: "Metas (KPI)", href: "/admin/settings", icon: Settings },
  { name: "Catálogos", href: "/admin/catalogs", icon: Database },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-orange-500 font-bold text-xl flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-slate-950">
                <LayoutDashboard size={20} />
              </div>
              <span>INDUSTRIAL OPS</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                      isActive 
                        ? "bg-orange-500/10 text-orange-500" 
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
                    )}
                  >
                    <Icon size={18} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Admin Mode</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
