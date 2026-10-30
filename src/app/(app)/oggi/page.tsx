import { FormOggi } from "@/components/form-oggi";
import { SelettoreData } from "@/components/selettore-data";
import { Titolo } from "@/components/ui";
import { formattaData, oggi } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import { richiediProprietario } from "@/lib/sessione";
import type { DailyLog } from "@/lib/types";

export default async function Oggi({ searchParams }: { searchParams: Promise<{ data?: string }> }) {
  const { user } = await richiediProprietario();
  const supabase = await createClient();
  const parametro = (await searchParams).data;
  const data = parametro && /^\d{4}-\d{2}-\d{2}$/.test(parametro) && parametro <= oggi() ? parametro : oggi();
  const [{ data: log }, { data: ultimo }] = await Promise.all([
    supabase.from("peso_daily_logs").select("*").eq("data", data).maybeSingle(),
    supabase.from("peso_daily_logs").select("peso_kg").not("peso_kg", "is", null).order("data", { ascending: false }).limit(1).maybeSingle(),
  ]);
  return (
    <div>
      <Titolo sotto={<span className="capitalize">{formattaData(data)}</span>}>Registro di oggi</Titolo>
      <SelettoreData data={data} max={oggi()} />
      <FormOggi key={data} data={data} iniziale={(log as DailyLog) ?? null} userId={user.id} ultimoPeso={ultimo?.peso_kg ? Number(ultimo.peso_kg) : null} />
    </div>
  );
}
