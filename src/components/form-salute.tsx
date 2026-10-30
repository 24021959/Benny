"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeartPulse, Droplet, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function FormPressione() {
  const router = useRouter();
  const [sys, setSys] = useState("");
  const [dia, setDia] = useState("");
  const [bat, setBat] = useState("");
  const [err, setErr] = useState("");
  const [attesa, setAttesa] = useState(false);
  async function salva(e: React.FormEvent) {
    e.preventDefault();
    setAttesa(true); setErr("");
    const { error } = await createClient().from("peso_bp_readings").insert({
      sistolica: Number(sys), diastolica: Number(dia), battiti: bat ? Number(bat) : null,
    });
    setAttesa(false);
    if (error) return setErr("Valori non validi. Controlla i numeri.");
    setSys(""); setDia(""); setBat("");
    router.refresh();
  }
  return (
    <form onSubmit={salva} className="card space-y-4">
      <div className="flex items-center gap-3 text-brand"><HeartPulse className="size-7" /><h2 className="h-section text-ink">Nuova misura di pressione</h2></div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className="label" htmlFor="sys">Massima</label><input id="sys" required inputMode="numeric" className="input" placeholder="120" value={sys} onChange={(e) => setSys(e.target.value)} /></div>
        <div><label className="label" htmlFor="dia">Minima</label><input id="dia" required inputMode="numeric" className="input" placeholder="80" value={dia} onChange={(e) => setDia(e.target.value)} /></div>
        <div><label className="label" htmlFor="bat">Battiti</label><input id="bat" inputMode="numeric" className="input" placeholder="70" value={bat} onChange={(e) => setBat(e.target.value)} /></div>
      </div>
      {err && <p role="alert" className="text-base text-bad">{err}</p>}
      <button className="btn w-full" disabled={attesa}>{attesa ? "Salvo…" : "Salva pressione"}</button>
    </form>
  );
}

export function FormGlicemia() {
  const router = useRouter();
  const [val, setVal] = useState("");
  const [tipo, setTipo] = useState<"digiuno" | "post_pasto" | "altro">("digiuno");
  const [err, setErr] = useState("");
  const [attesa, setAttesa] = useState(false);
  async function salva(e: React.FormEvent) {
    e.preventDefault();
    setAttesa(true); setErr("");
    const { error } = await createClient().from("peso_glucose_readings").insert({ mg_dl: Number(val), tipo });
    setAttesa(false);
    if (error) return setErr("Valore non valido.");
    setVal("");
    router.refresh();
  }
  return (
    <form onSubmit={salva} className="card space-y-4">
      <div className="flex items-center gap-3 text-brand"><Droplet className="size-7" /><h2 className="h-section text-ink">Nuova glicemia</h2></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label" htmlFor="gly">mg/dL</label><input id="gly" required inputMode="numeric" className="input" placeholder="95" value={val} onChange={(e) => setVal(e.target.value)} /></div>
        <div>
          <label className="label" htmlFor="tipo">Quando</label>
          <select id="tipo" className="input" value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}>
            <option value="digiuno">A digiuno</option><option value="post_pasto">Dopo il pasto</option><option value="altro">Altro</option>
          </select>
        </div>
      </div>
      {err && <p role="alert" className="text-base text-bad">{err}</p>}
      <button className="btn w-full" disabled={attesa}>{attesa ? "Salvo…" : "Salva glicemia"}</button>
    </form>
  );
}

export function Elimina({ tabella, id }: { tabella: string; id: string }) {
  const router = useRouter();
  return (
    <button aria-label="Elimina" className="grid size-11 place-items-center rounded-xl text-muted hover:bg-badsoft hover:text-bad"
      onClick={async () => { if (!confirm("Eliminare questa misura?")) return; await createClient().from(tabella).delete().eq("id", id); router.refresh(); }}>
      <Trash2 className="size-5" />
    </button>
  );
}
