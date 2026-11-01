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

const pointShortOf = (a, b, meters) => {
  const total = distanceKm(a, b) * 1000;
  return along(a, b, Math.max(0, Math.min(1, 1 - meters / total)));
};

// Piano "Launch & Glide": inquadratura verticale sulla Locanda, salita in quota, planata
// e arrivo davanti al punto di interesse (che finisce al centro dell'inquadratura).
// Nessun limite alla durata: i keyframe si distribuiscono sul tempo scelto.
export function buildPlan(target, { duration = 18, peakAlt = 450 } = {}) {
  const D = Math.max(8, Math.round(duration));
  const head = Math.round(bearing(LOCANDA, target)) % 360;
  const totalM = distanceKm(LOCANDA, target) * 1000;
  const standoff = Math.round(Math.min(250, totalM * 0.4));
  const arrival = pointShortOf(LOCANDA, target, standoff);
  const arrivalAlt = 150;
  const arrivalTilt = Math.max(40, Math.min(70, Math.round(deg(Math.atan2(standoff, arrivalAlt)))));
  const p25 = along(LOCANDA, target, 0.25);
  const p80 = along(LOCANDA, target, 0.8);

  const tHold = Math.max(2, Math.round(D * 0.1));
  const tClimb = Math.max(tHold + 1, Math.round(D * 0.3));
  const tGlide = Math.max(tClimb + 1, Math.round(D * 0.65));

  return [
    { t: 0, name: 'Inquadratura verticale', where: 'Sopra la Locanda', lat: LOCANDA.lat, lng: LOCANDA.lng, alt: 150, tilt: 0, heading: head,
      note: "Camera a piombo (tilt 0°): la Locanda è al centro dell'inquadratura." },
    { t: tHold, name: 'Pausa sulla Locanda', where: 'Sopra la Locanda', lat: LOCANDA.lat, lng: LOCANDA.lng, alt: 150, tilt: 0, heading: head,
      note: `Stessi valori del primo: tiene ferma l'inquadratura per ${tHold} secondi.` },
    { t: tClimb, name: 'Salita in quota', where: 'In rotta verso il punto', lat: p25.lat, lng: p25.lng, alt: peakAlt, tilt: 55, heading: head,
      note: "Quota massima: mostra l'orientamento di costa e valle." },
    { t: tGlide, name: 'Glide', where: 'Avvicinamento', lat: p80.lat, lng: p80.lng, alt: 260, tilt: 62, heading: head,
      note: 'Discesa morbida verso il monumento.' },
    { t: D, name: 'Arrivo sul punto', where: `A ${standoff} m dal punto`, lat: arrival.lat, lng: arrival.lng, alt: arrivalAlt, tilt: arrivalTilt, heading: head,
      note: 'Fine del volo: il punto di interesse è davanti alla camera, al centro del fotogramma.' },
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
