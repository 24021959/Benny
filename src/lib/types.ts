export type Settings = {
  user_id: string;
  nome: string | null;
  data_nascita: string | null;
  altezza_cm: number;
  peso_iniziale_kg: number;
  data_inizio: string;
  obiettivo_min_kg: number;
  obiettivo_max_kg: number;
  pasti_inizio: string;
  pasti_fine: string;
  acqua_obiettivo_ml: number;
  max_calo_settimanale_kg: number;
  pa_sys_max: number;
  pa_dia_max: number;
  pa_sys_min: number;
  pa_dia_min: number;
  glicemia_min: number;
  glicemia_max: number;
  passi_obiettivo: number;
  email_promemoria: string | null;
};

export type DailyLog = {
  id: string;
  data: string;
  peso_kg: number | null;
  vita_cm: number | null;
  acqua_ml: number | null;
  energia: number | null;
  fame: number | null;
  sonno_ore: number | null;
  passi: number | null;
  dieta_rispettata: boolean | null;
  digiuno_rispettato: boolean | null;
  note: string | null;
};

export type BpReading = {
  id: string;
  misurata_il: string;
  sistolica: number;
  diastolica: number;
  battiti: number | null;
  note: string | null;
};

export type GlucoseReading = {
  id: string;
  misurata_il: string;
  mg_dl: number;
  tipo: "digiuno" | "post_pasto" | "altro";
  note: string | null;
};

export type FastingSession = { id: string; inizio: string; fine: string | null };

export type Medication = { id: string; nome: string; dose: string | null; note: string | null; attivo: boolean };

export type Ingrediente = { nome: string; quantita: number; unita: string; reparto: string };

export type Recipe = {
  id: string;
  nome: string;
  pasto: "colazione" | "pranzo";
  ingredienti: Ingrediente[];
  preparazione: string | null;
  proteine_g: number | null;
  grassi_g: number | null;
  carbo_netti_g: number | null;
  kcal: number | null;
  minuti: number | null;
  tag: string[];
};

export type MealPlan = { id: string; settimana_inizio: string; generato_il: string };
export type MealPlanItem = { id: string; plan_id: string; giorno: number; pasto: "colazione" | "pranzo"; recipe_id: string };
export type ShoppingItem = {
  id: string;
  plan_id: string;
  nome: string;
  quantita: number | null;
  unita: string | null;
  reparto: string;
  preso: boolean;
};

export type LabTest = { id: string; data: string; laboratorio: string | null; file_path: string | null; note: string | null };
export type LabResult = {
  id: string;
  test_id: string;
  analita: string;
  valore: number;
  unita: string | null;
  rif_min: number | null;
  rif_max: number | null;
};

export type Reminder = {
  id: string;
  tipo: "peso" | "acqua" | "pressione" | "glicemia" | "pasto" | "digiuno" | "esami" | "farmaco";
  ora: string;
  giorni: number[];
  messaggio: string | null;
  attivo: boolean;
};

export type Gravita = "info" | "attenzione" | "importante";
export type Avviso = { tipo: string; gravita: Gravita; titolo: string; messaggio: string };
