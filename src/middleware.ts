import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const routeRoles: Record<string, string[]> = {
  "/admin": ["admin", "editor", "operador", "visor"],
  "/admin/production": ["admin", "editor", "operador"],
  "/admin/informations": ["admin", "editor", "visor"],
  "/admin/produccion-informativa": ["admin", "editor", "visor"],
  "/admin/catalogs": ["admin"],
  "/admin/logs": ["admin", "visor"],
  "/admin/settings": ["admin", "editor", "visor"],
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("curex_token")?.value;
  const { pathname } = request.nextUrl;

  if (pathname === "/" || pathname.startsWith("/_next") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const payload = decodeJwtPayload(token);
    const userRole = payload?.rol as string | undefined;

    if (userRole) {
      const matchedRoute = Object.keys(routeRoles).find(
        (route) => pathname === route || pathname.startsWith(route + "/")
      );

      if (matchedRoute) {
        const allowedRoles = routeRoles[matchedRoute];
        if (!allowedRoles.includes(userRole)) {
          return NextResponse.redirect(new URL("/admin", request.url));
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
