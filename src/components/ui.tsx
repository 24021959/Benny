import type { ReactNode } from "react";
import type { Avviso } from "@/lib/types";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";

export function Riquadro({ etichetta, valore, unita, nota, tono = "neutro", icona }: {
  etichetta: string; valore: ReactNode; unita?: string; nota?: ReactNode; tono?: "neutro" | "ok" | "warn" | "bad"; icona?: ReactNode;
}) {
  const colore = { neutro: "", ok: "text-ok", warn: "text-warn", bad: "text-bad" }[tono];
  return (
    <div className="card flex flex-col justify-between !p-4 sm:!p-5">
      <div className="flex items-center justify-between gap-2 text-base font-semibold text-muted">
        <span>{etichetta}</span>
        {icona && <span className="text-brand">{icona}</span>}
      </div>
      <div className={`mt-2 flex items-baseline gap-1.5 ${colore}`}>
        <span className="text-4xl font-bold tracking-tight tabular-nums sm:text-[2.6rem]">{valore}</span>
        {unita && <span className="text-lg font-semibold text-muted">{unita}</span>}
      </div>
      {nota && <p className="mt-1 text-sm text-muted">{nota}</p>}
    </div>
  );
}

export function ListaAvvisi({ avvisi }: { avvisi: Avviso[] }) {
  if (!avvisi.length) return null;
  const stile = {
    importante: { box: "bg-badsoft border-bad/30", ico: <ShieldAlert className="size-7 shrink-0 text-bad" /> },
    attenzione: { box: "bg-warnsoft border-warn/30", ico: <AlertTriangle className="size-7 shrink-0 text-warn" /> },
    info: { box: "bg-infosoft border-line", ico: <Info className="size-7 shrink-0 text-brand" /> },
  } as const;
  return (
    <div className="space-y-3">
      {avvisi.map((a) => (
        <div key={a.tipo} role="alert" className={`flex gap-4 rounded-3xl border p-4 sm:p-5 ${stile[a.gravita].box}`}>
          {stile[a.gravita].ico}
          <div>
            <p className="text-lg font-bold">{a.titolo}</p>
            <p className="mt-0.5 text-base">{a.messaggio}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Titolo({ children, sotto }: { children: ReactNode; sotto?: ReactNode }) {
  return (
    <header className="mb-6">
      <h1 className="h-page">{children}</h1>
      {sotto && <p className="mt-1 text-lg text-muted">{sotto}</p>}
    </header>
  );
}
