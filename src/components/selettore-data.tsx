"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { aggiungiGiorni } from "@/lib/date";

export function SelettoreData({ data, max }: { data: string; max: string }) {
  const router = useRouter();
  const vai = (d: string) => router.push(d === max ? "/oggi" : `/oggi?data=${d}`);
  return (
    <div className="mb-5 flex items-center gap-2">
      <button aria-label="Giorno precedente" className="btn-ghost !min-h-12 !px-3" onClick={() => vai(aggiungiGiorni(data, -1))}><ChevronLeft className="size-6" /></button>
      <input type="date" className="input !min-h-12 flex-1 text-center" value={data} max={max} onChange={(e) => e.target.value && vai(e.target.value)} />
      <button aria-label="Giorno successivo" disabled={data >= max} className="btn-ghost !min-h-12 !px-3 disabled:opacity-40" onClick={() => vai(aggiungiGiorni(data, 1))}><ChevronRight className="size-6" /></button>
    </div>
  );
}
