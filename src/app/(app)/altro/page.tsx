import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BottoneEsci } from "@/components/esci";
import { altre as vociAltro } from "@/components/nav-voci";

export default function Altro() {
  return (
    <div className="space-y-4">
      <h1 className="h-page">Altro</h1>
      <div className="card divide-y divide-line !p-2">
        {vociAltro.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-4 px-3 py-4 text-lg font-semibold">
            <span className="grid size-12 place-items-center rounded-2xl bg-brandsoft text-brand"><Icon className="size-6" /></span>
            <span className="flex-1">{label}</span>
            <ChevronRight className="size-5 text-muted" />
          </Link>
        ))}
      </div>
      <BottoneEsci />
    </div>
  );
}
