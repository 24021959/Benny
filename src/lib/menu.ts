import type { Recipe } from "./types";

type Slot = { giorno: number; pasto: "colazione" | "pranzo"; recipe_id: string };

const casuale = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
const principale = (r: Recipe) => r.tag.find((t) => ["uova", "pesce", "carne", "formaggio", "vegetariano"].includes(t)) ?? "altro";

/** Sceglie 7 ricette diverse per un pasto, variando la fonte di proteine da un giorno all'altro. */
function settimanaPerPasto(pool: Recipe[], pasto: "colazione" | "pranzo"): Slot[] {
  const usate = new Set<string>();
  const out: Slot[] = [];
  const conteggio: Record<string, number> = {};
  let prec: string | null = null;
  for (let giorno = 0; giorno < 7; giorno++) {
    const liberi = pool.filter((r) => !usate.has(r.id));
    const candidati = (liberi.length ? liberi : pool).map((r) => {
      const p = principale(r);
      let costo = Math.random();
      if (p === prec) costo += 3;
      if (p === "uova" && (conteggio.uova ?? 0) >= (pasto === "pranzo" ? 1 : 3)) costo += 6;
      if (p === "pesce" && (conteggio.pesce ?? 0) < 3 && pasto === "pranzo") costo -= 1.5;
      return { r, costo };
    });
    candidati.sort((a, b) => a.costo - b.costo);
    const scelta = candidati[0].r;
    const p = principale(scelta);
    usate.add(scelta.id);
    conteggio[p] = (conteggio[p] ?? 0) + 1;
    prec = p;
    out.push({ giorno, pasto, recipe_id: scelta.id });
  }
  return out;
}

export function generaSettimana(ricette: Recipe[]): Slot[] {
  const col = ricette.filter((r) => r.pasto === "colazione");
  const pra = ricette.filter((r) => r.pasto === "pranzo");
  return [...(col.length ? settimanaPerPasto(col, "colazione") : []), ...(pra.length ? settimanaPerPasto(pra, "pranzo") : [])];
}

/** Nuova ricetta per un solo pasto, diversa da quelle già in settimana. */
export function altraRicetta(ricette: Recipe[], pasto: "colazione" | "pranzo", usateIds: string[], corrente: string) {
  const pool = ricette.filter((r) => r.pasto === pasto && r.id !== corrente);
  const nuove = pool.filter((r) => !usateIds.includes(r.id));
  return casuale(nuove.length ? nuove : pool);
}

export type VoceSpesa = { nome: string; quantita: number; unita: string; reparto: string };

export function listaSpesa(ricetteUsate: Recipe[]): VoceSpesa[] {
  const mappa = new Map<string, VoceSpesa>();
  for (const r of ricetteUsate) {
    for (const i of r.ingredienti) {
      const k = `${i.nome.trim().toLowerCase()}|${i.unita}`;
      const ex = mappa.get(k);
      if (ex) ex.quantita += i.quantita;
      else mappa.set(k, { nome: i.nome.trim(), quantita: i.quantita, unita: i.unita, reparto: i.reparto || "Altro" });
    }
  }
  const ordine = ["Frutta e verdura", "Carne e pesce", "Latticini e uova", "Dispensa", "Altro"];
  return [...mappa.values()].sort((a, b) => ordine.indexOf(a.reparto) - ordine.indexOf(b.reparto) || a.nome.localeCompare(b.nome, "it"));
}
