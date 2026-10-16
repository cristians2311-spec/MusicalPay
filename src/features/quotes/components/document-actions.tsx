"use client";

import Link from "next/link";
import { useState } from "react";

export function DocumentActions({ quoteId, quoteNumber, title }: { quoteId: number; quoteNumber: number; title: string }) {
  const [message, setMessage] = useState("");
  const [sharing, setSharing] = useState(false);
  const pdfUrl = `/api/cotizaciones/${quoteId}/pdf`;

  function downloadPdf(showConfirmation = true) {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `Cotizacion-COT-${String(quoteNumber).padStart(6, "0")}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    if (showConfirmation) setMessage("La descarga del PDF comenzó.");
  }

  async function shareDocument() {
    setSharing(true);
    setMessage("Preparando el PDF para compartir…");
    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error("pdf");
      const blob = await response.blob();
      const file = new File([blob], `Cotizacion-COT-${String(quoteNumber).padStart(6, "0")}.pdf`, { type: "application/pdf" });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        setMessage("Elige una aplicación para enviar el PDF.");
        await navigator.share({ files: [file], title, text: "Cotización de Cristian Santiago Music" });
        setMessage("Documento compartido.");
        return;
      }
      downloadPdf(false);
      setMessage("Este navegador no permite compartir archivos. El PDF fue descargado para que puedas enviarlo.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setMessage("No se compartió el archivo.");
        return;
      }
      setMessage("No fue posible compartir el archivo. Puedes descargarlo y enviarlo manualmente.");
    } finally {
      setSharing(false);
    }
  }
  return <div aria-busy={sharing} className="document-actions"><Link className="text-link" href={`/cotizaciones/${quoteId}`}>Volver</Link><button className="secondary-button" disabled={sharing} onClick={() => downloadPdf()} type="button">Descargar PDF</button><button className="primary-button" disabled={sharing} onClick={shareDocument} type="button">{sharing ? "Preparando…" : "Compartir PDF"}</button>{message ? <p aria-live="polite" className="action-message" role="status">{message}</p> : null}</div>;
}
