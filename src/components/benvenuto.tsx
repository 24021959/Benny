"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { FUSO } from "@/lib/date";

const CHIAVE = "benvenuto-visto";

function saluto(now = new Date()) {
  const ora = Number(new Intl.DateTimeFormat("it-IT", { hour: "numeric", hour12: false, timeZone: FUSO }).format(now));
  if (ora >= 5 && ora < 13) return "Buongiorno";
  if (ora >= 13 && ora < 18) return "Buon pomeriggio";
  return "Buonasera";
}

/** Schermata di benvenuto, mostrata una volta a ogni apertura dell'app. */
export function Benvenuto({ nome }: { nome: string | null }) {
  const [visibile, setVisibile] = useState(false);
  const [testo] = useState(() => saluto());

  useEffect(() => {
    try {
      if (sessionStorage.getItem(CHIAVE)) return;
      sessionStorage.setItem(CHIAVE, "1");
    } catch {
      // senza storage il benvenuto compare a ogni caricamento: va bene lo stesso
    }
    const apri = setTimeout(() => setVisibile(true), 0);
    const chiudi = setTimeout(() => setVisibile(false), 4500);
    return () => {
      clearTimeout(apri);
      clearTimeout(chiudi);
    };
  }, []);

  if (!visibile) return null;
  return (
    <div role="dialog" aria-label="Benvenuto" onClick={() => setVisibile(false)}
      className="fixed inset-0 z-50 grid place-items-center bg-bg/95 px-6 text-center backdrop-blur animate-[fade_0.4s_ease-out]">
      <div className="max-w-md">
        <div className="mx-auto mb-6 grid size-24 place-items-center rounded-[2rem] bg-brand text-brandink shadow-xl">
          <Activity className="size-12" strokeWidth={2.5} />
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{testo}{nome ? `, ${nome}` : ""}!</h1>
        <p className="mt-3 text-xl text-muted">
          {nome ? "Bentornato. Un passo alla volta, oggi come ieri." : "Bentornato. Imposta il tuo nome in Impostazioni per essere salutato."}
        </p>
        <button className="btn mt-8 w-full sm:w-auto sm:px-12" onClick={() => setVisibile(false)}>Iniziamo</button>
      </div>
    </div>
  );
}
