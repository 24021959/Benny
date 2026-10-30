import { Farmaci, FormImpostazioni, Promemoria } from "@/components/impostazioni";
import { Titolo } from "@/components/ui";
import { caricaDati } from "@/lib/dati";
import { richiediProprietario } from "@/lib/sessione";
import type { Reminder } from "@/lib/types";

export default async function Impostazioni() {
  const { supabase } = await richiediProprietario();
  const d = await caricaDati(supabase, 7);
  const { data: promemoria } = await supabase.from("peso_reminders").select("*").order("ora");
  return (
    <div className="space-y-6">
      <Titolo sotto="Dati personali, obiettivi, soglie, farmaci e promemoria.">Impostazioni</Titolo>
      <Farmaci farmaci={d.farmaci} />
      <FormImpostazioni s={d.settings} />
      <Promemoria promemoria={(promemoria ?? []) as Reminder[]} />
    </div>
  );
}
