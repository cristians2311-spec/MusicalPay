import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import { remainingObligation } from "@/features/payments/domain";
import { formatCop } from "@/features/quotes/domain";
import { findOwnerContext } from "@/lib/auth/owner-context";
import { createClient } from "@/lib/supabase/server";

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ creado?: string }> }) {
  const { creado } = await searchParams;
  const ownerResult = await findOwnerContext();
  if (!ownerResult.context) return <p>{ownerResult.error}</p>;
  const supabase = await createClient();
  const [{ data: obligations }, { data: payments }, { data: members }] = await Promise.all([
    supabase.from("obligations").select("id,member_id,recognized_amount_cop,status").eq("band_id", ownerResult.context.bandId).eq("beneficiary_type", "member"),
    supabase.from("payments").select("id,payment_number,member_id,amount_cop,paid_on,reference").eq("band_id", ownerResult.context.bandId).eq("beneficiary_type", "member").order("paid_on", { ascending: false }).order("id", { ascending: false }),
    supabase.from("members").select("id,name").eq("band_id", ownerResult.context.bandId),
  ]);
  const obligationIds = (obligations ?? []).map((obligation) => obligation.id);
  const { data: allocations } = obligationIds.length ? await supabase.from("payment_allocations").select("obligation_id,amount_cop").eq("band_id", ownerResult.context.bandId).in("obligation_id", obligationIds) : { data: [] };
  const allocated = new Map<number, number>();
  for (const allocation of allocations ?? []) allocated.set(allocation.obligation_id, (allocated.get(allocation.obligation_id) ?? 0) + allocation.amount_cop);
  const memberNames = new Map((members ?? []).map((member) => [member.id, member.name]));
  const pendingByMember = new Map<number, number>();
  for (const obligation of obligations ?? []) if (obligation.member_id) pendingByMember.set(obligation.member_id, (pendingByMember.get(obligation.member_id) ?? 0) + remainingObligation(obligation.recognized_amount_cop, allocated.get(obligation.id) ?? 0));
  const totalPending = [...pendingByMember.values()].reduce((sum, amount) => sum + amount, 0);
  return (
    <div className="page-stack">
      <section className="page-heading"><div><span className="eyebrow">Egresos</span><h1>Pagos</h1><p>Agrupa lo que debes a cada músico y registra un solo pago total.</p></div><Link className="primary-button" href="/pagos/nuevo"><Icon name="hand-coins" size={18} />Registrar pago</Link></section>
      {creado ? <p className="action-message action-message--success">El pago quedó registrado y aplicado a las presentaciones.</p> : null}
      <article className="content-card"><div className="section-heading"><div><span className="eyebrow">Pendiente</span><h2>{formatCop(totalPending)}</h2></div></div>{pendingByMember.size ? <div className="record-list">{[...pendingByMember.entries()].filter(([, amount]) => amount > 0).map(([memberId, amount]) => <article className="record-row" key={memberId}><div className="record-avatar"><Icon name="users" size={18} /></div><div className="record-row__body"><strong>{memberNames.get(memberId) ?? "Músico"}</strong><span>{formatCop(amount)} por pagar</span></div></article>)}</div> : <p>No hay pagos pendientes.</p>}</article>
      <article className="content-card"><div className="section-heading"><div><span className="eyebrow">Historial</span><h2>{payments?.length ?? 0} pago(s)</h2></div></div>{payments?.length ? <div className="record-list">{payments.map((payment) => <article className="record-row" key={payment.id}><div className="record-avatar">#{payment.payment_number}</div><div className="record-row__body"><strong>{memberNames.get(payment.member_id ?? 0) ?? "Músico"} · {formatCop(payment.amount_cop)}</strong><span>{payment.paid_on}</span><small>{payment.reference || "Sin referencia"}</small></div></article>)}</div> : <div className="empty-state"><span className="empty-state__icon"><Icon name="hand-coins" size={24} /></span><h3>Aún no hay pagos</h3><p>Al realizar eventos aparecerán aquí las deudas con músicos.</p></div>}</article>
    </div>
  );
}

