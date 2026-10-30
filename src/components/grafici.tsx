"use client";

import { useMemo, useState } from "react";
import {
  Area, Bar, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type Riga = { t: number; [k: string]: number | null };
const ms = (iso: string) => new Date(iso + "T12:00:00").getTime();
const fmtX = (t: number) => format(new Date(t), "d MMM", { locale: it });

const RANGE = [
  { label: "1 mese", giorni: 30 },
  { label: "3 mesi", giorni: 90 },
  { label: "6 mesi", giorni: 180 },
  { label: "Tutto", giorni: 100000 },
] as const;

export function Intervallo({ valore, onChange }: { valore: number; onChange: (g: number) => void }) {
  return (
    <div className="grid w-full grid-cols-4 gap-1 rounded-2xl bg-card2 p-1 sm:w-auto" role="tablist">
      {RANGE.map((r) => (
        <button key={r.label} role="tab" aria-selected={valore === r.giorni} onClick={() => onChange(r.giorni)}
          className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition ${valore === r.giorni ? "bg-card text-brand shadow-sm" : "text-muted"}`}>
          {r.label}
        </button>
      ))}
    </div>
  );
}

function Contenitore({ titolo, sottotitolo, children, intervallo, onIntervallo, vuoto }: {
  titolo: string; sottotitolo?: string; children: React.ReactNode; intervallo?: number; onIntervallo?: (g: number) => void; vuoto?: boolean;
}) {
  return (
    <section className="card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="h-section">{titolo}</h2>
          {sottotitolo && <p className="text-base text-muted">{sottotitolo}</p>}
        </div>
        {onIntervallo && intervallo != null && <Intervallo valore={intervallo} onChange={onIntervallo} />}
      </div>
      {vuoto ? <p className="grid h-52 place-items-center text-center text-lg text-muted">Nessun dato ancora. Inserisci i valori in &quot;Oggi&quot; o &quot;Salute&quot;.</p> : <div className="h-64 w-full sm:h-72">{children}</div>}
    </section>
  );
}

const tooltipStyle = {
  contentStyle: { background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, fontSize: 15, color: "var(--ink)" },
  labelStyle: { color: "var(--muted)" },
  labelFormatter: (t: unknown) => fmtX(Number(t)),
};
const asse = { stroke: "var(--line)", tickLine: false, axisLine: false } as const;

function useFiltro<T extends { t: number }>(righe: T[], giorni: number) {
  return useMemo(() => {
    if (!righe.length) return righe;
    const fine = Math.max(...righe.map((r) => r.t));
    return righe.filter((r) => r.t >= fine - giorni * 86_400_000);
  }, [righe, giorni]);
}

export function GraficoPeso({ serie, min, max, dataMax }: {
  serie: { data: string; peso: number; media7: number }[]; min: number; max: number; dataMax: string | null;
}) {
  const [g, setG] = useState(90);
  const base: Riga[] = useMemo(() => serie.map((p) => ({ t: ms(p.data), peso: p.peso, media7: p.media7, proiezione: null })), [serie]);
  const visibili = useFiltro(base, g);
  const dati = useMemo(() => {
    if (!visibili.length || !dataMax) return visibili;
    const ult = visibili[visibili.length - 1];
    const fineProiez = ms(dataMax);
    if (fineProiez <= ult.t) return visibili;
    return [...visibili.slice(0, -1), { ...ult, proiezione: ult.media7 }, { t: fineProiez, peso: null, media7: null, proiezione: max }];
  }, [visibili, dataMax, max]);
  const valori = serie.map((p) => p.peso);
  const lo = Math.floor(Math.min(min - 1, ...(valori.length ? valori : [min])) - 1);
  const hi = Math.ceil(Math.max(max + 1, ...(valori.length ? valori : [max])) + 1);
  return (
    <Contenitore titolo="Peso" sottotitolo="Punti: pesate. Linea spessa: media mobile 7 giorni. Fascia verde: obiettivo." intervallo={g} onIntervallo={setG} vuoto={!serie.length}>
      <ResponsiveContainer>
        <ComposedChart data={dati} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={fmtX} {...asse} minTickGap={32} />
          <YAxis domain={[lo, hi]} {...asse} width={54} tickFormatter={(v) => String(Math.round(Number(v) * 10) / 10)} />
          <ReferenceArea y1={min} y2={max} fill="var(--band)" stroke="none" ifOverflow="extendDomain" />
          <Tooltip {...tooltipStyle} formatter={(v, n) => [`${Number(v).toFixed(1)} kg`, n === "peso" ? "Pesata" : n === "media7" ? "Media 7 giorni" : "Previsione"]} />
          <Line dataKey="peso" stroke="var(--c2)" strokeWidth={0} dot={{ r: 3.5, fill: "var(--c2)", strokeWidth: 0 }} isAnimationActive={false} connectNulls />
          <Line dataKey="media7" stroke="var(--c1)" strokeWidth={4} dot={false} connectNulls isAnimationActive={false} />
          <Line dataKey="proiezione" stroke="var(--c1)" strokeWidth={3} strokeDasharray="6 6" dot={false} connectNulls isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </Contenitore>
  );
}

export type SerieLinea = { key: string; label: string; colore: string };

export function GraficoLinee({ titolo, sottotitolo, dati, serie, unita, fascia, linee = [], decimali = 0, dominio, giorniIniziali = 90 }: {
  titolo: string; sottotitolo?: string; dati: { data: string; [k: string]: string | number | null }[];
  serie: SerieLinea[]; unita: string; fascia?: [number, number]; linee?: { y: number; label: string }[]; decimali?: number; dominio?: [number | "auto", number | "auto"]; giorniIniziali?: number;
}) {
  const [g, setG] = useState(giorniIniziali);
  const righe: Riga[] = useMemo(() => dati.map((d) => ({ ...(d as object), t: ms(d.data) }) as Riga), [dati]);
  const visibili = useFiltro(righe, g);
  return (
    <Contenitore titolo={titolo} sottotitolo={sottotitolo} intervallo={g} onIntervallo={setG} vuoto={!dati.length}>
      <ResponsiveContainer>
        <ComposedChart data={visibili} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={fmtX} {...asse} minTickGap={32} />
          <YAxis domain={dominio ?? ["auto", "auto"]} {...asse} width={54} tickFormatter={(v) => String(Math.round(Number(v) * 10) / 10)} />
          {fascia && <ReferenceArea y1={fascia[0]} y2={fascia[1]} fill="var(--band)" stroke="none" ifOverflow="extendDomain" />}
          {linee.map((l) => <ReferenceLine key={l.label} y={l.y} stroke="var(--bad)" strokeDasharray="5 5" label={{ value: l.label, fill: "var(--bad)", fontSize: 12, position: "insideTopRight" }} />)}
          <Tooltip {...tooltipStyle} formatter={(v, n) => [`${Number(v).toFixed(decimali)} ${unita}`, serie.find((s) => s.key === n)?.label ?? n]} />
          {serie.map((s) => <Line key={s.key} dataKey={s.key} stroke={s.colore} strokeWidth={3.5} dot={{ r: 3, fill: s.colore, strokeWidth: 0 }} connectNulls isAnimationActive={false} />)}
        </ComposedChart>
      </ResponsiveContainer>
    </Contenitore>
  );
}

export function GraficoBarre({ titolo, sottotitolo, dati, chiave, etichetta, unita, obiettivo, colore, decimali = 0 }: {
  titolo: string; sottotitolo?: string; dati: { data: string; [k: string]: string | number | null }[]; chiave: string; etichetta: string; unita: string; obiettivo?: number; colore: string; decimali?: number;
}) {
  const [g, setG] = useState(30);
  const righe: Riga[] = useMemo(() => dati.map((d) => ({ ...(d as object), t: ms(d.data) }) as Riga), [dati]);
  const visibili = useFiltro(righe, g);
  return (
    <Contenitore titolo={titolo} sottotitolo={sottotitolo} intervallo={g} onIntervallo={setG} vuoto={!dati.length}>
      <ResponsiveContainer>
        <ComposedChart data={visibili} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey="t" type="number" scale="time" domain={["dataMin - 43200000", "dataMax + 43200000"]} tickFormatter={fmtX} {...asse} minTickGap={32} />
          <YAxis {...asse} width={54} tickFormatter={(v) => String(Math.round(Number(v) * 10) / 10)} />
          {obiettivo != null && <ReferenceLine y={obiettivo} stroke="var(--ok)" strokeDasharray="5 5" label={{ value: "obiettivo", fill: "var(--ok)", fontSize: 12, position: "insideTopRight" }} />}
          <Tooltip {...tooltipStyle} formatter={(v) => [`${Number(v).toFixed(decimali)} ${unita}`, etichetta]} cursor={{ fill: "var(--band)" }} />
          <Bar dataKey={chiave} fill={colore} radius={[6, 6, 0, 0]} maxBarSize={22} isAnimationActive={false} />
          <Area dataKey={chiave} stroke="none" fill="none" />
        </ComposedChart>
      </ResponsiveContainer>
    </Contenitore>
  );
}
