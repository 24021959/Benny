import { aggiungiGiorni, differenzaGiorni, oggi } from "./date";
import type { DailyLog, FastingSession, Settings } from "./types";

export const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export function bmi(kg: number, cm: number) {
  const m = cm / 100;
  return kg / (m * m);
}

export function categoriaBmi(v: number) {
  if (v < 18.5) return "Sottopeso";
  if (v < 25) return "Normopeso";
  if (v < 30) return "Sovrappeso";
  if (v < 35) return "Obesità 1° grado";
  return "Obesità 2° grado+";
}

export type PuntoPeso = { data: string; peso: number; media7: number };

/** Serie dei pesi con media mobile sui 7 giorni di calendario precedenti (incluso il giorno). */
export function seriePeso(logs: DailyLog[]): PuntoPeso[] {
  const conPeso = logs
    .filter((l) => l.peso_kg != null)
    .sort((a, b) => a.data.localeCompare(b.data));
  return conPeso.map((l) => {
    const finestra = conPeso.filter(
      (x) => x.data <= l.data && differenzaGiorni(l.data, x.data) < 7,
    );
    return { data: l.data, peso: Number(l.peso_kg), media7: round(mean(finestra.map((x) => Number(x.peso_kg))), 2) };
  });
}

export function pesoAttuale(serie: PuntoPeso[]) {
  return serie.length ? serie[serie.length - 1] : null;
}

export function media7Giorni(serie: PuntoPeso[], fine = oggi()) {
  const v = serie.filter((p) => differenzaGiorni(fine, p.data) >= 0 && differenzaGiorni(fine, p.data) < 7);
  return v.length ? round(mean(v.map((p) => p.peso)), 1) : null;
}

/** Variazione tra la media degli ultimi 7 giorni e quella dei 7 precedenti (kg, positivo = calo). */
export function caloSettimanale(serie: PuntoPeso[], fine = oggi()) {
  const a = serie.filter((p) => differenzaGiorni(fine, p.data) >= 0 && differenzaGiorni(fine, p.data) < 7);
  const b = serie.filter((p) => differenzaGiorni(fine, p.data) >= 7 && differenzaGiorni(fine, p.data) < 14);
  if (!a.length || !b.length) return null;
  return round(mean(b.map((p) => p.peso)) - mean(a.map((p) => p.peso)), 2);
}

export type Previsione = {
  kgPerSettimana: number;
  dataMax: string | null; // quando si entra nella fascia (peso <= max)
  dataMin: string | null; // quando si arriva al minimo della fascia
};

/** Regressione lineare sugli ultimi 28 giorni, serve almeno 5 pesi su 7+ giorni. */
export function previsione(serie: PuntoPeso[], s: Settings, fine = oggi()): Previsione | null {
  const pts = serie.filter((p) => differenzaGiorni(fine, p.data) >= 0 && differenzaGiorni(fine, p.data) < 28);
  if (pts.length < 5) return null;
  const x0 = pts[0].data;
  const xs = pts.map((p) => differenzaGiorni(p.data, x0));
  if (Math.max(...xs) < 7) return null;
  const ys = pts.map((p) => p.peso);
  const mx = mean(xs);
  const my = mean(ys);
  const den = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
  if (den === 0) return null;
  const pend = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / den;
  const inter = my - pend * mx;
  const kgSett = round(-pend * 7, 2);
  if (pend > -0.005) return { kgPerSettimana: kgSett, dataMax: null, dataMin: null };
  const quando = (target: number) => {
    const giorni = Math.ceil((target - inter) / pend);
    const d = aggiungiGiorni(x0, giorni);
    return d < fine ? fine : d;
  };
  return {
    kgPerSettimana: kgSett,
    dataMax: quando(s.obiettivo_max_kg),
    dataMin: quando(s.obiettivo_min_kg),
  };
}

export function aderente(l: DailyLog | undefined) {
  return !!l && l.dieta_rispettata === true && l.digiuno_rispettato === true;
}

/** Giorni consecutivi aderenti; se oggi non è ancora compilato si parte da ieri. */
export function giorniConsecutivi(logs: DailyLog[], fine = oggi()) {
  const mappa = new Map(logs.map((l) => [l.data, l]));
  let giorno = fine;
  if (!mappa.has(giorno) || mappa.get(giorno)!.dieta_rispettata == null) giorno = aggiungiGiorni(fine, -1);
  let n = 0;
  while (aderente(mappa.get(giorno))) {
    n++;
    giorno = aggiungiGiorni(giorno, -1);
  }
  return n;
}

export function digiunoAttivo(sessioni: FastingSession[]) {
  return sessioni.find((s) => !s.fine) ?? null;
}

export function ultimiNGiorni(logs: DailyLog[], n: number, fine = oggi()) {
  return logs.filter((l) => differenzaGiorni(fine, l.data) >= 0 && differenzaGiorni(fine, l.data) < n);
}

export function mediaCampo(logs: DailyLog[], campo: keyof DailyLog) {
  const v = logs.map((l) => l[campo]).filter((x): x is number => typeof x === "number");
  return v.length ? mean(v) : null;
}
