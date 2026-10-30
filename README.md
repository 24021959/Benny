# App perdita peso

Diario personale di peso, digiuno 16:8 e salute. Next.js, TypeScript, Tailwind, Recharts, Supabase.

## Avvio

```bash
cp .env.example .env.local   # poi compila i valori
npm install
npm run dev
```

## Variabili d'ambiente

| Nome | A cosa serve |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Collegamento a Supabase (chiave pubblica) |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | Riassunto settimanale con IA (facoltativo) |
| `RESEND_API_KEY`, `CRON_SECRET` | Promemoria via email (facoltativo) |

## Database

Le tabelle hanno il prefisso `peso_` e sono protette da RLS: solo l'account del proprietario le legge e le scrive (`peso_is_owner()`). Il primo accesso con l'email del proprietario reclama l'app (`peso_claim_owner()`).

## Note sanitarie

Gli avvisi e i consigli sono regole sui dati inseriti, non diagnosi. Le soglie si cambiano in Impostazioni e vanno concordate col medico.
