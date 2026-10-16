import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import { getQuotePresentationLabels, optionalDisplayText } from "./domain";

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
const white = rgb(1, 1, 1);
const warm = rgb(0.94, 0.76, 0.52);

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
  let y: number;

  function drawBackground(target: PDFPage) {
    target.drawRectangle({ x: 0, y: 0, width: pageSize[0], height: pageSize[1], color: paper });
    target.drawRectangle({ x: 0, y: pageSize[1] - 6, width: pageSize[0], height: 6, color: accent });
  }

  function addPage(title = "Detalles de la cotización") {
    page = document.addPage(pageSize);
    drawBackground(page);
    page.drawText("CRISTIAN SANTIAGO MUSIC", { x: 40, y: 785, size: 8, font: bold, color: accent });
    page.drawText(title, { x: 40, y: 754, size: 22, font: bold, color: ink });
    page.drawLine({ start: { x: 40, y: 732 }, end: { x: 555, y: 732 }, thickness: 1, color: line });
    y = 700;
  }

  drawBackground(page);
  if (logo) page.drawImage(logo, { x: 40, y: 738, width: 72, height: 72 });
  page.drawText("CRISTIAN SANTIAGO MUSIC", { x: 126, y: 792, size: 8, font: bold, color: accent });
  page.drawText("Cotización", { x: 126, y: 754, size: 30, font: bold, color: ink });
  const quoteCode = `COT-${String(data.quoteNumber).padStart(6, "0")}`;
  page.drawText(quoteCode, { x: 555 - bold.widthOfTextAtSize(quoteCode, 11), y: 778, size: 11, font: bold, color: ink });
  page.drawLine({ start: { x: 40, y: 724 }, end: { x: 555, y: 724 }, thickness: 1, color: line });

  y = 696;
  page.drawText("PREPARADA PARA", { x: 40, y, size: 8, font: bold, color: accent });
  y = drawWrapped(page, data.clientName, 40, y - 28, 360, bold, 22);
  if (data.clientPhone) page.drawText(data.clientPhone, { x: 40, y: y - 2, size: 10, font: regular, color: muted });

  const address = optionalDisplayText(data.address);
  page.drawRectangle({ x: 40, y: 531, width: 245, height: 90, color: ink });
  page.drawText("FECHA", { x: 56, y: 598, size: 8, font: bold, color: warm });
  drawWrapped(page, formatDate(data.eventDate), 56, 574, 213, bold, 17, white, 20);
  page.drawRectangle({ x: 297, y: 531, width: 258, height: 90, color: white, borderColor: line, borderWidth: 1 });
  page.drawText("EVENTO", { x: 313, y: 598, size: 7, font: bold, color: accent });
  drawWrapped(page, data.occasion, 313, 581, 226, bold, 10, ink, 12);
  page.drawText("HORA", { x: 313, y: 553, size: 7, font: bold, color: accent });
  page.drawText(formatTime(data.startsAt), { x: 354, y: 551, size: 10, font: bold, color: ink });
  page.drawText("LUGAR", { x: 40, y: 506, size: 7, font: bold, color: accent });
  drawWrapped(page, `${data.venue}${address ? ` - ${address}` : ""}`, 92, 504, 463, bold, 10, ink, 12);

  const presentation = getQuotePresentationLabels(data.options.length);
  y = 466;
  page.drawText(presentation.sectionTitle.toUpperCase(), { x: 40, y, size: 11, font: bold, color: accent });
  y -= 22;
  const optionCount = Math.max(data.options.length, 1);
  const cardGap = 8;
  const availableHeight = 354;
  const cardHeight = optionCount === 1 ? 142 : Math.min(92, Math.max(66, Math.floor((availableHeight - (optionCount - 1) * cardGap) / optionCount)));

  for (const option of data.options) {
    const cardBottom = y - cardHeight;
    page.drawRectangle({ x: 40, y: cardBottom, width: 515, height: cardHeight, borderColor: line, borderWidth: 1, color: white });
    page.drawRectangle({ x: 40, y: cardBottom, width: presentation.showOptionNumber ? 4 : 6, height: cardHeight, color: accent });
    const left = presentation.showOptionNumber ? 56 : 62;
    if (presentation.showOptionNumber) page.drawText(`OPCIÓN ${option.optionNumber}`, { x: left, y: y - 16, size: 7, font: bold, color: accent });
    const nameY = presentation.showOptionNumber ? y - 34 : y - 38;
    const nameSize = presentation.showOptionNumber ? (cardHeight < 76 ? 11 : 13) : 18;
    drawWrapped(page, option.name, left, nameY, 286, bold, nameSize, ink, nameSize + 2);
    const detailY = presentation.showOptionNumber ? y - Math.min(cardHeight - 12, 53) : y - 66;
    page.drawText(`${option.halfTandaUnits / 2} tanda(s) - ${option.breakMinutes} min de descanso`, { x: left, y: detailY, size: presentation.showOptionNumber ? 8 : 10, font: regular, color: muted });
    const price = formatCop(option.priceCop);
    const priceSize = presentation.showOptionNumber ? (cardHeight < 76 ? 14 : 17) : 25;
    page.drawText("VALOR TOTAL", { x: 539 - bold.widthOfTextAtSize("VALOR TOTAL", 7), y: y - 18, size: 7, font: bold, color: accent });
    page.drawText(price, { x: 539 - bold.widthOfTextAtSize(price, priceSize), y: y - 42, size: priceSize, font: bold, color: ink });
    const advance = option.requiredAdvanceCop ? `Anticipo: ${formatCop(option.requiredAdvanceCop)}` : "Sin anticipo obligatorio";
    page.drawText(advance, { x: 539 - bold.widthOfTextAtSize(advance, 7), y: y - 58, size: 7, font: bold, color: muted });
    y = cardBottom - cardGap;
  }

  const detailBlocks = data.options.flatMap((option) => option.customerConditions ? [{ heading: presentation.showOptionNumber ? `Condiciones de la opción ${option.optionNumber}` : "Condiciones de la propuesta", text: option.customerConditions }] : []);
  if (data.generalConditions) detailBlocks.push({ heading: "Condiciones generales", text: data.generalConditions });
  for (const block of detailBlocks) {
    const lines = wrapText(block.text, regular, 9, 515);
    const requiredHeight = 24 + lines.length * 12;
    if (y - requiredHeight < 76) addPage("Condiciones");
    page.drawText(block.heading.toUpperCase(), { x: 40, y, size: 8, font: bold, color: accent });
    y -= 18;
    y = drawWrapped(page, block.text, 40, y, 515, regular, 9, muted, 12) - 10;
  }
  const expires = data.expiresOn ? formatDate(data.expiresOn) : "según lo acordado";
  for (const currentPage of document.getPages()) {
    currentPage.drawLine({ start: { x: 40, y: 54 }, end: { x: 555, y: 54 }, thickness: 1, color: line });
    currentPage.drawText(`Válida hasta el ${expires}`, { x: 40, y: 35, size: 8, font: regular, color: muted });
    currentPage.drawText("Cristian Santiago Music", { x: 555 - bold.widthOfTextAtSize("Cristian Santiago Music", 8), y: 35, size: 8, font: bold, color: ink });
  }
  return document.save();
}
