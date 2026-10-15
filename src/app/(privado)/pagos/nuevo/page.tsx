import Link from "next/link";

import { remainingObligation } from "@/features/payments/domain";
import { PaymentForm } from "@/features/payments/components/payment-form";
import { findOwnerContext } from "@/lib/auth/owner-context";
import { createClient } from "@/lib/supabase/server";

export default async function NewPaymentPage() {
  const ownerResult = await findOwnerContext();
  if (!ownerResult.context) return <p>{ownerResult.error}</p>;
  const supabase = await createClient();
  const [{ data: obligations }, { data: members }, { data: events }, { data: methods }] = await Promise.all([
    supabase.from("obligations").select("id,event_id,member_id,recognized_amount_cop").eq("band_id", ownerResult.context.bandId).eq("beneficiary_type", "member").in("status", ["pending", "partial"]).order("recognized_on"),
    supabase.from("members").select("id,name").eq("band_id", ownerResult.context.bandId),
    supabase.from("events").select("id,event_number,occasion,event_date").eq("band_id", ownerResult.context.bandId),
    supabase.from("payment_methods").select("id,name").eq("band_id", ownerResult.context.bandId).eq("is_active", true).order("sort_order").order("name"),
  ]);
  const obligationIds = (obligations ?? []).map((obligation) => obligation.id);
  const { data: allocations } = obligationIds.length ? await supabase.from("payment_allocations").select("obligation_id,amount_cop").eq("band_id", ownerResult.context.bandId).in("obligation_id", obligationIds) : { data: [] };
  const allocated = new Map<number, number>();
  for (const allocation of allocations ?? []) allocated.set(allocation.obligation_id, (allocated.get(allocation.obligation_id) ?? 0) + allocation.amount_cop);
  const memberNames = new Map((members ?? []).map((member) => [member.id, member.name]));
  const eventMap = new Map((events ?? []).map((event) => [event.id, event]));
  const debts = (obligations ?? []).flatMap((obligation) => { const amountCop = remainingObligation(obligation.recognized_amount_cop, allocated.get(obligation.id) ?? 0); const event = eventMap.get(obligation.event_id); const memberName = obligation.member_id ? memberNames.get(obligation.member_id) : null; return amountCop > 0 && obligation.member_id && memberName ? [{ id: obligation.id, memberId: obligation.member_id, memberName, eventLabel: event ? `EV-${String(event.event_number).padStart(4, "0")} · ${event.occasion} · ${event.event_date}` : "Evento", amountCop }] : []; });
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
  return <div className="page-stack"><section className="page-heading"><div><span className="eyebrow">Pagos / Nuevo</span><h1>Nuevo pago</h1><p>Paga varias presentaciones del mismo músico en una sola operación.</p></div><Link className="text-link" href="/pagos">Volver</Link></section><PaymentForm debts={debts} paymentMethods={methods ?? []} today={today} /></div>;
}
