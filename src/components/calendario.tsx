import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { aggiungiGiorni, lunediDellaSettimana, oggi } from "@/lib/date";
import type { DailyLog } from "@/lib/types";

/** Ultime 6 settimane, una cella per giorno: verde = dieta e digiuno rispettati. */
export function CalendarioAderenza({ logs }: { logs: DailyLog[] }) {
  const mappa = new Map(logs.map((l) => [l.data, l]));
  const fine = oggi();
  const inizio = lunediDellaSettimana(aggiungiGiorni(fine, -35));
  const giorni = Array.from({ length: 42 }, (_, i) => aggiungiGiorni(inizio, i));
  const stato = (g: string) => {
    if (g > fine) return "futuro";
    const l = mappa.get(g);
    if (!l || l.dieta_rispettata == null) return "vuoto";
    if (l.dieta_rispettata && l.digiuno_rispettato) return "ok";
    if (l.dieta_rispettata || l.digiuno_rispettato) return "parziale";
    return "no";
  };
  const colori: Record<string, string> = {
    ok: "bg-ok text-white",
    parziale: "bg-warn text-white",
    no: "bg-bad text-white",
    vuoto: "bg-card2 text-muted border border-line",
    futuro: "opacity-30 bg-card2 text-muted",
  };
  const settimane = ["L", "M", "M", "G", "V", "S", "D"];
  return (
    <section className="card">
      <h2 className="h-section">Calendario dell&apos;aderenza</h2>
      <p className="mb-4 text-base text-muted">Dieta e digiuno rispettati negli ultimi 42 giorni</p>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {settimane.map((d, i) => <div key={i} className="text-center text-sm font-semibold text-muted">{d}</div>)}
        {giorni.map((g) => (
          <div key={g} title={format(parseISO(g), "EEEE d MMMM", { locale: it })}
            className={`grid aspect-square place-items-center rounded-xl text-sm font-semibold sm:text-base ${colori[stato(g)]} ${g === fine ? "ring-2 ring-brand ring-offset-2 ring-offset-card" : ""}`}>
            {format(parseISO(g), "d")}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
        <span><i className="mr-1.5 inline-block size-3 rounded bg-ok" />Tutto rispettato</span>
        <span><i className="mr-1.5 inline-block size-3 rounded bg-warn" />Solo in parte</span>
        <span><i className="mr-1.5 inline-block size-3 rounded bg-bad" />Non rispettato</span>
      </div>
    </section>
  );
}
