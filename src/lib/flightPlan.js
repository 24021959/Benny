// Punto di decollo: coordinate esatte della Locanda dell'Angelo (Ameglia).
export const LOCANDA = { name: "Locanda dell'Angelo (Ameglia)", lat: 44.06096018809498, lng: 9.996431985304694 };

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

export function parseCoords(str) {
  const parts = String(str || '').split(/[,;\s]+/).filter(Boolean).map(Number);
  if (parts.length >= 2 && parts.every(Number.isFinite)) {
    const [lat, lng] = parts;
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
  }
  return null;
}

export function bearing(a, b) {
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x =
    Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) -
    Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

export function distanceKm(a, b) {
  const R = 6371;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const along = (a, b, t) => ({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t });
const fix = (n, d = 5) => Number(n).toFixed(d);

// Piano "Launch & Glide": decollo dalla Locanda, salita in quota, planata, orbita sul punto di interesse.
export function buildPlan(target, { duration = 18, peakAlt = 450 } = {}) {
  const D = Math.max(8, Math.round(duration));
  const head = Math.round(bearing(LOCANDA, target)) % 360;
  const p30 = along(LOCANDA, target, 0.3);
  const p85 = along(LOCANDA, target, 0.85);

  return [
    { t: 0, name: 'Launch', where: 'Locanda (Ameglia)', lat: LOCANDA.lat, lng: LOCANDA.lng, alt: 40, tilt: 75, heading: head,
      note: 'Partenza bassa sui tetti della Locanda.' },
    { t: Math.round(D * 0.17), name: 'Salita in quota', where: 'In rotta verso il punto', lat: p30.lat, lng: p30.lng, alt: peakAlt, tilt: 55, heading: head,
      note: "Quota massima: mostra l'orientamento di costa e valle." },
    { t: Math.round(D * 0.45), name: 'Glide', where: 'Avvicinamento', lat: p85.lat, lng: p85.lng, alt: 150, tilt: 65, heading: head,
      note: 'Discesa morbida verso il monumento.' },
    { t: Math.round(D * 0.65), name: 'Arrivo sul punto', where: 'Punto di interesse', lat: target.lat, lng: target.lng, alt: 100, tilt: 60, heading: head,
      note: 'Imposta il punto come Target (Look at) e range ~250 m.' },
    { t: D, name: 'Orbita 360°', where: 'Punto di interesse', lat: target.lat, lng: target.lng, alt: 100, tilt: 60, heading: head + 360,
      note: "Stesso target: l'heading sale di 360° per un'orbita completa." },
  ];
}

export function planToText(plan, title) {
  const lines = [`Piano di volo "Launch & Glide": ${title || 'nuova destinazione'}`, ''];
  plan.forEach((k, i) => {
    lines.push(
      `${i + 1}. ${k.name} — secondo ${k.t} (${k.where})`,
      `   Lat ${fix(k.lat)}  Lng ${fix(k.lng)}  Quota ${k.alt} m  Tilt ${k.tilt}°  Heading ${k.heading}°`,
      `   ${k.note}`
    );
  });
  return lines.join('\n');
}
