"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Droplets, Minus, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { DailyLog } from "@/lib/types";

const FACCE = ["😣", "🙁", "😐", "🙂", "😄"];

function Scala({ valore, onChange, etichette }: { valore: number | null; onChange: (v: number) => void; etichette: [string, string] }) {
  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {FACCE.map((f, i) => (
          <button key={i} type="button" aria-label={`${i + 1} su 5`} aria-pressed={valore === i + 1} onClick={() => onChange(i + 1)}
            className={`grid h-16 place-items-center rounded-2xl border-2 text-3xl transition active:scale-95 ${valore === i + 1 ? "border-brand bg-brandsoft" : "border-line bg-card2"}`}>{f}</button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-sm text-muted"><span>{etichette[0]}</span><span>{etichette[1]}</span></div>
    </div>
  );
}

function Si({ valore, onChange, testo }: { valore: boolean | null; onChange: (v: boolean) => void; testo: string }) {
  return (
    <div>
      <p className="label">{testo}</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => onChange(true)} aria-pressed={valore === true} className={`min-h-14 rounded-2xl border-2 text-lg font-bold ${valore === true ? "border-ok bg-ok/15 text-ok" : "border-line bg-card2 text-muted"}`}>Sì</button>
        <button type="button" onClick={() => onChange(false)} aria-pressed={valore === false} className={`min-h-14 rounded-2xl border-2 text-lg font-bold ${valore === false ? "border-bad bg-bad/15 text-bad" : "border-line bg-card2 text-muted"}`}>No</button>
      </div>
    </div>
  );
}

const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));

export function FormOggi({ data, iniziale, userId, ultimoPeso }: { data: string; iniziale: DailyLog | null; userId: string; ultimoPeso: number | null }) {
  const router = useRouter();
  const [peso, setPeso] = useState(iniziale?.peso_kg?.toString() ?? "");
  const [vita, setVita] = useState(iniziale?.vita_cm?.toString() ?? "");
  const [acqua, setAcqua] = useState(iniziale?.acqua_ml ?? 0);
  const [energia, setEnergia] = useState(iniziale?.energia ?? null);
  const [fame, setFame] = useState(iniziale?.fame ?? null);
  const [sonno, setSonno] = useState(iniziale?.sonno_ore?.toString() ?? "");
  const [passi, setPassi] = useState(iniziale?.passi?.toString() ?? "");
  const [dieta, setDieta] = useState(iniziale?.dieta_rispettata ?? null);
  const [digiuno, setDigiuno] = useState(iniziale?.digiuno_rispettato ?? null);
  const [note, setNote] = useState(iniziale?.note ?? "");
  const [stato, setStato] = useState<"idle" | "salvo" | "ok" | "errore">("idle");
  const [msg, setMsg] = useState("");

  async function salva(e: React.FormEvent) {
    e.preventDefault();
    setStato("salvo");
    const { error } = await createClient().from("peso_daily_logs").upsert(
      {
        user_id: userId, data,
        peso_kg: num(peso), vita_cm: num(vita), acqua_ml: acqua, energia, fame,
        sonno_ore: num(sonno), passi: num(passi) == null ? null : Math.round(num(passi)!),
        dieta_rispettata: dieta, digiuno_rispettato: digiuno, note: note.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,data" },
    );
    if (error) { setStato("errore"); setMsg("Non sono riuscito a salvare. Controlla i numeri e riprova."); return; }
    setStato("ok");
    router.refresh();
    setTimeout(() => setStato("idle"), 2500);
  }

  return (
    <form onSubmit={salva} className="space-y-5 pb-4">
      <div className="grid gap-5 sm:grid-cols-2">
        <section className="card space-y-5">
          <div>
            <label className="label" htmlFor="peso">Peso (kg)</label>
            <input id="peso" className="input !text-3xl !font-bold" inputMode="decimal" placeholder={ultimoPeso ? ultimoPeso.toFixed(1) : "0,0"} value={peso} onChange={(e) => setPeso(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="vita">Vita (cm)</label>
            <input id="vita" className="input" inputMode="decimal" placeholder="es. 104" value={vita} onChange={(e) => setVita(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="sonno">Sonno (ore)</label>
              <input id="sonno" className="input" inputMode="decimal" placeholder="es. 7,5" value={sonno} onChange={(e) => setSonno(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="passi">Passi</label>
              <input id="passi" className="input" inputMode="numeric" placeholder="es. 6000" value={passi} onChange={(e) => setPassi(e.target.value)} />
            </div>
          </div>
        </section>

        <section className="card space-y-4">
          <div className="flex items-center gap-3 text-brand"><Droplets className="size-7" /><h2 className="h-section text-ink">Acqua</h2></div>
          <p className="text-5xl font-bold tabular-nums tracking-tight">{(acqua / 1000).toFixed(2).replace(".", ",")} <span className="text-2xl text-muted">litri</span></p>
          <div className="grid grid-cols-3 gap-2">
            {[250, 500, 1000].map((ml) => (
              <button key={ml} type="button" onClick={() => setAcqua((a) => a + ml)} className="btn-ghost !min-h-14 !px-2"><Plus className="size-5" />{ml >= 1000 ? "1 L" : `${ml} ml`}</button>
            ))}
          </div>
          <button type="button" onClick={() => setAcqua((a) => Math.max(0, a - 250))} className="btn-ghost w-full !min-h-12 !text-base"><Minus className="size-5" />Togli 250 ml</button>
        </section>
      </div>

      <section className="card space-y-6">
        <div><p className="label">Come ti senti di energia?</p><Scala valore={energia} onChange={setEnergia} etichette={["Esausto", "Pieno di energia"]} /></div>
        <div><p className="label">Quanta fame hai avuto?</p><Scala valore={fame} onChange={setFame} etichette={["Nessuna", "Tantissima"]} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Si valore={dieta} onChange={setDieta} testo="Dieta rispettata?" />
          <Si valore={digiuno} onChange={setDigiuno} testo="Digiuno rispettato (niente cena)?" />
        </div>
        <div>
          <label className="label" htmlFor="note">Note</label>
          <textarea id="note" rows={3} className="input !py-3" placeholder="Come è andata la giornata…" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </section>

      {stato === "errore" && <p role="alert" className="rounded-2xl bg-badsoft p-3 text-base text-bad">{msg}</p>}
      <button className="btn sticky bottom-24 w-full shadow-xl lg:static lg:shadow-none" disabled={stato === "salvo"}>
        {stato === "ok" ? <><Check className="size-6" />Salvato</> : stato === "salvo" ? "Salvo…" : "Salva la giornata"}
      </button>
    </form>
  );
}
