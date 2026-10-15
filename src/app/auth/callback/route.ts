import { NextResponse, type NextRequest } from "next/server";

import { hasSupabaseConfig } from "@/lib/env";
import { getAuthorizedOwnerEmail } from "@/lib/server-env";
import { createClient } from "@/lib/supabase/server";

function getOAuthFailureUrl(request: NextRequest, reason: string) {
  const url = new URL("/iniciar-sesion", request.url);
  url.searchParams.set("error", "oauth");
  url.searchParams.set("motivo", reason);
  return url;
}

export async function GET(request: NextRequest) {
  if (!hasSupabaseConfig()) {
    return NextResponse.redirect(new URL("/iniciar-sesion?estado=sin-configurar", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    const providerError =
      request.nextUrl.searchParams.get("error_code") ??
      request.nextUrl.searchParams.get("error") ??
      "missing_code";
    return NextResponse.redirect(getOAuthFailureUrl(request, providerError));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const reason =
      error.code ?? (error.message === "fetch failed" ? "network" : "exchange_failed");
    return NextResponse.redirect(
      getOAuthFailureUrl(request, reason),
    );
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

