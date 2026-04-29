import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // En un sistema real, aquí verificarías la sesión/JWT y el rol del usuario.
  // Por ahora, permitimos el acceso pero dejamos el placeholder para la lógica de ADMIN.
  
  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
  
  if (isAdminPath) {
    // Lógica de validación de rol 'ADMIN' iría aquí
    console.log("Acceso a ruta de administración:", request.nextUrl.pathname);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
