"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, MoreHorizontal } from "lucide-react";
import { altre, principali } from "./nav-voci";

const attivo = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

export function NavDesktop() {
  const path = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-line bg-card p-5 lg:flex">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid size-12 place-items-center rounded-2xl bg-brand text-brandink">
          <Activity className="size-7" strokeWidth={2.5} />
        </div>
        <span className="text-xl font-bold leading-tight">App perdita<br />peso</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1.5">
        {[...principali, ...altre].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-lg font-semibold transition ${attivo(path, href) ? "bg-brandsoft text-brand" : "text-muted hover:bg-card2"}`}>
            <Icon className="size-6" /> {label}
          </Link>
        ))}
      </nav>
      <form action="/auth/esci" method="post">
        <button className="w-full rounded-2xl px-4 py-3 text-left text-base font-semibold text-muted hover:bg-card2">Esci</button>
      </form>
    </aside>
  );
}

export function NavMobile() {
  const path = usePathname();
  const inAltro = altre.some((a) => attivo(path, a.href)) || path === "/altro";
  const voci = [...principali, { href: "/altro", label: "Altro", icon: MoreHorizontal }];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {voci.map(({ href, label, icon: Icon }) => {
          const on = href === "/altro" ? inAltro : attivo(path, href);
          return (
            <li key={href}>
              <Link href={href} className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold ${on ? "text-brand" : "text-muted"}`}>
                <span className={`grid h-8 w-14 place-items-center rounded-full transition ${on ? "bg-brandsoft" : ""}`}><Icon className="size-6" /></span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

