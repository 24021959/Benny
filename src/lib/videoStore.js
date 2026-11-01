import { useEffect, useState } from 'react';

// Archivio locale (IndexedDB) per i video caricati dallo staff.
// I file restano sul dispositivo in cui vengono caricati.
const DB = 'locanda-studio';
const STORE = 'videos';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => { db.close(); resolve(req.result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
    tx.onabort = () => { db.close(); reject(tx.error); };
  });
}

export const saveVideo = (id, blob) => run('readwrite', (s) => s.put(blob, id));
export const getVideo = (id) => run('readonly', (s) => s.get(id));
export const deleteVideo = (id) => run('readwrite', (s) => s.delete(id)).catch(() => {});

// Restituisce l'URL riproducibile di un reel (file locale oppure link esterno).
export function useReelSrc(reel) {
  const blobId = reel?.videoBlobId;
  const url = reel?.videoUrl;
  const [src, setSrc] = useState(blobId ? null : url || null);

  useEffect(() => {
    if (!blobId) { setSrc(url || null); return undefined; }
    let objectUrl;
    let cancelled = false;
    setSrc(null);
    getVideo(blobId)
      .then((blob) => {
        if (cancelled) return;
        if (blob) { objectUrl = URL.createObjectURL(blob); setSrc(objectUrl); }
        else setSrc(url || null);
      })
      .catch(() => { if (!cancelled) setSrc(url || null); });
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [blobId, url]);

  return src;
}
