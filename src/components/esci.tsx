import { LogOut } from "lucide-react";

export function BottoneEsci({ compatto = false }: { compatto?: boolean }) {
  return (
    <form action="/auth/esci" method="post">
      <button aria-label="Esci" className={compatto
        ? "grid size-11 place-items-center rounded-xl border border-line bg-card2 text-muted active:scale-95"
        : "flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-lg font-semibold text-muted hover:bg-card2"}>
        <LogOut className={compatto ? "size-5" : "size-6"} />
        {!compatto && "Esci"}
      </button>
    </form>
  );
}
