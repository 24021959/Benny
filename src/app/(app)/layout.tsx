import { NavDesktop, NavMobile } from "@/components/nav";
import { richiediProprietario } from "@/lib/sessione";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await richiediProprietario();
  return (
    <div className="flex min-h-screen">
      <NavDesktop />
      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-8 lg:pb-12 lg:pt-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
      <NavMobile />
    </div>
  );
}
