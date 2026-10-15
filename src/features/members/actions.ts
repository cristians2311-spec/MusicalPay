"use server";

import { revalidatePath } from "next/cache";

import { memberSchema } from "@/features/members/domain";
import { requireOwnerContext } from "@/lib/auth/owner-context";
import { createClient } from "@/lib/supabase/server";

type MemberField = "name" | "nickname" | "phone" | "notes" | "roleIds";

export type MemberFormState = {
  status: "idle" | "error" | "success";
  message: string;
  errors?: Partial<Record<MemberField, string[]>>;
};

export async function createMemberAction(
  _previousState: MemberFormState,
  formData: FormData,
): Promise<MemberFormState> {
  const parsed = memberSchema.safeParse({
    name: formData.get("name"),
    nickname: formData.get("nickname"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
    roleIds: formData.getAll("roleIds"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisa los campos señalados.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  let insertedMemberId: number | null = null;

  try {
    const owner = await requireOwnerContext();
    const supabase = await createClient();
    const uniqueRoleIds = [...new Set(parsed.data.roleIds)];
    const { data: roles, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("band_id", owner.bandId)
      .eq("is_active", true)
      .in("id", uniqueRoleIds);

    if (roleError) throw roleError;
    if ((roles ?? []).length !== uniqueRoleIds.length) {
      return {
        status: "error",
        message: "Uno de los roles ya no está disponible. Actualiza la página.",
        errors: { roleIds: ["Selecciona nuevamente los roles."] },
      };
    }

    const { data: member, error: memberError } = await supabase
      .from("members")
      .insert({
        band_id: owner.bandId,
        name: parsed.data.name,
        nickname: parsed.data.nickname || null,
        phone: parsed.data.phone || null,
        notes: parsed.data.notes || null,
      })
      .select("id")
      .single();

    if (memberError) throw memberError;
    insertedMemberId = Number(member.id);

    const { error: assignmentError } = await supabase.from("member_roles").insert(
      uniqueRoleIds.map((roleId) => ({
        band_id: owner.bandId,
        member_id: insertedMemberId,
        role_id: roleId,
      })),
    );

    if (assignmentError) {
      await supabase
        .from("members")
        .delete()
        .eq("id", insertedMemberId)
        .eq("band_id", owner.bandId);
      throw assignmentError;
    }

    revalidatePath("/musicos");
    return { status: "success", message: "Músico guardado correctamente." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "No fue posible guardar el músico.",
    };
  }
}

export async function toggleMemberArchiveAction(formData: FormData) {
  const memberId = Number(formData.get("memberId"));
  if (!Number.isSafeInteger(memberId) || memberId <= 0) return;

  const owner = await requireOwnerContext();
  const supabase = await createClient();
  const { data: member, error: readError } = await supabase
    .from("members")
    .select("archived_at,is_owner_profile")
    .eq("id", memberId)
    .eq("band_id", owner.bandId)
    .single();

  if (readError) throw readError;
  if (member.is_owner_profile) return;

  const archivedAt = member.archived_at ? null : new Date().toISOString();
  const { error } = await supabase
    .from("members")
    .update({ archived_at: archivedAt, is_active: archivedAt === null })
    .eq("id", memberId)
    .eq("band_id", owner.bandId);

  if (error) throw error;
  revalidatePath("/musicos");
}
