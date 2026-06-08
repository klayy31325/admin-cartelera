"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Manrope } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/components/auth-provider";

const manrope = Manrope({ subsets: ["latin"] });

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [bgIndex, setBgIndex] = useState(0);
  const backgrounds = ["/OLYMPIA.png", "/novoflex.png"];
  const [themeClass, setThemeClass] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
      return;
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      if (user.empresa?.toLowerCase().includes("morrocel")) {
        setThemeClass("theme-morrocel");
      } else if (user.empresa?.toLowerCase().includes("curex")) {
        setThemeClass("theme-curex");
      }
    }

    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgrounds.length);
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className={`flex min-h-screen bg-background relative transition-colors duration-500 ${themeClass} ${manrope.className}`}>
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
        <div className="absolute inset-0 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-[2px] dark:backdrop-brightness-[0.2]" />
      </div>

      <Sidebar />
      <main className="admin-readable flex-1 p-8 lg:p-8 overflow-y-auto relative z-10">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
