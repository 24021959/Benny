"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

export function RiassuntoIA() {
  const [testo, setTesto] = useState("");
  const [errore, setErrore] = useState("");
  const [attesa, setAttesa] = useState(false);
  async function genera() {
    setAttesa(true); setErrore(""); setTesto("");
    try {
      const r = await fetch("/api/riassunto", { method: "POST" });
      const j = await r.json();
      if (!r.ok) setErrore(j.errore ?? "Errore");
      else setTesto(j.testo);
    } catch { setErrore("Connessione assente. Riprova."); }
    setAttesa(false);
  }
  return (
    <section className="card">
      <div className="mb-2 flex items-center gap-3 text-brand"><Sparkles className="size-7" /><h2 className="h-section text-ink">Riassunto della settimana</h2></div>
      <p className="mb-4 text-base text-muted">Scritto dall&apos;intelligenza artificiale. Riceve solo medie numeriche, nessun nome né dato personale.</p>
      {testo && <p className="mb-4 whitespace-pre-line rounded-2xl bg-brandsoft p-4 text-lg leading-relaxed">{testo}</p>}
      {errore && <p role="alert" className="mb-4 rounded-2xl bg-warnsoft p-3 text-base">{errore}</p>}
      <button onClick={genera} disabled={attesa} className="btn w-full sm:w-auto">{attesa ? "Sto scrivendo…" : testo ? "Rigenera" : "Genera il riassunto"}</button>
    </section>
  );
}
