import { Activity } from "lucide-react";
import { Benvenuto } from "@/components/benvenuto";
import { BottoneEsci } from "@/components/esci";
import { NavDesktop, NavMobile } from "@/components/nav";
import { caricaImpostazioni } from "@/lib/dati";
import { richiediProprietario } from "@/lib/sessione";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase } = await richiediProprietario();
  const { nome } = await caricaImpostazioni(supabase);
  return (
    <div className="flex min-h-screen">
      <Benvenuto nome={nome?.trim() || null} />
      <NavDesktop />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/90 px-4 py-2.5 backdrop-blur lg:hidden">
          <span className="flex items-center gap-2.5 text-lg font-bold">
            <span className="grid size-9 place-items-center rounded-xl bg-brand text-brandink"><Activity className="size-5" strokeWidth={2.5} /></span>
            Perdita peso
          </span>
          <BottoneEsci compatto />
        </header>
        <main className="px-4 pb-28 pt-6 sm:px-8 lg:pb-12 lg:pt-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
      <NavMobile />
    </div>
  );
}
