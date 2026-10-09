import { NextResponse, type NextRequest } from "next/server";

import { hasSupabaseConfig } from "@/lib/env";
import { getAuthorizedOwnerEmail } from "@/lib/server-env";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  if (!hasSupabaseConfig()) {
    return NextResponse.redirect(new URL("/iniciar-sesion?estado=sin-configurar", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/iniciar-sesion?error=oauth", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/iniciar-sesion?error=oauth", request.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const allowedEmail = getAuthorizedOwnerEmail();
  const currentEmail = user?.email?.toLocaleLowerCase("en-US") ?? null;

  if (!allowedEmail || currentEmail !== allowedEmail) {
    await supabase.auth.signOut({ scope: "local" });
    return NextResponse.redirect(new URL("/acceso-no-autorizado", request.url));
  }

  return NextResponse.redirect(new URL("/inicio", request.url));
}

