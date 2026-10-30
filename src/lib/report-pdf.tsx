import { Document, Page, Polyline, StyleSheet, Svg, Line, Text, View } from "@react-pdf/renderer";
import { differenceInYears, parseISO } from "date-fns";
import { bmi, caloSettimanale, mediaCampo, pesoAttuale, round, seriePeso, ultimiNGiorni } from "./calc";
import { calcolaAvvisi } from "./avvisi";
import type { Dati } from "./dati";
import { differenzaGiorni, formatta, giornoDi, oggi } from "./date";

const C = { ink: "#0f1f24", muted: "#5b6e75", line: "#d5dfe2", brand: "#0d9488", bad: "#b91c1c", soft: "#eef6f5" };
const st = StyleSheet.create({
  page: { padding: 36, fontSize: 10, color: C.ink, fontFamily: "Helvetica" },
  h1: { fontSize: 20, fontFamily: "Helvetica-Bold", color: C.brand },
  sub: { color: C.muted, marginTop: 2, marginBottom: 14 },
  h2: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 14, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 3 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  box: { width: "24%", backgroundColor: C.soft, borderRadius: 6, padding: 7 },
  boxL: { color: C.muted, fontSize: 8 },
  boxV: { fontSize: 14, fontFamily: "Helvetica-Bold", marginTop: 2 },
  riga: { flexDirection: "row", paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: C.line },
  c1: { width: "40%" }, c2: { width: "20%" }, c3: { width: "25%" }, c4: { width: "15%" },
  bad: { color: C.bad, fontFamily: "Helvetica-Bold" },
  nota: { color: C.muted, fontSize: 8, marginTop: 14 },
});

const fmt = (n: number | null | undefined, d = 1, u = "") => (n == null || Number.isNaN(n) ? "-" : `${n.toFixed(d).replace(".", ",")}${u ? " " + u : ""}`);

function GraficoPesoPdf({ punti }: { punti: { x: number; y: number }[] }) {
  if (punti.length < 2) return <Text style={{ color: C.muted }}>Dati insufficienti per il grafico.</Text>;
  const W = 520, H = 110;
  const xs = punti.map((p) => p.x), ys = punti.map((p) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys) - 1, y1 = Math.max(...ys) + 1;
  const pts = punti.map((p) => `${((p.x - x0) / (x1 - x0 || 1)) * W},${H - ((p.y - y0) / (y1 - y0 || 1)) * H}`).join(" ");
  return (
    <View>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Line x1="0" y1={H} x2={W} y2={H} stroke={C.line} strokeWidth={1} />
        <Polyline points={pts} stroke={C.brand} strokeWidth={2} fill="none" />
      </Svg>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: C.muted, fontSize: 8 }}>{fmt(punti[0].y, 1, "kg")}</Text>
        <Text style={{ color: C.muted, fontSize: 8 }}>{fmt(punti[punti.length - 1].y, 1, "kg")}</Text>
      </View>
    </View>
  );
}

export function ReportPdf({ d, giorni }: { d: Dati; giorni: number }) {
  const { settings: s } = d;
  const fine = oggi();
  const logs = ultimiNGiorni(d.logs, giorni, fine);
  const serie = seriePeso(d.logs);
  const serieP = serie.filter((p) => differenzaGiorni(fine, p.data) < giorni);
  const att = pesoAttuale(serie);
  const primo = serieP[0];
  const bp = d.bp.filter((b) => differenzaGiorni(fine, giornoDi(b.misurata_il)) < giorni);
  const gly = d.glicemie.filter((g) => differenzaGiorni(fine, giornoDi(g.misurata_il)) < giorni);
  const glyDig = gly.filter((g) => g.tipo === "digiuno");
  const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const aderenti = logs.filter((l) => l.dieta_rispettata && l.digiuno_rispettato).length;
  const compilati = logs.filter((l) => l.dieta_rispettata != null).length;
  const eta = s.data_nascita ? differenceInYears(new Date(), parseISO(s.data_nascita)) : null;
  const avvisi = calcolaAvvisi(d);
  const fuoriRange = (r: Dati["risultati"][number]) => (r.rif_min != null && r.valore < r.rif_min) || (r.rif_max != null && r.valore > r.rif_max);
  const ultimoTest = d.tests[0];

  return (
    <Document title="Report per il medico" author="App perdita peso">
      <Page size="A4" style={st.page}>
        <Text style={st.h1}>Report per il medico</Text>
        <Text style={st.sub}>
          {s.nome ? `${s.nome} · ` : ""}{eta ? `${eta} anni · ` : ""}altezza {s.altezza_cm} cm · periodo: ultimi {giorni} giorni (fino al {formatta(fine, "d MMMM yyyy")})
        </Text>

        <Text style={st.h2}>Terapia in corso</Text>
        <Text>{d.farmaci.length ? d.farmaci.map((f) => `${f.nome}${f.dose ? " " + f.dose : ""}`).join(" · ") : "Nessun farmaco registrato."}</Text>
        <Text style={{ color: C.muted, marginTop: 3 }}>Dieta senza zuccheri e senza carboidrati, digiuno 16:8 (cena saltata).</Text>

        <Text style={st.h2}>Riepilogo</Text>
        <View style={st.grid}>
          {[
            ["Peso attuale", fmt(att?.peso, 1, "kg")],
            ["Peso di partenza", fmt(s.peso_iniziale_kg, 1, "kg")],
            ["Variazione nel periodo", primo && att ? fmt(att.peso - primo.peso, 1, "kg") : "-"],
            ["BMI", att ? fmt(bmi(att.peso, s.altezza_cm), 1) : "-"],
            ["Vita media", fmt(mediaCampo(logs, "vita_cm"), 1, "cm")],
            ["Calo ultima settimana", fmt(caloSettimanale(serie), 1, "kg")],
            ["Sonno medio", fmt(mediaCampo(logs, "sonno_ore"), 1, "ore")],
            ["Acqua media", fmt(mediaCampo(logs, "acqua_ml") != null ? mediaCampo(logs, "acqua_ml")! / 1000 : null, 1, "L")],
            ["Passi medi", fmt(mediaCampo(logs, "passi"), 0)],
            ["Pressione media", bp.length ? `${Math.round(media(bp.map((b) => b.sistolica))!)}/${Math.round(media(bp.map((b) => b.diastolica))!)}` : "-"],
            ["Glicemia digiuno media", fmt(media(glyDig.map((g) => g.mg_dl)), 0, "mg/dL")],
            ["Aderenza", compilati ? `${Math.round((aderenti / compilati) * 100)}% (${aderenti}/${compilati} giorni)` : "-"],
          ].map(([l, v]) => (
            <View key={l} style={st.box}><Text style={st.boxL}>{l}</Text><Text style={st.boxV}>{v}</Text></View>
          ))}
        </View>

        <Text style={st.h2}>Andamento del peso</Text>
        <GraficoPesoPdf punti={serieP.map((p) => ({ x: parseISO(p.data).getTime(), y: p.peso }))} />

        {avvisi.filter((a) => a.gravita !== "info").length > 0 && (
          <>
            <Text style={st.h2}>Segnalazioni attive</Text>
            {avvisi.filter((a) => a.gravita !== "info").map((a) => <Text key={a.tipo} style={{ marginBottom: 3 }}>- {a.titolo}</Text>)}
          </>
        )}

        <Text style={st.h2}>Pressione arteriosa (ultime 15 misure)</Text>
        {bp.length === 0 && <Text style={{ color: C.muted }}>Nessuna misura nel periodo.</Text>}
        {[...bp].reverse().slice(0, 15).map((b) => {
          const f = b.sistolica >= s.pa_sys_max || b.diastolica >= s.pa_dia_max || b.sistolica < s.pa_sys_min || b.diastolica < s.pa_dia_min;
          return (
            <View key={b.id} style={st.riga} wrap={false}>
              <Text style={st.c1}>{formatta(giornoDi(b.misurata_il), "d MMM yyyy")}</Text>
              <Text style={[st.c2, f ? st.bad : {}]}>{b.sistolica}/{b.diastolica}</Text>
              <Text style={st.c3}>{b.battiti ? `${b.battiti} bpm` : ""}</Text>
            </View>
          );
        })}

        <Text style={st.h2}>Glicemia (ultime 15 misure)</Text>
        {gly.length === 0 && <Text style={{ color: C.muted }}>Nessuna misura nel periodo.</Text>}
        {[...gly].reverse().slice(0, 15).map((g) => (
          <View key={g.id} style={st.riga} wrap={false}>
            <Text style={st.c1}>{formatta(giornoDi(g.misurata_il), "d MMM yyyy")}</Text>
            <Text style={[st.c2, g.tipo === "digiuno" && (g.mg_dl < s.glicemia_min || g.mg_dl > s.glicemia_max) ? st.bad : {}]}>{g.mg_dl} mg/dL</Text>
            <Text style={st.c3}>{g.tipo === "digiuno" ? "a digiuno" : g.tipo === "post_pasto" ? "dopo il pasto" : "altro"}</Text>
          </View>
        ))}

        {ultimoTest && (
          <>
            <Text style={st.h2}>Ultimi esami del sangue ({formatta(ultimoTest.data, "d MMMM yyyy")})</Text>
            {d.esamiRecenti.map((r) => (
              <View key={r.id} style={st.riga} wrap={false}>
                <Text style={st.c1}>{r.analita}</Text>
                <Text style={[st.c2, fuoriRange(r) ? st.bad : {}]}>{r.valore} {r.unita ?? ""}</Text>
                <Text style={st.c3}>rif. {r.rif_min ?? "-"} / {r.rif_max ?? "-"}</Text>
                <Text style={[st.c4, st.bad]}>{fuoriRange(r) ? "fuori range" : ""}</Text>
              </View>
            ))}
          </>
        )}

        <Text style={st.nota}>
          Report generato automaticamente dai dati inseriti dal paziente il {formatta(fine, "d MMMM yyyy")}. Le misure sono autodichiarate e non sostituiscono la valutazione clinica.
          {" "}Media del peso arrotondata a {round(att?.media7 ?? 0, 1)} kg (ultimi 7 giorni).
        </Text>
      </Page>
    </Document>
  );
}
