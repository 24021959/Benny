"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ANALITI } from "@/lib/analiti";
import { GraficoLinee } from "@/components/grafici";
import { formatta } from "@/lib/date";
import type { LabResult, LabTest } from "@/lib/types";

type Riga = { analita: string; valore: string; unita: string; min: string; max: string };
const vuota = (): Riga => ({ analita: "", valore: "", unita: "", min: "", max: "" });
const n = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));

export function FormEsame({ userId }: { userId: string }) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const [data, setData] = useState(new Date().toLocaleDateString("sv-SE"));
  const [lab, setLab] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [righe, setRighe] = useState<Riga[]>([vuota()]);
  const [attesa, setAttesa] = useState(false);
  const [err, setErr] = useState("");

  function scegli(i: number, nome: string) {
    const a = ANALITI.find((x) => x.nome === nome);
    setRighe((r) => r.map((x, k) => (k === i ? { ...x, analita: nome, unita: a?.unita ?? x.unita, min: a?.min?.toString() ?? "", max: a?.max?.toString() ?? "" } : x)));
  }
  const imposta = (i: number, campo: keyof Riga, v: string) => setRighe((r) => r.map((x, k) => (k === i ? { ...x, [campo]: v } : x)));

  async function salva(e: React.FormEvent) {
    e.preventDefault();
    const valide = righe.filter((r) => r.analita.trim() && n(r.valore) != null);
    if (!valide.length && !file) return setErr("Inserisci almeno un valore o allega il referto.");
    setAttesa(true); setErr("");
    const supabase = createClient();
    let percorso: string | null = null;
    if (file) {
      const estensione = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
      percorso = `${userId}/${crypto.randomUUID()}.${estensione}`;
      const { error } = await supabase.storage.from("peso-esami").upload(percorso, file, { contentType: file.type });
      if (error) { setAttesa(false); return setErr("Caricamento del file non riuscito (max 15 MB, PDF o immagine)."); }
    }
    const { data: test, error } = await supabase.from("peso_lab_tests").insert({ data, laboratorio: lab.trim() || null, file_path: percorso }).select("id").single();
    if (error || !test) { setAttesa(false); return setErr("Non sono riuscito a salvare l'esame."); }
    if (valide.length) {
      await supabase.from("peso_lab_results").insert(valide.map((r) => ({
        test_id: test.id, analita: r.analita.trim(), valore: n(r.valore), unita: r.unita.trim() || null, rif_min: n(r.min), rif_max: n(r.max),
      })));
    }
    setAttesa(false); setAperto(false); setRighe([vuota()]); setFile(null); setLab("");
    router.refresh();
  }

  if (!aperto) return <button className="btn" onClick={() => setAperto(true)}><Plus className="size-6" />Aggiungi esame</button>;
  return (
    <form onSubmit={salva} className="card space-y-5">
      <div className="flex items-center justify-between"><h2 className="h-section">Nuovo esame del sangue</h2><button type="button" aria-label="Chiudi" onClick={() => setAperto(false)} className="grid size-11 place-items-center rounded-xl hover:bg-card2"><X className="size-6" /></button></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="dt">Data del prelievo</label><input id="dt" type="date" required className="input" value={data} onChange={(e) => setData(e.target.value)} /></div>
        <div><label className="label" htmlFor="lab">Laboratorio</label><input id="lab" className="input" value={lab} onChange={(e) => setLab(e.target.value)} /></div>
      </div>
      <div>
        <label className="label" htmlFor="file">Referto (PDF o foto, facoltativo)</label>
        <input id="file" type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="input !py-3.5 file:mr-3 file:rounded-xl file:border-0 file:bg-brandsoft file:px-4 file:py-2 file:font-semibold file:text-brand" />
      </div>
      <datalist id="analiti">{ANALITI.map((a) => <option key={a.nome} value={a.nome} />)}</datalist>
      <div className="space-y-3">
        <p className="label !mb-0">Valori</p>
        {righe.map((r, i) => (
          <div key={i} className="grid grid-cols-6 gap-2 rounded-2xl border border-line bg-card2 p-3">
            <input list="analiti" aria-label="Esame" placeholder="Nome (es. Creatinina)" className="input col-span-6 !min-h-12 !text-lg sm:col-span-3" value={r.analita} onChange={(e) => scegli(i, e.target.value)} />
            <input aria-label="Valore" inputMode="decimal" placeholder="Valore" className="input col-span-3 !min-h-12 !text-lg sm:col-span-2" value={r.valore} onChange={(e) => imposta(i, "valore", e.target.value)} />
            <input aria-label="Unità" placeholder="Unità" className="input col-span-3 !min-h-12 !text-lg sm:col-span-1" value={r.unita} onChange={(e) => imposta(i, "unita", e.target.value)} />
            <input aria-label="Minimo" inputMode="decimal" placeholder="Min" className="input col-span-2 !min-h-12 !text-lg" value={r.min} onChange={(e) => imposta(i, "min", e.target.value)} />
            <input aria-label="Massimo" inputMode="decimal" placeholder="Max" className="input col-span-2 !min-h-12 !text-lg" value={r.max} onChange={(e) => imposta(i, "max", e.target.value)} />
            <button type="button" aria-label="Rimuovi riga" onClick={() => setRighe((x) => x.filter((_, k) => k !== i))} className="col-span-2 grid place-items-center rounded-2xl text-muted hover:bg-badsoft hover:text-bad"><Trash2 className="size-5" /></button>
          </div>
        ))}
        <button type="button" className="btn-ghost w-full" onClick={() => setRighe((r) => [...r, vuota()])}><Plus className="size-5" />Aggiungi valore</button>
        <p className="text-sm text-muted">Min e Max sono valori generici: correggili con quelli scritti sul referto del laboratorio.</p>
      </div>
      {err && <p role="alert" className="rounded-2xl bg-badsoft p-3 text-base text-bad">{err}</p>}
      <button className="btn w-full" disabled={attesa}>{attesa ? "Salvo…" : "Salva esame"}</button>
    </form>
  );
}

export function StoricoEsami({ tests, risultati }: { tests: LabTest[]; risultati: LabResult[] }) {
  const router = useRouter();
  const nomi = useMemo(() => [...new Set(risultati.map((r) => r.analita))].sort((a, b) => a.localeCompare(b, "it")), [risultati]);
  const [scelto, setScelto] = useState(nomi[0] ?? "");
  const nomeAttivo = nomi.includes(scelto) ? scelto : nomi[0];
  const dataDi = new Map(tests.map((t) => [t.id, t.data]));
  const serie = risultati.filter((r) => r.analita === nomeAttivo).map((r) => ({ data: dataDi.get(r.test_id)!, v: r.valore, r })).sort((a, b) => a.data.localeCompare(b.data));
  const ultimo = serie[serie.length - 1]?.r;
  const fascia: [number, number] | undefined = ultimo && (ultimo.rif_min != null || ultimo.rif_max != null)
    ? [ultimo.rif_min ?? 0, ultimo.rif_max ?? Math.max(...serie.map((s) => s.v)) * 1.5] : undefined;

  async function apri(percorso: string) {
    const { data } = await createClient().storage.from("peso-esami").createSignedUrl(percorso, 120);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }
  async function elimina(t: LabTest) {
    if (!confirm("Eliminare questo esame e i suoi valori?")) return;
    const supabase = createClient();
    if (t.file_path) await supabase.storage.from("peso-esami").remove([t.file_path]);
    await supabase.from("peso_lab_tests").delete().eq("id", t.id);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {nomi.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {nomi.map((nm) => (
              <button key={nm} onClick={() => setScelto(nm)} className={`rounded-full border px-4 py-2 text-base font-semibold ${nm === nomeAttivo ? "border-brand bg-brandsoft text-brand" : "border-line bg-card text-muted"}`}>{nm}</button>
            ))}
          </div>
          <GraficoLinee titolo={nomeAttivo} sottotitolo={fascia ? "Fascia verde = valori di riferimento" : undefined} dati={serie.map((s) => ({ data: s.data, v: s.v }))} serie={[{ key: "v", label: nomeAttivo, colore: "var(--c2)" }]} unita={ultimo?.unita ?? ""} decimali={1} fascia={fascia} giorniIniziali={100000} />
        </div>
      )}
      <section className="card">
        <h2 className="h-section mb-2">Esami caricati</h2>
        {tests.length === 0 && <p className="text-lg text-muted">Nessun esame ancora.</p>}
        <ul className="divide-y divide-line">
          {tests.map((t) => {
            const rr = risultati.filter((r) => r.test_id === t.id);
            const fuori = rr.filter((r) => (r.rif_min != null && r.valore < r.rif_min) || (r.rif_max != null && r.valore > r.rif_max));
            return (
              <li key={t.id} className="py-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-lg font-bold">{formatta(t.data, "d MMMM yyyy")}{t.laboratorio ? <span className="font-normal text-muted"> · {t.laboratorio}</span> : null}</p>
                    <p className="text-base text-muted">{rr.length} valori{fuori.length ? <span className="font-semibold text-bad"> · {fuori.length} fuori range</span> : ""}</p>
                  </div>
                  {t.file_path && <button className="btn-ghost !min-h-11 !px-3" onClick={() => apri(t.file_path!)}><FileText className="size-5" />Referto</button>}
                  <button aria-label="Elimina esame" onClick={() => elimina(t)} className="grid size-11 place-items-center rounded-xl text-muted hover:bg-badsoft hover:text-bad"><Trash2 className="size-5" /></button>
                </div>
                {rr.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {rr.map((r) => {
                      const f = fuori.includes(r);
                      return <span key={r.id} className={`rounded-full px-3 py-1 text-sm font-semibold ${f ? "bg-badsoft text-bad" : "bg-card2 text-muted"}`}>{r.analita}: {r.valore} {r.unita}</span>;
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
