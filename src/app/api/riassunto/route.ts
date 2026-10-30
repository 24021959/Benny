import { NextResponse } from "next/server";
import { calcolaAvvisi } from "@/lib/avvisi";
import { caricaDati } from "@/lib/dati";
import { riepilogoSettimana } from "@/lib/riepilogo";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const ISTRUZIONI = `Sei un assistente che aiuta un uomo di 67 anni a dimagrire in modo sano con una dieta senza zuccheri e carboidrati e digiuno 16:8 (cena saltata). Il vero scopo è migliorare la salute.
Ti arrivano i numeri della settimana. Scrivi in italiano, con parole semplici e frasi corte, un riassunto di massimo 150 parole: 1) cosa è andato bene, 2) cosa migliorare, 3) due obiettivi concreti per la settimana prossima.
Non fare diagnosi, non cambiare terapie, non nominare farmaci. Se un dato è preoccupante, invita a parlarne col medico. Niente elenchi lunghi, niente markdown.`;

export async function POST() {
  const supabase = await createClient();
  const { data: ok } = await supabase.rpc("peso_is_owner");
  if (!ok) return NextResponse.json({ errore: "Non autorizzato" }, { status: 401 });
  const chiave = process.env.OPENAI_API_KEY;
  if (!chiave) return NextResponse.json({ errore: "Chiave OpenAI non configurata." }, { status: 503 });

  const d = await caricaDati(supabase);
  const avvisi = calcolaAvvisi(d).map((a) => a.titolo);
  const risposta = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${chiave}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 500,
      messages: [
        { role: "system", content: ISTRUZIONI },
        { role: "user", content: JSON.stringify({ dati: riepilogoSettimana(d), avvisi }) },
      ],
    }),
  });
  if (!risposta.ok) return NextResponse.json({ errore: "L'IA non ha risposto. Riprova tra poco." }, { status: 502 });
  const json = await risposta.json();
  return NextResponse.json({ testo: json.choices?.[0]?.message?.content ?? "" });
}
