import { addDays, format, parseISO } from "date-fns";
import { it } from "date-fns/locale";

export const FUSO = "Europe/Rome";

/** Data di oggi (yyyy-MM-dd) nel fuso italiano, indipendente dal server. */
export function oggi(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: FUSO }).format(now);
}

export function aggiungiGiorni(iso: string, n: number): string {
  return format(addDays(parseISO(iso), n), "yyyy-MM-dd");
}

export function differenzaGiorni(a: string, b: string): number {
  return Math.round((parseISO(a).getTime() - parseISO(b).getTime()) / 86_400_000);
}

export function formatta(iso: string, fmt = "d MMM"): string {
  return format(parseISO(iso), fmt, { locale: it });
}

export function formattaData(iso: string): string {
  return format(parseISO(iso), "EEEE d MMMM yyyy", { locale: it });
}

/** Data (yyyy-MM-dd) di un timestamp, nel fuso italiano. */
export function giornoDi(timestamp: string): string {
  return oggi(new Date(timestamp));
}

export function lunediDellaSettimana(iso: string): string {
  const d = parseISO(iso);
  const dow = (d.getDay() + 6) % 7;
  return aggiungiGiorni(iso, -dow);
}

export const GIORNI = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];
