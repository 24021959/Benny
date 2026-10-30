import { Lightbulb } from "lucide-react";
import { RiassuntoIA } from "@/components/riassunto-ia";
import { ListaAvvisi, Titolo } from "@/components/ui";
import { calcolaAvvisi, calcolaConsigli } from "@/lib/avvisi";
import { caricaDati } from "@/lib/dati";
import { createClient } from "@/lib/supabase/server";

export default async function Consigli() {
  const d = await caricaDati(await createClient());
  const avvisi = calcolaAvvisi(d);
  const consigli = calcolaConsigli(d);
  return (
    <div className="space-y-6">
      <Titolo sotto="Generati dai tuoi dati. Non sostituiscono il parere del medico.">Consigli e avvisi</Titolo>
      {avvisi.length ? <ListaAvvisi avvisi={avvisi} /> : <div className="card text-lg">Nessun avviso: i tuoi valori sono in regola.</div>}
      <section className="card">
        <h2 className="h-section mb-3">Consigli per te</h2>
        <ul className="space-y-3">
          {consigli.map((c) => (
            <li key={c} className="flex gap-3 text-lg"><Lightbulb className="mt-1 size-6 shrink-0 text-brand" />{c}</li>
          ))}
        </ul>
      </section>
      <RiassuntoIA />
    </div>
  );
}
