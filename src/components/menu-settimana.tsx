"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Clock, RefreshCw, Shuffle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { altraRicetta, generaSettimana, listaSpesa } from "@/lib/menu";
import { aggiungiGiorni, formatta, GIORNI } from "@/lib/date";
import type { MealPlan, MealPlanItem, Recipe, ShoppingItem } from "@/lib/types";

const chiave = (nome: string, unita: string | null) => `${nome.trim().toLowerCase()}|${unita ?? ""}`;

async function ricostruisciSpesa(planId: string, userId: string, ricette: Recipe[], precedenti: ShoppingItem[]) {
  const supabase = createClient();
  const { data: voci } = await supabase.from("peso_meal_plan_items").select("recipe_id").eq("plan_id", planId);
  const usate = (voci ?? []).map((v) => ricette.find((r) => r.id === v.recipe_id)).filter((r): r is Recipe => !!r);
  const presi = new Set(precedenti.filter((p) => p.preso).map((p) => chiave(p.nome, p.unita)));
  await supabase.from("peso_shopping_items").delete().eq("plan_id", planId);
  const nuove = listaSpesa(usate).map((v) => ({
    plan_id: planId, user_id: userId, nome: v.nome, quantita: Math.round(v.quantita * 10) / 10, unita: v.unita, reparto: v.reparto,
    preso: presi.has(chiave(v.nome, v.unita)),
  }));
  if (nuove.length) await supabase.from("peso_shopping_items").insert(nuove);
}

export function MenuSettimana({ settimana, piano, voci, ricette, spesa, userId }: {
  settimana: string; piano: MealPlan | null; voci: MealPlanItem[]; ricette: Recipe[]; spesa: ShoppingItem[]; userId: string;
}) {
  const router = useRouter();
  const [attesa, setAttesa] = useState(false);
  const [tab, setTab] = useState<"menu" | "spesa">("menu");
  const perId = new Map(ricette.map((r) => [r.id, r]));

  async function rigeneraTutto() {
    if (piano && !confirm("Rigenerare tutto il menu di questa settimana?")) return;
    setAttesa(true);
    const supabase = createClient();
    let id = piano?.id;
    if (!id) {
      const { data } = await supabase.from("peso_meal_plans").insert({ settimana_inizio: settimana }).select("id").single();
      id = data!.id as string;
    } else {
      await supabase.from("peso_meal_plans").update({ generato_il: new Date().toISOString() }).eq("id", id);
      await supabase.from("peso_meal_plan_items").delete().eq("plan_id", id);
    }
    await supabase.from("peso_meal_plan_items").insert(generaSettimana(ricette).map((s) => ({ ...s, plan_id: id, user_id: userId })));
    await ricostruisciSpesa(id, userId, ricette, spesa);
    setAttesa(false);
    router.refresh();
  }

  async function cambia(v: MealPlanItem) {
    setAttesa(true);
    const nuova = altraRicetta(ricette, v.pasto, voci.map((x) => x.recipe_id), v.recipe_id);
    await createClient().from("peso_meal_plan_items").update({ recipe_id: nuova.id }).eq("id", v.id);
    await ricostruisciSpesa(v.plan_id, userId, ricette, spesa);
    setAttesa(false);
    router.refresh();
  }

  async function spunta(s: ShoppingItem) {
    await createClient().from("peso_shopping_items").update({ preso: !s.preso }).eq("id", s.id);
    router.refresh();
  }

  const ORDINE = ["Frutta e verdura", "Carne e pesce", "Latticini e uova", "Dispensa", "Altro"];
  const reparti = [...new Set(spesa.map((s) => s.reparto))].sort((a, b) => ORDINE.indexOf(a) - ORDINE.indexOf(b));
  const fine = aggiungiGiorni(settimana, 6);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button aria-label="Settimana precedente" className="btn-ghost !min-h-12 !px-3" onClick={() => router.push(`/menu?sett=${aggiungiGiorni(settimana, -7)}`)}><ChevronLeft className="size-6" /></button>
          <span className="min-w-44 text-center text-lg font-bold">{formatta(settimana)} – {formatta(fine, "d MMM")}</span>
          <button aria-label="Settimana successiva" className="btn-ghost !min-h-12 !px-3" onClick={() => router.push(`/menu?sett=${aggiungiGiorni(settimana, 7)}`)}><ChevronRight className="size-6" /></button>
        </div>
        <button onClick={rigeneraTutto} disabled={attesa || !ricette.length} className="btn ml-auto"><RefreshCw className={`size-5 ${attesa ? "animate-spin" : ""}`} />{piano ? "Rigenera settimana" : "Genera menu"}</button>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-card2 p-1 lg:hidden">
        {(["menu", "spesa"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`min-h-12 rounded-xl text-lg font-semibold ${tab === t ? "bg-card text-brand shadow-sm" : "text-muted"}`}>{t === "menu" ? "Menu" : `Spesa (${spesa.filter((s) => !s.preso).length})`}</button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className={`space-y-4 ${tab === "spesa" ? "hidden lg:block" : ""}`}>
          {!piano && <div className="card text-center text-lg text-muted">Nessun menu per questa settimana. Tocca <b>Genera menu</b>.</div>}
          {piano && GIORNI.map((nome, g) => (
            <section key={g} className="card !p-4 sm:!p-5">
              <h2 className="h-section mb-3">{nome} <span className="text-base font-medium text-muted">{formatta(aggiungiGiorni(settimana, g))}</span></h2>
              <div className="grid gap-3 md:grid-cols-2">
                {(["colazione", "pranzo"] as const).map((pasto) => {
                  const v = voci.find((x) => x.giorno === g && x.pasto === pasto);
                  const r = v && perId.get(v.recipe_id);
                  if (!v || !r) return null;
                  return (
                    <details key={pasto} className="group rounded-2xl border border-line bg-card2 p-4">
                      <summary className="flex cursor-pointer list-none items-start gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-bold uppercase tracking-wide text-brand">{pasto}</p>
                          <p className="text-lg font-bold leading-snug">{r.nome}</p>
                          <p className="mt-0.5 flex flex-wrap gap-x-3 text-sm text-muted">
                            <span>{r.kcal} kcal</span><span>P {r.proteine_g} g</span><span>carbo {r.carbo_netti_g} g</span>
                            {r.minuti && <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{r.minuti} min</span>}
                          </p>
                        </div>
                        <button type="button" aria-label="Cambia ricetta" disabled={attesa} onClick={(e) => { e.preventDefault(); cambia(v); }} className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-card text-brand"><Shuffle className="size-5" /></button>
                      </summary>
                      <div className="mt-3 border-t border-line pt-3 text-base">
                        <ul className="mb-2 list-disc pl-5">{r.ingredienti.map((i, k) => <li key={k}>{i.nome} <span className="text-muted">{i.quantita} {i.unita}</span></li>)}</ul>
                        {r.preparazione && <p className="text-muted">{r.preparazione}</p>}
                      </div>
                    </details>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <aside className={`${tab === "menu" ? "hidden lg:block" : ""}`}>
          <section className="card lg:sticky lg:top-6">
            <h2 className="h-section mb-3">Lista della spesa</h2>
            {spesa.length === 0 && <p className="text-lg text-muted">Genera il menu per vedere la lista.</p>}
            {reparti.map((rep) => (
              <div key={rep} className="mb-4">
                <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-brand">{rep}</h3>
                <ul>
                  {spesa.filter((s) => s.reparto === rep).map((s) => (
                    <li key={s.id}>
                      <label className="flex min-h-12 cursor-pointer items-center gap-3 py-1">
                        <input type="checkbox" checked={s.preso} onChange={() => spunta(s)} className="size-6 accent-[var(--brand)]" />
                        <span className={`flex-1 text-lg ${s.preso ? "text-muted line-through" : ""}`}>{s.nome}</span>
                        <span className="text-base text-muted">{s.quantita} {s.unita}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
}
