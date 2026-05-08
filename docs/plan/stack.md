# Tech Stack-vurdering – Friluftskompis Hackathon 2026

> Vurdert ut fra 7-timers hackathon, 3 deltakere, ingen eksisterende kode.

## Anbefalt stack

| Område | Valg | Begrunnelse |
|--------|------|-------------|
| Frontend | Next.js 14+ (TypeScript) | Scaffold på 5 min, API-ruter og frontend i ett repo |
| Styling | Tailwind CSS + shadcn/ui | Ferdige komponenter, profesjonelt utseende raskt |
| Kart | react-leaflet + Leaflet | Enkelt, fungerer med Kartverket-tiles, støtter GeoJSON-lag |
| Deploy | Vercel | `git push` → live URL på 2 min → GS1-badge |
| AI | Claude API (Haiku) | Rask, billig, allerede konfigurert i .env.example |
| CI | GitHub Actions | Enkel `build + test`-workflow → TE1-badge |
| Testing | Vitest + React Testing Library | Lett og rask → TE3-badge |
| Database | Supabase | Gratis, JSON-blob per tur, real-time subscriptions |

---

## Database: Supabase

Én tabell (`trips`) med én `jsonb`-kolonne — hele turens state som én blob.

```json
{
  "id": "abc123",
  "destination": "...",
  "dates": { "from": "...", "to": "..." },
  "route": {},
  "participants": [{ "name": "...", "rsvp": "yes/no/maybe" }],
  "packingList": [{ "item": "...", "assignedTo": "..." }],
  "expenses": [{ "description": "...", "amount": 0, "paidBy": "..." }]
}
```

Deling via URL: `/tur/abc123` — ingen innlogging nødvendig for deltakere.

**Alternativ:** Vercel KV (Redis) — enda raskere å sette opp (~5 min), men ingen real-time.

---

## API-prioritering

| Prioritet | API | Badge | Kommentar |
|-----------|-----|-------|-----------|
| 1 | Yr / MET Norway | F4, TE5 | Mest kritisk — vær driver turforslag |
| 2 | UT.no GraphQL | F1, F2, F3 | Hytter og ruter — kjernefunksjon |
| 3 | Kartverket WMTS | F3 | Norske topografiske kart som tile-lag |
| 4 | Varsom/NVE | F4 | Skredvarsel — raskt å integrere |
| 5 | Entur | F7 | Transport til utgangspunkt |

TE5-badge (to API-er live) er oppnådd etter punkt 1 og 2.

---

## Badge-kobling

| Badge | Stack-element |
|-------|--------------|
| GS1 Live URL | Vercel deploy |
| TE1 CI kjører grønt | GitHub Actions |
| TE3 Tester for kjerneflyt | Vitest |
| TE5 To externe API-er | Yr + UT.no GraphQL |
| J2 Best use of AI | Claude API Haiku |
| F5 Deltakerinvitasjoner | Supabase + deling via URL |
