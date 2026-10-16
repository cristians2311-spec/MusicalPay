import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import { optionalDisplayText } from "./domain";

type QuotePdfOption = {
  optionNumber: number;
  name: string;
  priceCop: number;
  halfTandaUnits: number;
  breakMinutes: number;
  requiredAdvanceCop: number | null;
  customerConditions: string | null;
};

export type QuotePdfData = {
  quoteNumber: number;
  clientName: string;
  clientPhone: string | null;
  occasion: string;
  eventDate: string;
  startsAt: string | null;
  venue: string;
  address: string | null;
  expiresOn: string | null;
  generalConditions: string | null;
  options: QuotePdfOption[];
  logoBytes?: Uint8Array;
};

const pageSize: [number, number] = [595.28, 841.89];
const ink = rgb(0.12, 0.13, 0.14);
const muted = rgb(0.39, 0.38, 0.35);
const accent = rgb(0.60, 0.36, 0.13);
const line = rgb(0.86, 0.84, 0.80);
const paper = rgb(0.99, 0.98, 0.96);

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) current = candidate;
    else { if (current) lines.push(current); current = word; }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function drawWrapped(page: PDFPage, text: string, x: number, y: number, width: number, font: PDFFont, size: number, color = ink, lineHeight = size * 1.35) {
  const lines = wrapText(text, font, size, width);
  lines.forEach((lineText, index) => page.drawText(lineText, { x, y: y - index * lineHeight, size, font, color }));
  return y - lines.length * lineHeight;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeZone: "America/Bogota" }).format(new Date(`${date}T12:00:00`));
}

function formatTime(timestamp: string | null) {
  if (!timestamp) return "Por acordar";
  return new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Bogota" }).format(new Date(timestamp));
}

function formatCop(amount: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(amount).replace(/\u00a0/g, " ");
}

export async function generateQuotePdf(data: QuotePdfData) {
  const document = await PDFDocument.create();
  document.setTitle(`Cotización COT-${String(data.quoteNumber).padStart(6, "0")}`);
  document.setAuthor("Cristian Santiago Music");
  document.setCreator("MusicalPay");
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const logo = data.logoBytes ? await document.embedPng(data.logoBytes) : null;
  let page = document.addPage(pageSize);
  let y = 770;

  function addPage() {
    page = document.addPage(pageSize);
    page.drawRectangle({ x: 0, y: 0, width: pageSize[0], height: pageSize[1], color: paper });
    y = 780;
  }
  page.drawRectangle({ x: 0, y: 0, width: pageSize[0], height: pageSize[1], color: paper });
  if (logo) page.drawImage(logo, { x: 48, y: 744, width: 58, height: 58 });
  page.drawText("CRISTIAN SANTIAGO MUSIC", { x: 120, y: 786, size: 8, font: bold, color: accent });
  page.drawText("Cotización", { x: 120, y: 758, size: 25, font: bold, color: ink });
  const quoteCode = `COT-${String(data.quoteNumber).padStart(6, "0")}`;
  page.drawText(quoteCode, { x: 500 - bold.widthOfTextAtSize(quoteCode, 11), y: 776, size: 11, font: bold, color: ink });
  y = 705;
  page.drawText("PREPARADA PARA", { x: 48, y, size: 8, font: bold, color: accent });
  y -= 28;
  y = drawWrapped(page, data.clientName, 48, y, 499, bold, 20);
  if (data.clientPhone) { page.drawText(data.clientPhone, { x: 48, y: y - 2, size: 10, font: regular, color: muted }); y -= 24; }
  y -= 10;
  page.drawLine({ start: { x: 48, y }, end: { x: 547, y }, thickness: 1, color: line });
  y -= 28;

  const address = optionalDisplayText(data.address);
  const facts = [
    ["EVENTO", data.occasion], ["FECHA", formatDate(data.eventDate)],
    ["HORA", formatTime(data.startsAt)], ["LUGAR", `${data.venue}${address ? ` - ${address}` : ""}`],
  ];
  facts.forEach(([label, value], index) => {
    const x = index % 2 === 0 ? 48 : 305;
    const rowY = y - Math.floor(index / 2) * 62;
    page.drawText(label, { x, y: rowY, size: 8, font: bold, color: accent });
    drawWrapped(page, value, x, rowY - 17, 230, bold, 10, ink, 13);
  });
  y -= 145;
  page.drawText("OPCIONES", { x: 48, y, size: 8, font: bold, color: accent });
  y -= 25;

  for (const option of data.options) {
    const conditions = option.customerConditions ? wrapText(option.customerConditions, regular, 9, 455) : [];
    const cardHeight = 88 + conditions.length * 12;
    if (y - cardHeight < 90) { addPage(); page.drawText("OPCIONES (continuación)", { x: 48, y, size: 8, font: bold, color: accent }); y -= 25; }
    page.drawRectangle({ x: 48, y: y - cardHeight, width: 499, height: cardHeight, borderColor: line, borderWidth: 1, color: rgb(1, 1, 1) });
    page.drawText(`OPCIÓN ${option.optionNumber}`, { x: 64, y: y - 20, size: 7, font: bold, color: accent });
    page.drawText(option.name, { x: 64, y: y - 42, size: 14, font: bold, color: ink });
    const price = formatCop(option.priceCop);
    page.drawText(price, { x: 531 - bold.widthOfTextAtSize(price, 13), y: y - 34, size: 13, font: bold, color: ink });
    page.drawText(`${option.halfTandaUnits / 2} tanda(s) - ${option.breakMinutes} min de descanso`, { x: 64, y: y - 61, size: 9, font: regular, color: muted });
    const advance = option.requiredAdvanceCop ? `Anticipo: ${formatCop(option.requiredAdvanceCop)}` : "Sin anticipo obligatorio";
    page.drawText(advance, { x: 64, y: y - 76, size: 8, font: bold, color: muted });
    conditions.forEach((text, index) => page.drawText(text, { x: 64, y: y - 94 - index * 12, size: 9, font: regular, color: muted }));
    y -= cardHeight + 14;
  }

  if (data.generalConditions) {
    const lines = wrapText(data.generalConditions, regular, 9, 499);
    if (y - lines.length * 12 < 80) addPage();
    page.drawText("CONDICIONES", { x: 48, y, size: 8, font: bold, color: accent });
    y -= 20;
    y = drawWrapped(page, data.generalConditions, 48, y, 499, regular, 9, muted, 12);
  }
  const expires = data.expiresOn ? formatDate(data.expiresOn) : "según lo acordado";
  for (const currentPage of document.getPages()) {
    currentPage.drawLine({ start: { x: 48, y: 54 }, end: { x: 547, y: 54 }, thickness: 1, color: line });
    currentPage.drawText(`Válida hasta el ${expires}`, { x: 48, y: 36, size: 8, font: regular, color: muted });
    currentPage.drawText("Cristian Santiago Music", { x: 547 - bold.widthOfTextAtSize("Cristian Santiago Music", 8), y: 36, size: 8, font: bold, color: ink });
  }
  return document.save();
}
