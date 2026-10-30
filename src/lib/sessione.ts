import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Verifica login e proprietà dell'app; al primo accesso con l'email giusta reclama l'app. */
export async function richiediProprietario() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  let { data: ok } = await supabase.rpc("peso_is_owner");
  if (!ok) {
    const { data: reclamato } = await supabase.rpc("peso_claim_owner");
    ok = reclamato;
  }
  if (!ok) redirect("/non-autorizzato");
  return { supabase, user: data.user };
}
