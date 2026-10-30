import { FormEsame, StoricoEsami } from "@/components/esami";
import { Titolo } from "@/components/ui";
import { caricaDati } from "@/lib/dati";
import { richiediProprietario } from "@/lib/sessione";

export default async function Esami() {
  const { supabase, user } = await richiediProprietario();
  const d = await caricaDati(supabase, 30);
  return (
    <div className="space-y-6">
      <Titolo sotto="Archivio dei referti con i grafici di ogni valore nel tempo.">Esami del sangue</Titolo>
      <FormEsame userId={user.id} />
      <StoricoEsami tests={d.tests} risultati={d.risultati} />
    </div>
  );
}
