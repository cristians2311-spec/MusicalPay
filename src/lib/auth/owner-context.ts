import "server-only";

import { getAuthorizedOwnerEmail } from "@/lib/server-env";
import { createClient } from "@/lib/supabase/server";

export type OwnerContext = {
  bandId: number;
  userId: string;
};

export async function findOwnerContext(): Promise<
  { context: OwnerContext; error: null } | { context: null; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  const allowedEmail = getAuthorizedOwnerEmail();
  if (
    userError ||
    !user ||
    !allowedEmail ||
    user.email?.toLocaleLowerCase("en-US") !== allowedEmail
  ) {
    return { context: null, error: "La sesión no está autorizada." };
  }

  const { data: appUser, error: profileError } = await supabase
    .from("app_users")
    .select("band_id")
    .eq("user_id", user.id)
    .eq("role", "owner")
    .eq("is_active", true)
    .maybeSingle();

  if (profileError || !appUser) {
    return {
      context: null,
      error: "Falta vincular esta cuenta con la agrupación en Supabase.",
    };
  }

  return {
    context: { bandId: Number(appUser.band_id), userId: user.id },
    error: null,
  };
}

export async function requireOwnerContext() {
  const result = await findOwnerContext();
  if (!result.context) throw new Error(result.error);
  return result.context;
}
