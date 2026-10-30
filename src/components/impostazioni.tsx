"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Medication, Reminder, Settings } from "@/lib/types";

const CAMPI: { k: keyof Settings; label: string; tipo?: string; step?: string; sezione: string }[] = [
  { k: "nome", label: "Nome", tipo: "text", sezione: "Profilo" },
  { k: "data_nascita", label: "Data di nascita", tipo: "date", sezione: "Profilo" },
  { k: "altezza_cm", label: "Altezza (cm)", step: "0.1", sezione: "Profilo" },
  { k: "peso_iniziale_kg", label: "Peso di partenza (kg)", step: "0.1", sezione: "Obiettivo" },
  { k: "data_inizio", label: "Data di inizio", tipo: "date", sezione: "Obiettivo" },
  { k: "obiettivo_min_kg", label: "Obiettivo minimo (kg)", step: "0.1", sezione: "Obiettivo" },
  { k: "obiettivo_max_kg", label: "Obiettivo massimo (kg)", step: "0.1", sezione: "Obiettivo" },
  { k: "pasti_inizio", label: "Primo pasto (ora)", tipo: "time", sezione: "Giornata" },
  { k: "pasti_fine", label: "Ultimo pasto (ora)", tipo: "time", sezione: "Giornata" },
  { k: "acqua_obiettivo_ml", label: "Acqua al giorno (ml)", step: "50", sezione: "Giornata" },
  { k: "passi_obiettivo", label: "Passi al giorno", step: "500", sezione: "Giornata" },
  { k: "max_calo_settimanale_kg", label: "Calo massimo a settimana (kg)", step: "0.1", sezione: "Soglie di sicurezza (da concordare col medico)" },
  { k: "pa_sys_max", label: "Pressione massima: limite alto", step: "1", sezione: "Soglie di sicurezza (da concordare col medico)" },
  { k: "pa_dia_max", label: "Pressione minima: limite alto", step: "1", sezione: "Soglie di sicurezza (da concordare col medico)" },
  { k: "pa_sys_min", label: "Pressione massima: limite basso", step: "1", sezione: "Soglie di sicurezza (da concordare col medico)" },
  { k: "pa_dia_min", label: "Pressione minima: limite basso", step: "1", sezione: "Soglie di sicurezza (da concordare col medico)" },
  { k: "glicemia_min", label: "Glicemia a digiuno: minimo", step: "1", sezione: "Soglie di sicurezza (da concordare col medico)" },
  { k: "glicemia_max", label: "Glicemia a digiuno: massimo", step: "1", sezione: "Soglie di sicurezza (da concordare col medico)" },
  { k: "email_promemoria", label: "Email per i promemoria", tipo: "email", sezione: "Promemoria" },
];

export function FormImpostazioni({ s }: { s: Settings }) {
  const router = useRouter();
  const [v, setV] = useState<Record<string, string>>(() => Object.fromEntries(CAMPI.map((c) => [c.k, String(s[c.k] ?? "").slice(0, c.tipo === "time" ? 5 : 99)])));
  const [stato, setStato] = useState<"idle" | "salvo" | "ok" | "errore">("idle");

  async function salva(e: React.FormEvent) {
    e.preventDefault();
    setStato("salvo");
    const payload: Record<string, string | number | null> = {};
    for (const c of CAMPI) {
      const raw = v[c.k]?.trim() ?? "";
      payload[c.k] = raw === "" ? null : c.tipo === "text" || c.tipo === "date" || c.tipo === "time" || c.tipo === "email" ? raw : Number(raw.replace(",", "."));
    }
    for (const k of ["altezza_cm", "peso_iniziale_kg", "data_inizio", "obiettivo_min_kg", "obiettivo_max_kg", "pasti_inizio", "pasti_fine"]) if (payload[k] == null) delete payload[k];
    const { error } = await createClient().from("peso_settings").update({ ...payload, updated_at: new Date().toISOString() }).eq("user_id", s.user_id);
    setStato(error ? "errore" : "ok");
    if (!error) router.refresh();
    setTimeout(() => setStato("idle"), 2500);
  }

  const sezioni = [...new Set(CAMPI.map((c) => c.sezione))];
  return (
    <form onSubmit={salva} className="space-y-5">
      {sezioni.map((sez) => (
        <section key={sez} className="card">
          <h2 className="h-section mb-4">{sez}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {CAMPI.filter((c) => c.sezione === sez).map((c) => (
              <div key={c.k}>
                <label className="label" htmlFor={c.k}>{c.label}</label>
                <input id={c.k} className="input" type={c.tipo === "time" || c.tipo === "date" || c.tipo === "email" || c.tipo === "text" ? c.tipo : "text"} inputMode={c.step ? "decimal" : undefined} value={v[c.k]} onChange={(e) => setV({ ...v, [c.k]: e.target.value })} />
              </div>
            ))}
          </div>
        </section>
      ))}
      {stato === "errore" && <p role="alert" className="rounded-2xl bg-badsoft p-3 text-base text-bad">Non sono riuscito a salvare. Controlla i valori.</p>}
      <button className="btn w-full sm:w-auto" disabled={stato === "salvo"}>{stato === "ok" ? <><Check className="size-6" />Salvato</> : stato === "salvo" ? "Salvo…" : "Salva impostazioni"}</button>
    </form>
  );
}

export function Farmaci({ farmaci }: { farmaci: Medication[] }) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [dose, setDose] = useState("");
  async function aggiungi(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    await createClient().from("peso_medications").insert({ nome: nome.trim(), dose: dose.trim() || null });
    setNome(""); setDose(""); router.refresh();
  }
  async function rimuovi(id: string) {
    if (!confirm("Rimuovere questo farmaco?")) return;
    await createClient().from("peso_medications").delete().eq("id", id); router.refresh();
  }
  return (
    <section className="card">
      <h2 className="h-section">Farmaci</h2>
      <p className="mb-4 text-base text-muted">Compaiono nel report per il medico.</p>
      <ul className="mb-4 divide-y divide-line">
        {farmaci.map((f) => (
          <li key={f.id} className="flex items-center gap-3 py-2"><span className="flex-1 text-lg font-semibold">{f.nome}<span className="font-normal text-muted">{f.dose ? ` · ${f.dose}` : ""}</span></span>
            <button aria-label="Rimuovi" onClick={() => rimuovi(f.id)} className="grid size-11 place-items-center rounded-xl text-muted hover:bg-badsoft hover:text-bad"><Trash2 className="size-5" /></button></li>
        ))}
        {farmaci.length === 0 && <li className="py-2 text-lg text-muted">Nessun farmaco inserito.</li>}
      </ul>
      <form onSubmit={aggiungi} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input aria-label="Nome del farmaco" className="input" placeholder="Es. Xarelto" value={nome} onChange={(e) => setNome(e.target.value)} />
        <input aria-label="Dose" className="input" placeholder="Dose (es. 20 mg la sera)" value={dose} onChange={(e) => setDose(e.target.value)} />
        <button className="btn"><Plus className="size-5" />Aggiungi</button>
      </form>
    </section>
  );
}

const TIPI: Record<Reminder["tipo"], string> = {
  peso: "Pesarsi", acqua: "Bere acqua", pasto: "Colazione e pranzo", pressione: "Misurare la pressione", glicemia: "Misurare la glicemia",
  digiuno: "Inizio digiuno", esami: "Esami del sangue", farmaco: "Prendere il farmaco",
};

export function Promemoria({ promemoria }: { promemoria: Reminder[] }) {
  const router = useRouter();
  const [tipo, setTipo] = useState<Reminder["tipo"]>("peso");
  const [ora, setOra] = useState("07:30");
  async function aggiungi(e: React.FormEvent) {
    e.preventDefault();
    await createClient().from("peso_reminders").insert({ tipo, ora });
    router.refresh();
  }
  async function interruttore(r: Reminder) {
    await createClient().from("peso_reminders").update({ attivo: !r.attivo }).eq("id", r.id); router.refresh();
  }
  async function rimuovi(id: string) {
    await createClient().from("peso_reminders").delete().eq("id", id); router.refresh();
  }
  return (
    <section className="card">
      <h2 className="h-section">Promemoria via email</h2>
      <p className="mb-4 text-base text-muted">Ricevi una email ogni mattina con i promemoria del giorno. Imposta l&apos;indirizzo qui sopra, in &quot;Promemoria&quot;.</p>
      <ul className="mb-4 divide-y divide-line">
        {promemoria.map((r) => (
          <li key={r.id} className="flex items-center gap-3 py-2">
            <span className={`flex-1 text-lg font-semibold ${r.attivo ? "" : "text-muted line-through"}`}>{TIPI[r.tipo]} <span className="font-normal text-muted">· {r.ora.slice(0, 5)}</span></span>
            <button onClick={() => interruttore(r)} aria-pressed={r.attivo} className={`min-h-11 rounded-xl px-4 text-base font-semibold ${r.attivo ? "bg-brandsoft text-brand" : "bg-card2 text-muted"}`}>{r.attivo ? "Attivo" : "Spento"}</button>
            <button aria-label="Rimuovi" onClick={() => rimuovi(r.id)} className="grid size-11 place-items-center rounded-xl text-muted hover:bg-badsoft hover:text-bad"><Trash2 className="size-5" /></button>
          </li>
        ))}
        {promemoria.length === 0 && <li className="py-2 text-lg text-muted">Nessun promemoria.</li>}
      </ul>
      <form onSubmit={aggiungi} className="grid gap-3 sm:grid-cols-[1fr_9rem_auto]">
        <select aria-label="Cosa ricordare" className="input" value={tipo} onChange={(e) => setTipo(e.target.value as Reminder["tipo"])}>
          {Object.entries(TIPI).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <input aria-label="Ora" type="time" className="input" value={ora} onChange={(e) => setOra(e.target.value)} />
        <button className="btn"><Plus className="size-5" />Aggiungi</button>
      </form>
    </section>
  );
}
