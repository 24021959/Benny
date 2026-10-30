import { caloSettimanale, mediaCampo, seriePeso, ultimiNGiorni, digiunoAttivo } from "./calc";
import { differenzaGiorni, giornoDi, oggi } from "./date";
import type { Avviso, BpReading, DailyLog, FastingSession, GlucoseReading, LabResult, Settings } from "./types";

export type DatiAvvisi = {
  settings: Settings;
  logs: DailyLog[];
  bp: BpReading[];
  glicemie: GlucoseReading[];
  digiuni: FastingSession[];
  esamiRecenti: LabResult[]; // risultati dell'ultimo esame
};

const ANALITI_RENALI = ["creatinina", "egfr", "filtrato glomerulare"];

/** Regole di sicurezza: nessuna IA, tutto spiegabile. Le soglie sono nelle impostazioni. */
export function calcolaAvvisi(d: DatiAvvisi, fine = oggi()): Avviso[] {
  const { settings: s } = d;
  const out: Avviso[] = [];
  const serie = seriePeso(d.logs);

  const calo = caloSettimanale(serie, fine);
  if (calo != null && calo > s.max_calo_settimanale_kg) {
    out.push({
      tipo: "calo_rapido",
      gravita: "importante",
      titolo: "Stai perdendo peso troppo in fretta",
      messaggio: `La media di questa settimana è scesa di ${calo.toFixed(1)} kg rispetto alla precedente (limite ${s.max_calo_settimanale_kg} kg). Un calo così rapido può far perdere muscolo e liquidi. Mangia con regolarità nella finestra dei pasti, bevi di più e parlane col medico.`,
    });
  }

  const ultimaPa = [...d.bp].sort((a, b) => b.misurata_il.localeCompare(a.misurata_il))[0];
  if (ultimaPa) {
    const { sistolica: sys, diastolica: dia } = ultimaPa;
    if (sys >= 180 || dia >= 110) {
      out.push({
        tipo: "pressione_urgente",
        gravita: "importante",
        titolo: `Pressione molto alta (${sys}/${dia})`,
        messaggio: "Riposa, rimisura dopo 5 minuti. Se il valore resta così alto o hai mal di testa forte, dolore al petto o disturbi della vista, chiama subito il medico o il 112.",
      });
    } else if (sys >= s.pa_sys_max || dia >= s.pa_dia_max) {
      out.push({
        tipo: "pressione_alta",
        gravita: "attenzione",
        titolo: `Pressione sopra il limite (${sys}/${dia})`,
        messaggio: `Il limite impostato è ${s.pa_sys_max}/${s.pa_dia_max}. Rimisura da seduto dopo qualche minuto di riposo. Se si ripete, avvisa il medico.`,
      });
    } else if (sys < s.pa_sys_min || dia < s.pa_dia_min) {
      out.push({
        tipo: "pressione_bassa",
        gravita: "attenzione",
        titolo: `Pressione bassa (${sys}/${dia})`,
        messaggio: "Con digiuno e dieta senza carboidrati la pressione può scendere. Bevi, alzati piano e parlane col medico, soprattutto se hai giramenti di testa.",
      });
    }
  }
  if (!d.bp.some((b) => differenzaGiorni(fine, giornoDi(b.misurata_il)) < 7)) {
    out.push({
      tipo: "pressione_non_misurata",
      gravita: "info",
      titolo: "Pressione non misurata da una settimana",
      messaggio: "Misurala qualche volta a settimana, sempre alla stessa ora.",
    });
  }

  const ultimaGly = [...d.glicemie].sort((a, b) => b.misurata_il.localeCompare(a.misurata_il))[0];
  if (ultimaGly && ultimaGly.tipo === "digiuno") {
    if (ultimaGly.mg_dl < s.glicemia_min) {
      out.push({
        tipo: "glicemia_bassa",
        gravita: "importante",
        titolo: `Glicemia bassa (${ultimaGly.mg_dl} mg/dL)`,
        messaggio: "Se hai sudore freddo, tremori o confusione, mangia qualcosa subito e avvisa il medico: con la dieta attuale va controllata.",
      });
    } else if (ultimaGly.mg_dl > s.glicemia_max) {
      out.push({
        tipo: "glicemia_alta",
        gravita: "attenzione",
        titolo: `Glicemia a digiuno alta (${ultimaGly.mg_dl} mg/dL)`,
        messaggio: `Sopra il limite di ${s.glicemia_max}. Ripeti la misura un altro giorno e parlane col medico.`,
      });
    }
  }

  const ultimi2 = ultimiNGiorni(d.logs, 2, fine).filter((l) => l.acqua_ml != null);
  if (ultimi2.length) {
    const media = mediaCampo(ultimi2, "acqua_ml")!;
    if (media < s.acqua_obiettivo_ml * 0.75) {
      out.push({
        tipo: "poca_acqua",
        gravita: "attenzione",
        titolo: "Stai bevendo poco",
        messaggio: `Media degli ultimi giorni: ${(media / 1000).toFixed(1)} L su ${(s.acqua_obiettivo_ml / 1000).toFixed(1)} L. Con il digiuno e la dieta senza carboidrati i liquidi servono ancora di più, anche per i reni.`,
      });
    }
  }

  const sonno = ultimiNGiorni(d.logs, 3, fine).filter((l) => l.sonno_ore != null);
  if (sonno.length >= 2 && mediaCampo(sonno, "sonno_ore")! < 6) {
    out.push({
      tipo: "poco_sonno",
      gravita: "attenzione",
      titolo: "Dormi poco",
      messaggio: "Meno di 6 ore per notte rende più difficile perdere peso e alza la fame e la pressione.",
    });
  }

  const ult3 = ultimiNGiorni(d.logs, 3, fine);
  if (ult3.length >= 3 && ult3.every((l) => (l.energia ?? 5) <= 2)) {
    out.push({
      tipo: "energia_bassa",
      gravita: "attenzione",
      titolo: "Energia bassa da tre giorni",
      messaggio: "Se ti senti debole o stanco, non forzare il digiuno e parlane col medico.",
    });
  }
  if (ult3.length >= 3 && ult3.every((l) => (l.fame ?? 1) >= 4)) {
    out.push({
      tipo: "fame_alta",
      gravita: "info",
      titolo: "Fame alta da tre giorni",
      messaggio: "Prova ad aumentare proteine e verdure ai due pasti, e a bere prima di mangiare.",
    });
  }

  const ultimoPeso = serie[serie.length - 1];
  if (!ultimoPeso || differenzaGiorni(fine, ultimoPeso.data) >= 3) {
    out.push({
      tipo: "peso_mancante",
      gravita: "info",
      titolo: "Peso non registrato da qualche giorno",
      messaggio: "Pesati ogni mattina dopo il bagno, prima di mangiare: la media settimanale diventa più affidabile.",
    });
  }

  const attivo = digiunoAttivo(d.digiuni);
  if (attivo) {
    const ore = (Date.now() - new Date(attivo.inizio).getTime()) / 3_600_000;
    if (ore > 20) {
      out.push({
        tipo: "digiuno_lungo",
        gravita: "attenzione",
        titolo: `Digiuno in corso da ${Math.floor(ore)} ore`,
        messaggio: "Il piano è 16 ore. Se ti senti debole, interrompi e mangia qualcosa.",
      });
    }
  }

  for (const r of d.esamiRecenti) {
    const fuori = (r.rif_min != null && r.valore < r.rif_min) || (r.rif_max != null && r.valore > r.rif_max);
    if (!fuori) continue;
    const renale = ANALITI_RENALI.some((k) => r.analita.toLowerCase().includes(k));
    out.push({
      tipo: `esame_${r.analita.toLowerCase()}`,
      gravita: renale ? "importante" : "attenzione",
      titolo: `${r.analita} fuori range (${r.valore} ${r.unita ?? ""})`.trim(),
      messaggio: renale
        ? "La funzione renale conta per la terapia con Xarelto: mostra questo valore al medico."
        : "Valore fuori dal range di riferimento nell'ultimo esame. Parlane col medico.",
    });
  }

  const ordine = { importante: 0, attenzione: 1, info: 2 } as const;
  return out.sort((a, b) => ordine[a.gravita] - ordine[b.gravita]);
}

/** Consigli positivi o pratici ricavati dai dati. */
export function calcolaConsigli(d: DatiAvvisi, fine = oggi()): string[] {
  const { settings: s } = d;
  const out: string[] = [];
  const serie = seriePeso(d.logs);
  const calo = caloSettimanale(serie, fine);
  if (calo != null) {
    if (calo >= 0.3 && calo <= s.max_calo_settimanale_kg) out.push(`Ottimo ritmo: ${calo.toFixed(1)} kg in meno questa settimana, in modo sano.`);
    else if (calo < 0.1) out.push("Il peso è fermo: è normale per qualche giorno. Controlla porzioni, sonno e passi prima di cambiare qualcosa.");
  }
  const passi = mediaCampo(ultimiNGiorni(d.logs, 7, fine), "passi");
  if (passi != null && passi < s.passi_obiettivo)
    out.push(`Passi medi ${Math.round(passi)} al giorno: una camminata di 15 minuti dopo pranzo aiuta glicemia, peso e circolazione.`);
  const acqua = mediaCampo(ultimiNGiorni(d.logs, 7, fine), "acqua_ml");
  if (acqua != null && acqua < s.acqua_obiettivo_ml)
    out.push("Tieni una bottiglia d'acqua sempre a portata di mano e bevi un bicchiere appena sveglio.");
  const sonno = mediaCampo(ultimiNGiorni(d.logs, 7, fine), "sonno_ore");
  if (sonno != null && sonno < 7) out.push("Prova ad andare a letto 30 minuti prima: dormire 7-8 ore aiuta la fame e la pressione.");
  const aderenza = ultimiNGiorni(d.logs, 7, fine).filter((l) => l.dieta_rispettata && l.digiuno_rispettato).length;
  if (aderenza >= 6) out.push("Quasi tutti i giorni rispettati questa settimana: la costanza è quello che conta.");
  out.push("Mangia proteine a ogni pasto (uova, pesce, carne, formaggi): proteggono i muscoli mentre dimagrisci.");
  out.push("Se noti sanguinamenti insoliti dalle gengive o dal naso, lividi senza motivo o feci scure, avvisa subito il medico (assumi Xarelto).");
  return out;
}
