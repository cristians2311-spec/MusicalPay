"use client";

export function DocumentActions({ title }: { title: string }) {
  async function shareDocument() {
    if (navigator.share) await navigator.share({ title, text: "Cotización de Cristian Santiago Music", url: window.location.href });
    else await navigator.clipboard.writeText(window.location.href);
  }
  return <div className="document-actions"><button className="secondary-button" onClick={() => window.print()} type="button">Guardar como PDF</button><button className="primary-button" onClick={shareDocument} type="button">Compartir</button></div>;
}
