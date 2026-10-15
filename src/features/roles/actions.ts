"use server";

import { revalidatePath } from "next/cache";

import { roleSchema } from "@/features/roles/domain";
import { requireOwnerContext } from "@/lib/auth/owner-context";
import { createClient } from "@/lib/supabase/server";

export type RoleFormState = {
  status: "idle" | "error" | "success";
  message: string;
  errors?: { name?: string[] };
};

export async function createRoleAction(
  _previousState: RoleFormState,
  formData: FormData,
): Promise<RoleFormState> {
  const parsed = roleSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisa el nombre del rol.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const owner = await requireOwnerContext();
    const supabase = await createClient();
    const { data: lastRole } = await supabase
      .from("roles")
      .select("sort_order")
      .eq("band_id", owner.bandId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await supabase.from("roles").insert({
      band_id: owner.bandId,
      name: parsed.data.name,
      sort_order: Number(lastRole?.sort_order ?? 0) + 10,
    });

    if (error?.code === "23505") {
      return { status: "error", message: "Ya existe un rol con ese nombre." };
    }
    if (error) throw error;

    revalidatePath("/configuracion");
    revalidatePath("/musicos");
    return { status: "success", message: "Rol creado correctamente." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "No fue posible crear el rol.",
    };
  }
}

export async function toggleRoleAction(formData: FormData) {
  const roleId = Number(formData.get("roleId"));
  const nextActive = formData.get("nextActive") === "true";
  if (!Number.isSafeInteger(roleId) || roleId <= 0) return;

  const owner = await requireOwnerContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("roles")
    .update({ is_active: nextActive })
    .eq("id", roleId)
    .eq("band_id", owner.bandId);

  if (error) throw error;
  revalidatePath("/configuracion");
  revalidatePath("/musicos");
}
