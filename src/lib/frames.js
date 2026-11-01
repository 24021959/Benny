import { unzipSync } from 'fflate';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

// Codec provati in ordine: H.264 è il più compatibile con i telefoni.
const CODECS = [
  { enc: 'avc1.640028', mux: 'avc' },
  { enc: 'avc1.4d0028', mux: 'avc' },
  { enc: 'vp09.00.40.08', mux: 'vp9' },
  { enc: 'av01.0.08M.08', mux: 'av1' },
];

export const framesSupported = () =>
  typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined';

const isImage = (name) => /\.(jpe?g|png)$/i.test(name) && !/(^|\/)(__MACOSX|\.)/.test(name);
const natural = (a, b) => a.localeCompare(b, undefined, { numeric: true });

// Accetta uno ZIP di Earth Studio oppure immagini singole.
export async function collectFrames(files) {
  const frames = [];
  for (const f of files) {
    if (/\.zip$/i.test(f.name)) {
      const entries = unzipSync(new Uint8Array(await f.arrayBuffer()));
      Object.keys(entries).filter(isImage).forEach((name) => frames.push({ name, data: entries[name] }));
    } else if (isImage(f.name) || f.type.startsWith('image/')) {
      frames.push({ name: f.name, data: new Uint8Array(await f.arrayBuffer()) });
    }
  }
  return frames.sort((a, b) => natural(a.name, b.name));
}

const mimeOf = (name) => (/\.png$/i.test(name) ? 'image/png' : 'image/jpeg');

export async function encodeFramesToMp4(frames, { fps = 30, targetWidth = 1080, bitrate = 7_000_000, onProgress } = {}) {
  if (!framesSupported()) {
    throw new Error('Questo browser non supporta la codifica video. Usa Chrome o Edge sul computer.');
  }
  const probe = await createImageBitmap(new Blob([frames[0].data], { type: mimeOf(frames[0].name) }));
  const scale = Math.min(1, targetWidth / probe.width);
  const width = Math.floor((probe.width * scale) / 2) * 2;
  const height = Math.floor((probe.height * scale) / 2) * 2;
  probe.close();

  let chosen = null;
  for (const c of CODECS) {
    try {
      const res = await VideoEncoder.isConfigSupported({ codec: c.enc, width, height, bitrate, framerate: fps });
      if (res.supported) { chosen = c; break; }
    } catch { /* prova il successivo */ }
  }
  if (!chosen) throw new Error('Nessun codec video disponibile in questo browser. Usa Chrome o Edge sul computer.');

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: chosen.mux, width, height },
    fastStart: 'in-memory',
  });
  let encodeError = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => { encodeError = e; },
  });
  encoder.configure({ codec: chosen.enc, width, height, bitrate, framerate: fps });

  const frameUs = 1_000_000 / fps;
  for (let i = 0; i < frames.length; i += 1) {
    if (encodeError) throw encodeError;
    const bmp = await createImageBitmap(new Blob([frames[i].data], { type: mimeOf(frames[i].name) }), {
      resizeWidth: width, resizeHeight: height, resizeQuality: 'high',
    });
    const vf = new VideoFrame(bmp, { timestamp: Math.round(i * frameUs), duration: Math.round(frameUs) });
    encoder.encode(vf, { keyFrame: i % fps === 0 });
    vf.close();
    bmp.close();
    while (encoder.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 5));
    if (onProgress && i % 5 === 0) onProgress((i + 1) / frames.length);
  }
  await encoder.flush();
  if (encodeError) throw encodeError;
  muxer.finalize();
  onProgress?.(1);
  return new File([muxer.target.buffer], 'volo.mp4', { type: 'video/mp4' });
}
