import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check, Copy, Upload, ChevronRight, ChevronLeft, Trash2, RotateCcw, Pencil,
  Plus, Play, AlertTriangle, CheckCircle2, ExternalLink, Film, Camera,
} from 'lucide-react';
import { saveVideo, deleteVideo, useReelSrc } from './lib/videoStore.js';
import { LOCANDA, parseCoords, distanceKm, buildPlan, planToText } from './lib/flightPlan.js';

const STEPS = ['Destinazione', 'Piano di volo', 'Render', 'Carica video', 'Copertina', 'Pubblica'];

const EMPTY = {
  title: '',
  category: 'Borghi Marinari',
  timeFromInn: '15 min',
  distance: '10 km',
  coordinates: '',
  bestTime: "18:00 (Luce d'oro)",
  parkingTip: '',
  description: '',
  waypoints: 'Decollo Locanda, Salita in quota, Glide, Orbita',
  duration: 18,
  peakAlt: 450,
  videoUrl: '',
  videoBlobId: '',
  thumbnail: '',
};

const FFMPEG =
  "ffmpeg -framerate 30 -pattern_type glob -i '*.jpg' -vf scale=1080:1920 -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart volo.mp4";

const EARTH_STUDIO_CHECKS = [
  'Ho aperto earth.google.com/studio e creato un nuovo progetto',
  'Ho inserito i 5 keyframe del piano di volo (tempo, posizione, quota, tilt, heading)',
  "Nell'ultimo tratto ho usato il punto di interesse come Target (Look at)",
  "Nell'anteprima il movimento è fluido (interpolazione smooth)",
  'Render: dimensioni personalizzate 1080×1920, 30 fps',
  "Le attribuzioni Google (Google Earth, Landsat / Copernicus) restano visibili nel fotogramma",
  'Ho scaricato il render e (se è una sequenza di immagini) l\'ho convertito in MP4',
];

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-stone-950 border border-stone-700 text-white focus:border-amber-500 outline-none';

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-stone-400 mb-1">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-stone-500 mt-1 leading-relaxed">{hint}</p>}
    </div>
  );
}

function CopyButton({ text, label = 'Copia' }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* ignore */ }
      document.body.removeChild(ta);
    }
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-800 hover:bg-stone-700 text-[11px] font-semibold text-stone-100"
    >
      {done ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      {done ? 'Copiato' : label}
    </button>
  );
}

export default function Studio({ flythroughs, categories, fallbackThumb, onSave, onDelete, onReset, onPlay }) {
  const [mode, setMode] = useState('list'); // list | wizard
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [oldBlobId, setOldBlobId] = useState('');
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [meta, setMeta] = useState(null);
  const [checks, setChecks] = useState({});
  const [coverTime, setCoverTime] = useState(1);
  const [coverMsg, setCoverMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);

  const existingSrc = useReelSrc({ videoBlobId: form.videoBlobId, videoUrl: form.videoUrl });
  const previewSrc = fileUrl || existingSrc;

  useEffect(() => () => { if (fileUrl) URL.revokeObjectURL(fileUrl); }, [fileUrl]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const target = useMemo(() => parseCoords(form.coordinates), [form.coordinates]);
  const plan = useMemo(
    () => (target ? buildPlan(target, { duration: Number(form.duration) || 18, peakAlt: Number(form.peakAlt) || 450 }) : []),
    [target, form.duration, form.peakAlt]
  );
  const straightKm = target ? distanceKm(LOCANDA, target) : null;

  // ---------- azioni ----------
  const startNew = () => {
    setForm(EMPTY); setEditingId(null); setOldBlobId(''); setFile(null); setFileUrl('');
    setMeta(null); setChecks({}); setCoverMsg(''); setError(''); setStep(0); setMode('wizard');
  };

  const startEdit = (reel) => {
    setForm({
      ...EMPTY,
      ...reel,
      waypoints: (reel.waypoints || []).join(', '),
      peakAlt: parseInt(reel.altitudePeak, 10) || 450,
      videoBlobId: reel.videoBlobId || '',
      videoUrl: reel.videoUrl || '',
    });
    setEditingId(reel.id); setOldBlobId(reel.videoBlobId || ''); setFile(null); setFileUrl('');
    setMeta(null); setChecks({}); setCoverMsg(''); setError(''); setStep(0); setMode('wizard');
  };

  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError('');
    setFile(f);
    setMeta(null);
    setFileUrl(URL.createObjectURL(f));
  };

  const onMeta = (e) => {
    const v = e.currentTarget;
    setMeta({ w: v.videoWidth, h: v.videoHeight, duration: v.duration });
    if (v.duration && Number.isFinite(v.duration)) {
      setForm((f) => ({ ...f, duration: Math.min(60, Math.max(5, Math.round(v.duration))) }));
      setCoverTime(Math.min(1, v.duration / 2));
    }
  };

  const ratioOk = meta ? Math.abs(meta.w / meta.h - 9 / 16) < 0.02 : null;
  const sizeMb = file ? file.size / 1024 / 1024 : null;

  const seekCover = (t) => {
    setCoverTime(t);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = t;
    }
  };

  const captureCover = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) { setCoverMsg('Carica prima un video.'); return; }
    try {
      const c = document.createElement('canvas');
      c.width = 540;
      c.height = Math.round((v.videoHeight / v.videoWidth) * 540);
      c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
      const data = c.toDataURL('image/jpeg', 0.8);
      setForm((f) => ({ ...f, thumbnail: data }));
      setCoverMsg('Copertina impostata dal fotogramma scelto.');
    } catch {
      setCoverMsg("Non posso estrarre il fotogramma da un link esterno: incolla l'URL di un'immagine qui sotto.");
    }
  };

  const canNext = () => {
    if (step === 0) return form.title.trim() && target;
    if (step === 3) return Boolean(file || form.videoBlobId || form.videoUrl);
    return true;
  };

  const publish = async () => {
    setSaving(true);
    setError('');
    try {
      const id = editingId || 'custom-' + Date.now();
      let blobId = form.videoBlobId;
      let videoUrl = form.videoUrl;
      if (file) {
        blobId = 'vid-' + Date.now();
        await saveVideo(blobId, file);
        videoUrl = '';
        if (oldBlobId) await deleteVideo(oldBlobId);
      }
      const reel = {
        id,
        title: form.title.trim(),
        category: form.category,
        timeFromInn: form.timeFromInn,
        distance: form.distance,
        coordinates: form.coordinates,
        altitudePeak: `${Number(form.peakAlt) || 450} m`,
        speed: '48 km/h',
        bestTime: form.bestTime,
        parkingTip: form.parkingTip || 'Chiedi consiglio alla reception',
        description: form.description || 'Nuovo sorvolo scenografico inserito dallo staff della Locanda.',
        waypoints: form.waypoints.split(',').map((s) => s.trim()).filter(Boolean),
        thumbnail: form.thumbnail || fallbackThumb,
        videoUrl,
        videoBlobId: blobId || '',
        duration: Math.min(60, Math.max(5, Number(form.duration) || 18)),
        badge: editingId ? undefined : 'Nuovo Volo',
      };
      onSave(reel);
      setMode('list');
    } catch (err) {
      setError('Salvataggio non riuscito (spazio del browser pieno?). Prova con un video più leggero.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ---------- LISTA ----------
  if (mode === 'list') {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        <button
          onClick={startNew}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
        >
          <Plus size={16} /> Crea un nuovo volo (guidato)
        </button>

        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-stone-300 leading-relaxed">
          La procedura ti accompagna in 6 passi: destinazione, piano di volo per Google Earth Studio, render,
          caricamento del video, copertina e pubblicazione.
        </div>

        <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 space-y-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-serif font-bold text-white text-sm">Voli pubblicati ({flythroughs.length})</h3>
            <button onClick={onReset} className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-amber-300">
              <RotateCcw size={12} /> Ripristina
            </button>
          </div>
          {flythroughs.map((f) => (
            <div key={f.id} className="flex items-center gap-2 py-2 border-t border-stone-800 first:border-0">
              <div className="min-w-0 flex-1">
                <p className="truncate text-stone-100 font-medium">{f.title}</p>
                <p className="text-[10px] text-stone-500">
                  {f.videoBlobId ? 'Video caricato (solo questo dispositivo)' : 'Video da link'}
                </p>
              </div>
              <button onClick={() => onPlay(f.id)} aria-label={`Guarda ${f.title}`} className="p-1.5 rounded text-stone-400 hover:text-amber-300">
                <Play size={14} />
              </button>
              <button onClick={() => startEdit(f)} aria-label={`Modifica ${f.title}`} className="p-1.5 rounded text-stone-400 hover:text-amber-300">
                <Pencil size={14} />
              </button>
              <button
                onClick={() => onDelete(f.id)}
                disabled={flythroughs.length <= 1}
                aria-label={`Elimina ${f.title}`}
                className="p-1.5 rounded text-stone-500 hover:text-rose-400 disabled:opacity-30"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------- PROCEDURA GUIDATA ----------
  return (
    <div className="flex-1 flex flex-col min-h-0 text-xs">
      {/* indicatore passi */}
      <div className="px-4 pt-3 pb-2 border-b border-stone-800 bg-stone-950">
        <div className="flex items-center justify-between mb-2">
          <p className="text-amber-300 font-semibold">
            Passo {step + 1} di {STEPS.length}: {STEPS[step]}
          </p>
          <button onClick={() => setMode('list')} className="text-[11px] text-stone-400 hover:text-white">
            Esci
          </button>
        </div>
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => (i <= step || canNext() ? setStep(i) : null)}
              aria-label={s}
              className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-amber-400' : i === step ? 'bg-amber-300' : 'bg-stone-700'}`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* PASSO 1 */}
        {step === 0 && (
          <div className="space-y-3.5">
            <Field label="Nome monumento / destinazione">
              <input value={form.title} onChange={set('title')} placeholder="Es. Castello di Fosdinovo" className={inputCls} />
            </Field>
            <Field
              label="Coordinate GPS del punto di interesse (lat, lng)"
              hint={
                target
                  ? `Distanza in linea d'aria dalla Locanda: ${straightKm.toFixed(1)} km (quella stradale è maggiore).`
                  : 'Su Google Maps: tocca a lungo il punto, poi copia le due cifre in alto (es. 44.0761, 9.9114).'
              }
            >
              <input value={form.coordinates} onChange={set('coordinates')} placeholder="44.0761, 9.9114" className={inputCls} />
              {form.coordinates && !target && <p className="text-[10px] text-rose-400 mt-1">Coordinate non valide.</p>}
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Categoria">
                <select value={form.category} onChange={set('category')} className={inputCls}>
                  {categories.filter((c) => c !== 'Tutti').map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Minuti di auto">
                <input value={form.timeFromInn} onChange={set('timeFromInn')} className={inputCls} />
              </Field>
              <Field label="Distanza stradale">
                <input value={form.distance} onChange={set('distance')} className={inputCls} />
              </Field>
              <Field label="Momento migliore">
                <input value={form.bestTime} onChange={set('bestTime')} className={inputCls} />
              </Field>
            </div>
            <Field label="Consiglio dell'host (parcheggio / logistica)">
              <input value={form.parkingTip} onChange={set('parkingTip')} placeholder="Es. Parcheggio ai piedi delle mura" className={inputCls} />
            </Field>
            <Field label="Descrizione">
              <textarea rows={3} value={form.description} onChange={set('description')} className={inputCls} />
            </Field>
            <Field label="Tappe del volo (separate da virgola)">
              <input value={form.waypoints} onChange={set('waypoints')} className={inputCls} />
            </Field>
          </div>
        )}

        {/* PASSO 2 */}
        {step === 1 && (
          <div className="space-y-3.5">
            <p className="text-stone-300 leading-relaxed">
              Formula <strong className="text-amber-100">Launch &amp; Glide</strong>: partenza dalla Locanda, salita in
              quota, planata e orbita sul punto. Questi sono i valori da inserire come keyframe in Google Earth Studio.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Durata (secondi)">
                <input type="number" min="8" max="60" value={form.duration} onChange={set('duration')} className={inputCls} />
              </Field>
              <Field label="Quota massima (m)">
                <input type="number" min="100" max="1500" value={form.peakAlt} onChange={set('peakAlt')} className={inputCls} />
              </Field>
            </div>

            <div className="space-y-2">
              {plan.map((k, i) => (
                <div key={i} className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-amber-200">
                      {i + 1}. {k.name} <span className="text-stone-500 font-normal">· secondo {k.t}</span>
                    </p>
                  </div>
                  <p className="font-mono text-[11px] text-stone-300 mt-1 leading-relaxed">
                    Lat {k.lat.toFixed(5)} · Lng {k.lng.toFixed(5)}
                    <br />
                    Quota {k.alt} m · Tilt {k.tilt}° · Heading {k.heading}°
                  </p>
                  <p className="text-[10px] text-stone-500 mt-1">{k.note}</p>
                </div>
              ))}
            </div>
            <CopyButton text={planToText(plan, form.title)} label="Copia tutto il piano" />
            <p className="text-[10px] text-stone-500 leading-relaxed">
              Le coordinate di partenza usano Ameglia ({LOCANDA.lat}, {LOCANDA.lng}): se serve, correggile con la posizione
              esatta della Locanda.
            </p>
          </div>
        )}

        {/* PASSO 3 */}
        {step === 2 && (
          <div className="space-y-3.5">
            <a
              href="https://earth.google.com/studio/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-200 font-semibold"
            >
              <ExternalLink size={14} /> Apri Google Earth Studio
            </a>

            <div className="space-y-2">
              {EARTH_STUDIO_CHECKS.map((c, i) => (
                <label key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-stone-900 border border-stone-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(checks[i])}
                    onChange={() => setChecks((s) => ({ ...s, [i]: !s[i] }))}
                    className="mt-0.5 accent-amber-500"
                  />
                  <span className={checks[i] ? 'text-stone-500 line-through' : 'text-stone-200'}>{c}</span>
                </label>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-2">
              <p className="text-stone-300 leading-relaxed">
                Se Earth Studio ti dà una sequenza di immagini, trasformala in MP4 con ffmpeg (nella cartella delle immagini):
              </p>
              <pre className="whitespace-pre-wrap break-all text-[10px] text-amber-200 bg-stone-950 rounded-lg p-2 font-mono">{FFMPEG}</pre>
              <CopyButton text={FFMPEG} label="Copia comando" />
            </div>

            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-stone-300 leading-relaxed">
              <strong className="text-amber-100">Attribuzione Google:</strong> non ritagliare né coprire le scritte di
              attribuzione presenti nel video. Controlla anche i termini d'uso di Google Earth Studio per l'uso sul sito
              della struttura.
            </div>
          </div>
        )}

        {/* PASSO 4 */}
        {step === 3 && (
          <div className="space-y-3.5">
            <label className="flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-stone-700 hover:border-amber-500 cursor-pointer text-stone-300">
              <Upload size={22} className="text-amber-400" />
              <span className="font-semibold">{file ? file.name : 'Scegli il video MP4 dal dispositivo'}</span>
              <span className="text-[10px] text-stone-500">MP4, WebM o MOV · verticale 9:16</span>
              <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={onPickFile} className="hidden" />
            </label>

            {previewSrc && (
              <div className="flex gap-3 items-start">
                <div className="w-28 shrink-0 aspect-[9/16] rounded-lg overflow-hidden bg-black border border-stone-700">
                  <video
                    key={previewSrc}
                    ref={videoRef}
                    src={previewSrc}
                    onLoadedMetadata={onMeta}
                    autoPlay muted loop playsInline controls
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1.5 flex-1">
                  {meta && (
                    <>
                      <p className="text-stone-300">
                        {meta.w}×{meta.h} · {meta.duration.toFixed(1)} s{sizeMb ? ` · ${sizeMb.toFixed(1)} MB` : ''}
                      </p>
                      <p className={`flex items-start gap-1 ${ratioOk ? 'text-emerald-400' : 'text-amber-300'}`}>
                        {ratioOk ? <CheckCircle2 size={13} className="shrink-0 mt-0.5" /> : <AlertTriangle size={13} className="shrink-0 mt-0.5" />}
                        {ratioOk ? 'Formato verticale 9:16 corretto.' : 'Non è 9:16: nel reel verrà ritagliato.'}
                      </p>
                      {sizeMb > 40 && (
                        <p className="flex items-start gap-1 text-amber-300">
                          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                          File pesante per i telefoni degli ospiti: meglio sotto i 40 MB (usa il comando ffmpeg del passo 3).
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            <Field label="Oppure incolla il link a un video MP4 già online" hint="Il file caricato ha la precedenza sul link.">
              <input type="url" value={form.videoUrl} onChange={set('videoUrl')} placeholder="https://..." className={`${inputCls} text-[11px]`} />
            </Field>

            <p className="text-[10px] text-stone-500 leading-relaxed">
              I video caricati restano salvati su questo dispositivo. Per averli su tutti i telefoni degli ospiti serve
              un archivio online: lo colleghiamo nel passo successivo del progetto.
            </p>
          </div>
        )}

        {/* PASSO 5 */}
        {step === 4 && (
          <div className="space-y-3.5">
            {previewSrc ? (
              <>
                <div className="flex gap-3 items-start">
                  <div className="w-28 shrink-0 aspect-[9/16] rounded-lg overflow-hidden bg-black border border-stone-700">
                    <video
                      key={previewSrc}
                      ref={videoRef}
                      src={previewSrc}
                      onLoadedMetadata={onMeta}
                      muted playsInline preload="auto"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Field label={`Fotogramma: ${coverTime.toFixed(1)} s`}>
                      <input
                        type="range"
                        min="0"
                        max={meta?.duration || Number(form.duration) || 18}
                        step="0.1"
                        value={coverTime}
                        onChange={(e) => seekCover(Number(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                    </Field>
                    <button
                      type="button"
                      onClick={captureCover}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 text-stone-950 font-bold"
                    >
                      <Camera size={14} /> Usa questo fotogramma
                    </button>
                    {coverMsg && <p className="text-[11px] text-stone-300">{coverMsg}</p>}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-stone-400">Torna al passo 4 e carica un video per scegliere il fotogramma.</p>
            )}

            <div className="flex items-center gap-3">
              <div className="w-16 h-20 rounded-lg overflow-hidden bg-stone-800 border border-stone-700 shrink-0">
                {form.thumbnail && <img src={form.thumbnail} alt="Copertina" className="w-full h-full object-cover" />}
              </div>
              <p className="text-[11px] text-stone-400">
                {form.thumbnail ? 'Copertina attuale.' : 'Nessuna copertina: verrà usata un\'immagine generica.'}
              </p>
            </div>

            <Field label="Oppure URL di un'immagine di copertina">
              <input
                type="url"
                value={form.thumbnail.startsWith('data:') ? '' : form.thumbnail}
                onChange={set('thumbnail')}
                placeholder="https://..."
                className={`${inputCls} text-[11px]`}
              />
            </Field>
          </div>
        )}

        {/* PASSO 6 */}
        {step === 5 && (
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 flex gap-3">
              <div className="w-20 aspect-[9/16] rounded-lg overflow-hidden bg-black shrink-0">
                {(form.thumbnail || fallbackThumb) && (
                  <img src={form.thumbnail || fallbackThumb} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="min-w-0 space-y-1">
                <p className="font-serif font-bold text-white text-sm">{form.title}</p>
                <p className="text-amber-300">{form.category}</p>
                <p className="text-stone-400">{form.timeFromInn} · {form.distance}</p>
                <p className="text-stone-400 flex items-center gap-1">
                  <Film size={12} /> {file ? `Video caricato: ${file.name}` : form.videoBlobId ? 'Video già salvato' : form.videoUrl ? 'Video da link' : 'Nessun video'}
                </p>
                <p className="text-stone-400">{form.duration} s</p>
              </div>
            </div>
            {error && <p className="text-rose-400">{error}</p>}
            <button
              onClick={publish}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Check size={16} /> {saving ? 'Salvataggio…' : editingId ? 'Salva le modifiche' : 'Pubblica nel feed ospiti'}
            </button>
          </div>
        )}
      </div>

      {/* navigazione */}
      <div className="flex gap-2 p-3 border-t border-stone-800 bg-stone-950">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-stone-800 text-stone-200 font-semibold disabled:opacity-30"
        >
          <ChevronLeft size={14} /> Indietro
        </button>
        {step < STEPS.length - 1 && (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext()}
            className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold disabled:opacity-40"
          >
            Avanti <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
