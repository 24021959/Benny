# Locanda Drone Concierge

Web app mobile-first (React 18 + Vite + Tailwind + lucide-react) con guida turistica a reel drone per gli ospiti della Locanda dell'Angelo.

```bash
npm install
npm run dev      # sviluppo (accessibile anche da telefono sulla stessa rete)
npm run build    # produzione in dist/
```

- Area staff "Locanda Studio": icona lucchetto nell'header della home.
- Dati (reel e salvati) salvati in `localStorage` del dispositivo.
- `base: './'` in `vite.config.js`: la cartella `dist/` funziona anche in una sottocartella del sito.
