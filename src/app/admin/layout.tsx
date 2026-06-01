"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Manrope } from "next/font/google";
import { Sidebar } from "@/components/sidebar";

const manrope = Manrope({ subsets: ["latin"] });

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [bgIndex, setBgIndex] = useState(0);
  const backgrounds = ["/OLYMPIA.png", "/novoflex.png"];

  const [themeClass, setThemeClass] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("curex_user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.empresa?.toLowerCase().includes("morrocel")) {
          setThemeClass("theme-morrocel");
        } else if (user.empresa?.toLowerCase().includes("curex")) {
          setThemeClass("theme-curex");
        }
      } catch (error) {
        console.error("Error parsing user for theme:", error);
      }
    }

    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgrounds.length);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex min-h-screen bg-background relative transition-colors duration-500 ${themeClass} ${manrope.className}`}>
      {/* Background Alternante Ultra Fluido - Ahora visible en ambos temas con diferentes filtros */}
      <div className="fixed inset-0 z-0 overflow-hidden bg-background">
        {backgrounds.map((bg, index) => (
          <div
            key={bg}
            className="absolute inset-0 will-change-opacity"
            style={{
              opacity: index === bgIndex ? 0.25 : 0,
              transition: "opacity 30s ease-in-out",
            }}
          >
            <Image
              src={bg}
              alt="Admin Background"
              fill
              priority
              className="object-cover grayscale"
            />
          </div>
        ))}
        {/* Filtro Dinámico: Oscuro en Dark Mode, Grisáceo Transparente en Light Mode */}
        <div className="absolute inset-0 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-[2px] dark:backdrop-brightness-[0.2]" />
      </div>

      {/* Barra Lateral estilo CUREX */}
      <Sidebar />

      {/* Contenido Principal */}
      <main className="admin-readable flex-1 p-8 lg:p-8 overflow-y-auto relative z-10">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
