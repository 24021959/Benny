import { caloSettimanale, mediaCampo, media7Giorni, previsione, seriePeso, ultimiNGiorni, giorniConsecutivi, round } from "./calc";
import { differenzaGiorni, giornoDi, oggi } from "./date";
import type { Dati } from "./dati";

/** Solo numeri aggregati, senza nome né dati personali: è ciò che viene inviato all'IA. */
export function riepilogoSettimana(d: Dati) {
  const { settings: s } = d;
  const serie = seriePeso(d.logs);
  const sett = ultimiNGiorni(d.logs, 7);
  const bp7 = d.bp.filter((b) => differenzaGiorni(oggi(), giornoDi(b.misurata_il)) < 7);
  const gly7 = d.glicemie.filter((g) => g.tipo === "digiuno" && differenzaGiorni(oggi(), giornoDi(g.misurata_il)) < 7);
  const media = (xs: number[]) => (xs.length ? round(xs.reduce((a, b) => a + b, 0) / xs.length, 1) : null);
  return {
    peso_iniziale_kg: s.peso_iniziale_kg,
    obiettivo_kg: `${s.obiettivo_min_kg}-${s.obiettivo_max_kg}`,
    peso_medio_7gg: media7Giorni(serie),
    variazione_media_settimanale_kg: caloSettimanale(serie),
    stima_data_arrivo: previsione(serie, s)?.dataMax ?? null,
    vita_media_cm: mediaCampo(sett, "vita_cm") != null ? round(mediaCampo(sett, "vita_cm")!, 1) : null,
    acqua_media_ml: mediaCampo(sett, "acqua_ml") != null ? Math.round(mediaCampo(sett, "acqua_ml")!) : null,
    acqua_obiettivo_ml: s.acqua_obiettivo_ml,
    sonno_medio_ore: mediaCampo(sett, "sonno_ore") != null ? round(mediaCampo(sett, "sonno_ore")!, 1) : null,
    passi_medi: mediaCampo(sett, "passi") != null ? Math.round(mediaCampo(sett, "passi")!) : null,
    energia_media_1_5: mediaCampo(sett, "energia") != null ? round(mediaCampo(sett, "energia")!, 1) : null,
    fame_media_1_5: mediaCampo(sett, "fame") != null ? round(mediaCampo(sett, "fame")!, 1) : null,
    giorni_dieta_e_digiuno_rispettati_su_7: sett.filter((l) => l.dieta_rispettata && l.digiuno_rispettato).length,
    giorni_consecutivi: giorniConsecutivi(d.logs),
    pressione_media: bp7.length ? `${media(bp7.map((b) => b.sistolica))}/${media(bp7.map((b) => b.diastolica))}` : null,
    glicemia_digiuno_media: media(gly7.map((g) => g.mg_dl)),
  };
}
