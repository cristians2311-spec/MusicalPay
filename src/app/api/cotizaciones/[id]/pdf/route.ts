import { readFile } from "node:fs/promises";
import path from "node:path";

import { generateQuotePdf } from "@/features/quotes/pdf";
import { requireOwnerContext } from "@/lib/auth/owner-context";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const quoteId = Number((await params).id);
  if (!Number.isSafeInteger(quoteId) || quoteId <= 0) return new Response("Cotización inválida", { status: 400 });
  try {
    const owner = await requireOwnerContext();
    const supabase = await createClient();
    const { data: quote } = await supabase.from("quotes").select("id,client_id,status,current_revision_number,quote_number").eq("id", quoteId).eq("band_id", owner.bandId).maybeSingle();
    if (!quote || quote.status === "draft" || !quote.quote_number) return new Response("Cotización no disponible", { status: 404 });
    const [{ data: client }, { data: revision }] = await Promise.all([
      supabase.from("clients").select("name,phone").eq("id", quote.client_id).eq("band_id", owner.bandId).single(),
      supabase.from("quote_revisions").select("id,event_date,starts_at,venue,address,occasion,expires_on,general_conditions").eq("quote_id", quote.id).eq("revision_number", quote.current_revision_number).eq("band_id", owner.bandId).single(),
    ]);
    if (!client || !revision) return new Response("Cotización no disponible", { status: 404 });
    const { data: options } = await supabase.from("quote_options").select("option_number,name,price_cop,half_tanda_units,break_minutes,required_advance_cop,customer_conditions").eq("revision_id", revision.id).eq("band_id", owner.bandId).order("option_number");
    const logoBytes = await readFile(path.join(process.cwd(), "public", "brand", "cristian-santiago-music.png"));
    const bytes = await generateQuotePdf({ quoteNumber: quote.quote_number, clientName: client.name, clientPhone: client.phone, occasion: revision.occasion, eventDate: revision.event_date, startsAt: revision.starts_at, venue: revision.venue, address: revision.address, expiresOn: revision.expires_on, generalConditions: revision.general_conditions, options: (options ?? []).map((option) => ({ optionNumber: option.option_number, name: option.name, priceCop: option.price_cop, halfTandaUnits: option.half_tanda_units, breakMinutes: option.break_minutes, requiredAdvanceCop: option.required_advance_cop, customerConditions: option.customer_conditions })), logoBytes });
    const filename = `Cotizacion-COT-${String(quote.quote_number).padStart(6, "0")}.pdf`;
    return new Response(Buffer.from(bytes), { headers: { "Cache-Control": "private, no-store", "Content-Disposition": `attachment; filename="${filename}"`, "Content-Type": "application/pdf" } });
  } catch {
    return new Response("No fue posible generar el PDF", { status: 500 });
  }
}
