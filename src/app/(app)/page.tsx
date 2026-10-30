import { Flame, Gauge, Scale, Target, TrendingDown, Activity } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { caricaDati } from "@/lib/dati";
import { bmi, caloSettimanale, categoriaBmi, digiunoAttivo, giorniConsecutivi, media7Giorni, pesoAttuale, previsione, round, seriePeso } from "@/lib/calc";
import { calcolaAvvisi } from "@/lib/avvisi";
import { formatta, formattaData, giornoDi, oggi } from "@/lib/date";
import { CalendarioAderenza } from "@/components/calendario";
import { TimerDigiuno } from "@/components/digiuno";
import { GraficoBarre, GraficoLinee, GraficoPeso } from "@/components/grafici";
import { ListaAvvisi, Riquadro } from "@/components/ui";

export default async function Home() {
  const supabase = await createClient();
  const d = await caricaDati(supabase);
  const { settings: s } = d;
  const serie = seriePeso(d.logs);
  const att = pesoAttuale(serie);
  const persi = att ? round(s.peso_iniziale_kg - att.peso, 1) : null;
  const mancanti = att ? round(Math.max(0, att.peso - s.obiettivo_max_kg), 1) : null;
  const imc = att ? bmi(att.peso, s.altezza_cm) : bmi(s.peso_iniziale_kg, s.altezza_cm);
  const prev = previsione(serie, s);
  const calo = caloSettimanale(serie);
  const digiuno = digiunoAttivo(d.digiuni);
  const consecutivi = giorniConsecutivi(d.logs);
  const avvisi = calcolaAvvisi(d);

  const logsSerie = (campo: "vita_cm" | "sonno_ore" | "acqua_ml" | "passi") =>
    d.logs.filter((l) => l[campo] != null).map((l) => ({ data: l.data, v: Number(l[campo]) }));
  const pa = d.bp.map((b) => ({ data: giornoDi(b.misurata_il), sys: b.sistolica, dia: b.diastolica }));
  const gly = d.glicemie.filter((g) => g.tipo === "digiuno").map((g) => ({ data: giornoDi(g.misurata_il), gly: g.mg_dl }));

  return (
    <div className="space-y-6">
      <header>
        <p className="text-lg capitalize text-muted">{formattaData(oggi())}</p>
        <h1 className="h-page">{s.nome ? `Ciao ${s.nome}` : "Ciao"}</h1>
      </header>

      <ListaAvvisi avvisi={avvisi.filter((a) => a.gravita !== "info").slice(0, 3)} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Riquadro etichetta="Peso attuale" valore={att ? att.peso.toFixed(1) : "–"} unita="kg" icona={<Scale className="size-6" />} nota={att ? `Pesata del ${formatta(att.data)}` : "Inserisci il peso in “Oggi”"} />
        <Riquadro etichetta="Kg persi" valore={persi != null ? persi.toFixed(1) : "–"} unita="kg" tono={persi && persi > 0 ? "ok" : "neutro"} icona={<TrendingDown className="size-6" />} nota={`Partenza: ${s.peso_iniziale_kg} kg`} />
        <Riquadro etichetta="Kg mancanti" valore={mancanti != null ? mancanti.toFixed(1) : "–"} unita="kg" icona={<Target className="size-6" />} nota={`Per arrivare a ${s.obiettivo_max_kg} kg`} />
        <Riquadro etichetta="BMI" valore={imc.toFixed(1)} icona={<Gauge className="size-6" />} nota={categoriaBmi(imc)} />
        <Riquadro etichetta="Media 7 giorni" valore={media7Giorni(serie)?.toFixed(1) ?? "–"} unita="kg" icona={<Activity className="size-6" />} nota={calo != null ? `${calo >= 0 ? "−" : "+"}${Math.abs(calo).toFixed(1)} kg sulla settimana prima` : "Servono due settimane di dati"} tono={calo != null && calo > s.max_calo_settimanale_kg ? "bad" : "neutro"} />
        <div className="col-span-2 lg:col-span-2"><TimerDigiuno inizio={digiuno?.inizio ?? null} id={digiuno?.id ?? null} /></div>
        <Riquadro etichetta="Giorni di fila" valore={consecutivi} unita={consecutivi === 1 ? "giorno" : "giorni"} icona={<Flame className="size-6" />} tono={consecutivi >= 3 ? "ok" : "neutro"} nota="Dieta e digiuno rispettati" />
      </div>

      <GraficoPeso serie={serie} min={s.obiettivo_min_kg} max={s.obiettivo_max_kg} dataMax={prev?.dataMax ?? null} />

      <section className="card bg-brandsoft/60">
        <h2 className="h-section">Data stimata di arrivo</h2>
        {prev?.dataMax ? (
          <p className="mt-1 text-lg">
            Con il ritmo degli ultimi 28 giorni (<b>{prev.kgPerSettimana.toFixed(1)} kg a settimana</b>) entri nella fascia {s.obiettivo_min_kg}–{s.obiettivo_max_kg} kg verso il <b>{formatta(prev.dataMax, "d MMMM yyyy")}</b>
            {prev.dataMin && <> e raggiungi {s.obiettivo_min_kg} kg verso il <b>{formatta(prev.dataMin, "d MMMM yyyy")}</b></>}. È una stima: cambia con il tuo andamento.
          </p>
        ) : prev ? (
          <p className="mt-1 text-lg">Negli ultimi 28 giorni il peso non sta scendendo: nessuna data stimata. Controlla porzioni, sonno e passi.</p>
        ) : (
          <p className="mt-1 text-lg">Servono almeno 5 pesate in 7 giorni per stimare la data di arrivo.</p>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <GraficoLinee titolo="Vita" sottotitolo="Circonferenza in centimetri" dati={logsSerie("vita_cm")} serie={[{ key: "v", label: "Vita", colore: "var(--c3)" }]} unita="cm" decimali={1} />
        <GraficoLinee titolo="Pressione" sottotitolo="Massima e minima, linea rossa = limite" dati={pa} serie={[{ key: "sys", label: "Massima", colore: "var(--c4)" }, { key: "dia", label: "Minima", colore: "var(--c2)" }]} unita="mmHg" linee={[{ y: s.pa_sys_max, label: `${s.pa_sys_max}` }]} />
        <GraficoLinee titolo="Glicemia a digiuno" sottotitolo="Fascia verde = valori nella norma" dati={gly} serie={[{ key: "gly", label: "Glicemia", colore: "var(--c1)" }]} unita="mg/dL" fascia={[s.glicemia_min, s.glicemia_max]} dominio={[60, "auto"]} />
        <GraficoLinee titolo="Sonno" sottotitolo="Ore per notte" dati={logsSerie("sonno_ore")} serie={[{ key: "v", label: "Sonno", colore: "var(--c2)" }]} unita="ore" decimali={1} fascia={[7, 9]} dominio={[0, 10]} />
        <GraficoBarre titolo="Acqua" sottotitolo="Millilitri al giorno" dati={logsSerie("acqua_ml")} chiave="v" etichetta="Acqua" unita="ml" obiettivo={s.acqua_obiettivo_ml} colore="var(--c1)" />
        <GraficoBarre titolo="Passi" sottotitolo="Passi al giorno" dati={logsSerie("passi")} chiave="v" etichetta="Passi" unita="passi" obiettivo={s.passi_obiettivo} colore="var(--c3)" />
      </div>

      <CalendarioAderenza logs={d.logs} />
    </div>
  );
}
