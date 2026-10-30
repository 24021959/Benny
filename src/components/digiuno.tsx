"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Timer } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const OBIETTIVO_ORE = 16;

export function TimerDigiuno({ inizio, id }: { inizio: string | null; id: string | null }) {
  const router = useRouter();
  const [ora, setOra] = useState<number | null>(null);
  const [attesa, setAttesa] = useState(false);

  useEffect(() => {
    const aggiorna = () => setOra(Date.now());
    aggiorna();
    const t = setInterval(aggiorna, 1000);
    return () => clearInterval(t);
  }, []);

  async function avvia() {
    setAttesa(true);
    await createClient().from("peso_fasting_sessions").insert({});
    setAttesa(false);
    router.refresh();
  }
  async function ferma() {
    setAttesa(true);
    await createClient().from("peso_fasting_sessions").update({ fine: new Date().toISOString() }).eq("id", id!);
    setAttesa(false);
    router.refresh();
  }

  const secondi = inizio && ora ? Math.max(0, Math.floor((ora - new Date(inizio).getTime()) / 1000)) : 0;
  const h = Math.floor(secondi / 3600);
  const m = Math.floor((secondi % 3600) / 60);
  const s = secondi % 60;
  const perc = Math.min(100, (secondi / (OBIETTIVO_ORE * 3600)) * 100);
  const fatto = secondi >= OBIETTIVO_ORE * 3600;
  const R = 44;
  const C = 2 * Math.PI * R;

  return (
    <div className="card flex items-center gap-5 !p-4 sm:!p-5">
      <div className="relative size-28 shrink-0">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r={R} fill="none" stroke="var(--line)" strokeWidth="9" />
          <circle cx="50" cy="50" r={R} fill="none" stroke={fatto ? "var(--ok)" : "var(--brand)"} strokeWidth="9" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - perc / 100)} />
        </svg>
        <Timer className="absolute inset-0 m-auto size-8 text-brand" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-muted">Digiuno 16:8</p>
        {inizio ? (
          <>
            <p className="text-4xl font-bold tabular-nums tracking-tight">{String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}<span className="text-2xl text-muted">:{String(s).padStart(2, "0")}</span></p>
            <p className="text-sm text-muted">{fatto ? "Obiettivo di 16 ore raggiunto" : `Mancano ${Math.max(0, OBIETTIVO_ORE - h - 1)} h ${60 - m === 60 ? 0 : 60 - m} min a 16 ore`}</p>
            <button onClick={ferma} disabled={attesa} className="btn-ghost mt-3 !min-h-11 !text-base">Ho mangiato, fine digiuno</button>
          </>
        ) : (
          <>
            <p className="text-lg">Nessun digiuno in corso</p>
            <button onClick={avvia} disabled={attesa} className="btn mt-3 !min-h-11 !text-base">Ho finito di mangiare</button>
          </>
        )}
      </div>
    </div>
  );
}
