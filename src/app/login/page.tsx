"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [modo, setModo] = useState<"accedi" | "registrati">("accedi");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [attesa, setAttesa] = useState(false);

  async function invia(e: React.FormEvent) {
    e.preventDefault();
    setErrore(null);
    setInfo(null);
    setAttesa(true);
    const supabase = createClient();
    if (modo === "accedi") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErrore("Email o password non corrette.");
      else router.replace("/");
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (error) setErrore(error.message);
      else if (data.session) router.replace("/");
      else setInfo("Ti ho mandato una email: aprila e tocca il link per confermare, poi torna qui ad accedere.");
    }
    setAttesa(false);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 grid size-20 place-items-center rounded-3xl bg-brand text-brandink shadow-lg">
          <Activity className="size-10" strokeWidth={2.5} />
        </div>
        <h1 className="h-page">App perdita peso</h1>
        <p className="mt-2 text-lg text-muted">Il tuo diario personale di salute</p>
      </div>
      <form onSubmit={invia} className="card space-y-5">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" className="input" type="password" autoComplete={modo === "accedi" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {errore && <p role="alert" className="rounded-2xl bg-badsoft p-3 text-base text-bad">{errore}</p>}
        {info && <p className="rounded-2xl bg-infosoft p-3 text-base">{info}</p>}
        <button className="btn w-full" disabled={attesa}>{attesa ? "Attendi…" : modo === "accedi" ? "Accedi" : "Crea account"}</button>
        <button type="button" className="w-full text-center text-base font-semibold text-brand" onClick={() => setModo(modo === "accedi" ? "registrati" : "accedi")}>
          {modo === "accedi" ? "Prima volta? Crea l'account" : "Ho già un account"}
        </button>
      </form>
    </main>
  );
}
