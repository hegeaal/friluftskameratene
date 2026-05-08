# Fokusert plan — Vennegjengen

> **Valgt brukergruppe:** Vennegjengen (arketype 1)
> **Tid igjen:** ~4 timer
> **Team:** 2 utviklere
> **Mål:** Komplett vennegjengen-flyt — SE1 Full journey (200p)

---

## Brukerreisen vi leverer

Kari, Ola og Marie planlegger Rondane:

1. Kari åpner appen → markerer Rondane på kart
2. Velger aktivitetsnivå → AI foreslår helger basert på vær
3. Inviterer Ola og Marie via lenke — ingen innlogging
4. Regn spådd → pakkelisten oppdateres automatisk med regntøy
5. Etter turen: utgiftsoppgjør per person

---

## Tilstand nå

| Hva | Status |
|-----|--------|
| Landing page + Vercel deploy | ✅ GS1 done |
| `/tur`-ruten | ❌ |
| Kart | ❌ |
| Vær (Yr API) | ❌ |
| Turforslag (Claude AI) | ❌ |
| Invitasjon via lenke | ❌ |
| Pakkeliste | ❌ |
| Utgiftssporing | ❌ |

---

## Parallell arbeidsplan — 4 timer

### Dev A (kart + invitasjons-UI)
- **Time 0–1:** Leaflet-kart på `/tur/ny` — klikk setter destinasjon → F3
- **Time 1–2:** Invitasjons-siden `/tur/[id]` — deltakere kan svare ja/nei uten innlogging → F5
- **Time 2–3:** Pakkeliste-komponent med vær-trigger (regn → regntøy) → F6
- **Time 3–4:** Demo-polish + mobilvisning, hjelp med SE1-dokumentasjon

### Dev B (API + data)
- **Time 0–1:** Supabase-oppsett (`trips`-tabell JSONB) + Next.js API-routes for opprette/hente tur
- **Time 1–2:** Yr API (`api.met.no`) for valgt destinasjon + Claude Haiku: generer turforslag med vær → F1, F4, TE5
- **Time 2–3:** Utgiftssporing (legg til utgift, oppgjør per person) → F7
- **Time 3–4:** Vitest-tester for kjerneflyt (3 stk) → TE3, CI-sjekk → TE1

---

## Badge-mål (realistisk, 4 timer)

| Badge | Poeng | Ansvar | ETA |
|-------|-------|--------|-----|
| GS1 Live URL | 5 | ✅ Done | — |
| TE1 CI grønt | 25 | Dev B | Time 3 |
| F3 Kart | 25 | Dev A | Time 1 |
| F4 Vær | 30 | Dev B | Time 2 |
| F1 Turforslag | 20 | Dev B | Time 2 |
| F5 Invitasjoner | 35 | Dev A | Time 2 |
| F6 Pakkeliste | 35 | Dev A | Time 3 |
| F7 Utgifter | 35 | Dev B | Time 3 |
| TE5 To API-er | 40 | Dev B | Time 2 |
| TE3 Tester | 35 | Dev B | Time 4 |
| SE1 Full journey | 200 | Begge | Time 4 |

**Realistisk totalsum: ~485 poeng** (+ jury J1–J3 opptil 600 ekstra)

---

## Hva vi kutter

| Kuttet | Hvorfor |
|--------|---------|
| Hytteruta, Familie, Spontan-arketypen | Fokus på én komplett journey |
| F8, F9 | Ukjent innhold — for risikabelt |
| F10–F16 journey-badges | For tidkrevende |
| DS1–DS5 design-badges | Ikke verdt tida nå |
| SE2 To journeys | Urealistisk på 4 timer |
| GS2 WCAG, GS3, GS5 | Lav verdi vs. tidsbruk |

---

## Datamodell (Supabase JSONB)

```json
{
  "id": "abc123",
  "destination": { "name": "Rondane", "lat": 62.0, "lon": 9.8 },
  "activityLevel": "medium",
  "suggestedDates": [
    { "from": "2026-03-21", "to": "2026-03-22", "weather": "Sol, 4°C" },
    { "from": "2026-03-28", "to": "2026-03-29", "weather": "Regn, 1°C" }
  ],
  "chosenDate": { "from": "2026-03-21", "to": "2026-03-22" },
  "participants": [
    { "name": "Kari", "rsvp": "yes" },
    { "name": "Ola", "rsvp": "maybe" }
  ],
  "packingList": [
    { "item": "Regntøy", "reason": "Regn spådd lørdag", "assignedTo": null },
    { "item": "Støvler", "assignedTo": "Kari" }
  ],
  "expenses": [
    { "description": "Bensin", "amount": 450, "paidBy": "Kari" }
  ]
}
```

---

## API-kall

| API | URL | Badge |
|-----|-----|-------|
| Yr/MET | `api.met.no/weatherapi/locationforecast/2.0/compact` | F4, TE5 |
| UT.no GraphQL | `https://api.ut.no/graphql` | TE5 (2. API) |
| Kartverket WMTS | `cache.kartverket.no/toporaster4/wmts` | F3 |
| Claude Haiku | Anthropic API | F1, F6 |

---

## Demo-manus (siste 30 min)

1. **Problem:** Åpne 7 tabs (Yr, UT.no, Messenger, Excel, DNT…)
2. **Løsning:** Én app
3. **Flyt:** Kart → Rondane → AI-forslag med vær → Inviter Ola og Marie live → Pakkeliste med regntøy → Oppgjør
4. **AI-moment:** Vis at pakkelisten automatisk fikk regntøy da regn ble varslet
5. **Avslutt:** Ola svarer på invitasjonen live på scenen
