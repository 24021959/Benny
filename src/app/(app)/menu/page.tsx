import { MenuSettimana } from "@/components/menu-settimana";
import { Titolo } from "@/components/ui";
import { lunediDellaSettimana, oggi } from "@/lib/date";
import { richiediProprietario } from "@/lib/sessione";
import type { MealPlan, MealPlanItem, Recipe, ShoppingItem } from "@/lib/types";
import ricetteIniziali from "@/data/ricette.json";

export default async function Menu({ searchParams }: { searchParams: Promise<{ sett?: string }> }) {
  const { supabase, user } = await richiediProprietario();
  const param = (await searchParams).sett;
  const settimana = lunediDellaSettimana(param && /^\d{4}-\d{2}-\d{2}$/.test(param) ? param : oggi());

  let { data: ricette } = await supabase.from("peso_recipes").select("*");
  if (!ricette?.length) {
    await supabase.from("peso_recipes").insert(ricetteIniziali);
    ricette = (await supabase.from("peso_recipes").select("*")).data;
  }
  const { data: piano } = await supabase.from("peso_meal_plans").select("*").eq("settimana_inizio", settimana).maybeSingle();
  const [voci, spesa] = piano
    ? await Promise.all([
        supabase.from("peso_meal_plan_items").select("*").eq("plan_id", piano.id),
        supabase.from("peso_shopping_items").select("*").eq("plan_id", piano.id).order("nome"),
      ])
    : [{ data: [] }, { data: [] }];
  return (
    <div>
      <Titolo sotto="Colazione e pranzo, senza zuccheri e senza carboidrati. La cena si salta.">Menu della settimana</Titolo>
      <MenuSettimana settimana={settimana} piano={(piano as MealPlan) ?? null} voci={(voci.data ?? []) as MealPlanItem[]} ricette={(ricette ?? []) as Recipe[]} spesa={(spesa.data ?? []) as ShoppingItem[]} userId={user.id} />
    </div>
  );
}
