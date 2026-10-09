import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseConfig, hasSupabaseConfig } from "@/lib/env";

const PUBLIC_PATHS = new Set([
  "/iniciar-sesion",
  "/acceso-no-autorizado",
  "/auth/callback",
]);

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.has(pathname);
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!hasSupabaseConfig()) {
    if (!isPublicPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/iniciar-sesion";
      url.searchParams.set("estado", "sin-configurar");
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig();
  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/iniciar-sesion";
    url.searchParams.set("siguiente", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/iniciar-sesion") {
    const url = request.nextUrl.clone();
    url.pathname = "/inicio";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

