import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { caricaDati } from "@/lib/dati";
import { Elimina, FormGlicemia, FormPressione } from "@/components/form-salute";
import { GraficoLinee } from "@/components/grafici";
import { Titolo } from "@/components/ui";
import { giornoDi } from "@/lib/date";

const quando = (ts: string) => format(parseISO(ts), "d MMM, HH:mm", { locale: it });

export default async function Salute() {
  const d = await caricaDati(await createClient(), 365);
  const { settings: s } = d;
  const pa = d.bp.map((b) => ({ data: giornoDi(b.misurata_il), sys: b.sistolica, dia: b.diastolica, bat: b.battiti }));
  const gly = d.glicemie.filter((g) => g.tipo === "digiuno").map((g) => ({ data: giornoDi(g.misurata_il), gly: g.mg_dl }));
  const fuoriPa = (sys: number, dia: number) => sys >= s.pa_sys_max || dia >= s.pa_dia_max || sys < s.pa_sys_min || dia < s.pa_dia_min;
  return (
    <div className="space-y-6">
      <Titolo sotto="Registra pressione e glicemia. Misura sempre alla stessa ora, da seduto e a riposo.">Salute</Titolo>
      <div className="grid gap-6 lg:grid-cols-2"><FormPressione /><FormGlicemia /></div>
      <div className="grid gap-6 xl:grid-cols-2">
        <GraficoLinee titolo="Pressione" sottotitolo="Linea rossa = limite massima" dati={pa} serie={[{ key: "sys", label: "Massima", colore: "var(--c4)" }, { key: "dia", label: "Minima", colore: "var(--c2)" }]} unita="mmHg" linee={[{ y: s.pa_sys_max, label: `${s.pa_sys_max}` }]} />
        <GraficoLinee titolo="Glicemia a digiuno" dati={gly} serie={[{ key: "gly", label: "Glicemia", colore: "var(--c1)" }]} unita="mg/dL" fascia={[s.glicemia_min, s.glicemia_max]} dominio={[60, "auto"]} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="h-section mb-2">Ultime misure di pressione</h2>
          {d.bp.length === 0 && <p className="text-lg text-muted">Nessuna misura.</p>}
          <ul className="divide-y divide-line">
            {[...d.bp].reverse().slice(0, 12).map((b) => (
              <li key={b.id} className="flex items-center gap-3 py-2.5">
                <div className="flex-1">
                  <p className={`text-xl font-bold tabular-nums ${fuoriPa(b.sistolica, b.diastolica) ? "text-bad" : ""}`}>{b.sistolica}/{b.diastolica} <span className="text-base font-normal text-muted">{b.battiti ? `· ${b.battiti} bpm` : ""}</span></p>
                  <p className="text-sm text-muted">{quando(b.misurata_il)}</p>
                </div>
                <Elimina tabella="peso_bp_readings" id={b.id} />
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <h2 className="h-section mb-2">Ultime glicemie</h2>
          {d.glicemie.length === 0 && <p className="text-lg text-muted">Nessuna misura.</p>}
          <ul className="divide-y divide-line">
            {[...d.glicemie].reverse().slice(0, 12).map((g) => (
              <li key={g.id} className="flex items-center gap-3 py-2.5">
                <div className="flex-1">
                  <p className={`text-xl font-bold tabular-nums ${g.tipo === "digiuno" && (g.mg_dl < s.glicemia_min || g.mg_dl > s.glicemia_max) ? "text-bad" : ""}`}>{g.mg_dl} <span className="text-base font-normal text-muted">mg/dL · {g.tipo === "digiuno" ? "a digiuno" : g.tipo === "post_pasto" ? "dopo il pasto" : "altro"}</span></p>
                  <p className="text-sm text-muted">{quando(g.misurata_il)}</p>
                </div>
                <Elimina tabella="peso_glucose_readings" id={g.id} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
