import type { SupabaseClient } from "@supabase/supabase-js";
import { aggiungiGiorni, oggi } from "./date";
import type {
  BpReading, DailyLog, FastingSession, GlucoseReading, LabResult, LabTest, Medication, Settings,
} from "./types";

export async function caricaImpostazioni(supabase: SupabaseClient): Promise<Settings> {
  const { data } = await supabase.from("peso_settings").select("*").maybeSingle();
  if (data) return data as Settings;
  const { data: creato, error } = await supabase.from("peso_settings").insert({}).select("*").single();
  if (error) throw error;
  return creato as Settings;
}

export type Dati = Awaited<ReturnType<typeof caricaDati>>;

export async function caricaDati(supabase: SupabaseClient, giorni = 400) {
  const da = aggiungiGiorni(oggi(), -giorni);
  const [settings, logs, bp, glicemie, digiuni, esami, farmaci] = await Promise.all([
    caricaImpostazioni(supabase),
    supabase.from("peso_daily_logs").select("*").gte("data", da).order("data"),
    supabase.from("peso_bp_readings").select("*").gte("misurata_il", da).order("misurata_il"),
    supabase.from("peso_glucose_readings").select("*").gte("misurata_il", da).order("misurata_il"),
    supabase.from("peso_fasting_sessions").select("*").order("inizio", { ascending: false }).limit(120),
    supabase.from("peso_lab_tests").select("*").order("data", { ascending: false }),
    supabase.from("peso_medications").select("*").eq("attivo", true),
  ]);
  const tests = (esami.data ?? []) as LabTest[];
  let risultati: LabResult[] = [];
  if (tests.length) {
    const { data } = await supabase.from("peso_lab_results").select("*").in("test_id", tests.map((t) => t.id));
    risultati = (data ?? []) as LabResult[];
  }
  const ultimoTest = tests[0];
  return {
    settings,
    logs: (logs.data ?? []) as DailyLog[],
    bp: (bp.data ?? []) as BpReading[],
    glicemie: (glicemie.data ?? []) as GlucoseReading[],
    digiuni: (digiuni.data ?? []) as FastingSession[],
    tests,
    risultati,
    esamiRecenti: ultimoTest ? risultati.filter((r) => r.test_id === ultimoTest.id) : [],
    farmaci: (farmaci.data ?? []) as Medication[],
  };
}
