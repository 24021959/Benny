import { Download } from "lucide-react";
import { Titolo } from "@/components/ui";

const PERIODI = [
  { giorni: 30, label: "Ultimo mese" },
  { giorni: 90, label: "Ultimi 3 mesi" },
  { giorni: 180, label: "Ultimi 6 mesi" },
  { giorni: 365, label: "Ultimo anno" },
];

export default function Report() {
  return (
    <div className="space-y-6">
      <Titolo sotto="Un PDF di due pagine da stampare o mandare al medico: peso, pressione, glicemia, esami e terapia.">Report per il medico</Titolo>
      <div className="grid gap-4 sm:grid-cols-2">
        {PERIODI.map((p) => (
          <a key={p.giorni} href={`/api/report?giorni=${p.giorni}`} target="_blank" rel="noreferrer" className="card flex items-center gap-4 transition active:scale-[0.99]">
            <span className="grid size-14 place-items-center rounded-2xl bg-brandsoft text-brand"><Download className="size-7" /></span>
            <span><span className="block text-xl font-bold">{p.label}</span><span className="text-base text-muted">Scarica il PDF</span></span>
          </a>
        ))}
      </div>
    </div>
  );
}
