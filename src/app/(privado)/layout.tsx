import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { hasSupabaseConfig } from "@/lib/env";
import { getAuthorizedOwnerEmail } from "@/lib/server-env";
import { createClient } from "@/lib/supabase/server";

export default async function PrivateLayout({ children }: { children: ReactNode }) {
  if (!hasSupabaseConfig()) {
    redirect("/iniciar-sesion?estado=sin-configurar");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/iniciar-sesion");
  }

  const allowedEmail = getAuthorizedOwnerEmail();
  if (!allowedEmail || user.email?.toLocaleLowerCase("en-US") !== allowedEmail) {
    redirect("/acceso-no-autorizado");
  }

  return <AppShell>{children}</AppShell>;
}

