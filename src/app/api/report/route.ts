import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";
import { caricaDati } from "@/lib/dati";
import { oggi } from "@/lib/date";
import { ReportPdf } from "@/lib/report-pdf";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: ok } = await supabase.rpc("peso_is_owner");
  if (!ok) return NextResponse.json({ errore: "Non autorizzato" }, { status: 401 });
  const richiesti = Number(request.nextUrl.searchParams.get("giorni"));
  const giorni = [30, 60, 90, 180, 365].includes(richiesti) ? richiesti : 30;
  const d = await caricaDati(supabase, 400);
  const buffer = await renderToBuffer(ReportPdf({ d, giorni }));
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="report-medico-${oggi()}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
