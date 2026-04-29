import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ADMIN CARTELERA",
  description: "Sistema de Control Industrial TV V1.0.0",
};

import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground min-h-screen antialiased selection:bg-brand/30 selection:text-brand`}>
        <ThemeProvider>
          <div className="relative">
            {children}
          </div>
          <Toaster
            richColors
            position="top-right"
            toastOptions={{
              style: {
                background: '#020617',
                border: '1px solid #1e293b',
                color: '#e2e8f0',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
