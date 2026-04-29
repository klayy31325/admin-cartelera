"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";
type BrandColor = {
  name: string;
  hsl: string;
};

const BRAND_COLORS: BrandColor[] = [
  { name: "Cobre", hsl: "28 55% 46%" },
  { name: "Azul Industrial", hsl: "217 91% 60%" },
  { name: "Verde Esmeralda", hsl: "160 84% 39%" },
  { name: "Púrpura", hsl: "262 83% 58%" },
  { name: "Rojo Alerta", hsl: "0 72% 51%" },
];

interface ThemeContextType {
  theme: Theme;
  brandColor: string;
  setTheme: (theme: Theme) => void;
  setBrandColor: (hsl: string) => void;
  colors: BrandColor[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [brandColor, setBrandColor] = useState("28 55% 46%");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;
    const savedColor = localStorage.getItem("brandColor");
    if (savedTheme) setTheme(savedTheme);
    if (savedColor) setBrandColor(savedColor);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const root = window.document.documentElement;
    root.style.setProperty("--brand", brandColor);
    
    const [h, s, l] = brandColor.split(" ").map(v => parseInt(v));
    root.style.setProperty("--brand-light", `${h} ${s}% ${l + 10}%`);
    root.style.setProperty("--brand-dark", `${h} ${s}% ${l - 10}%`);
    
    localStorage.setItem("brandColor", brandColor);
  }, [brandColor, mounted]);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, brandColor, setTheme, setBrandColor, colors: BRAND_COLORS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
