---
name: HackathonBadge
description: Lever badges, sjekk status og monitor hackathon.blank.no for laget Friluftskameratene (lag 1). USE WHEN bruker sier "lever badge", "send inn badge", "submit badge", "claim badge", "sjekk badges", "badge status", "hva har vi levert", "hva har andre lag levert", "se godkjente badges", eller refererer til hackathon-plattformen.
---

# HackathonBadge

Skill for å samhandle med hackathon.blank.no sin uoffisielle JSON-API. Lar laget Friluftskameratene (teamId=1) levere badges, sjekke status og se hva andre lag gjør.

## Konstanter

```
TEAM_ID = 1
TEAM_NAME = Friluftskameratene
BASE_URL = https://hackathon.blank.no
```

## API-endpoints

| Metode | Path | Body | Formål |
|--------|------|------|--------|
| GET | `/api/state` | — | Hent alle claims, statuser og lagnavn |
| POST | `/api/claim` | `{teamId, badgeId, note}` | Lever badge til godkjenning. `note` valgfri (≤280 tegn) |
| POST | `/api/team-name` | `{teamId, name}` | Sett lagnavn (`null` for å fjerne) |

`Content-Type: application/json` på alle POST. Ingen auth — `teamId` i body er hele identifikasjonen.

## Workflows

### 1. Sjekk vår status

```bash
curl -s https://hackathon.blank.no/api/state | python3 -c "
import sys, json
from datetime import datetime
d = json.load(sys.stdin)
ours = [c for c in d['claims'] if c['teamId'] == 1]
total = sum(b['p'] for c in ours if c['status']=='approved' for b in [BADGES.get(c['badgeId'], {'p':0})])
print(f'Vi har {len(ours)} claims:')
for c in ours:
    sent = datetime.fromtimestamp(c['sentAt']/1000).strftime('%H:%M')
    print(f\"  {c['badgeId']:5} {c['status']:9} {sent}  {c.get('note','')[:60]}\")
"
```

Eller enklere — bare hent rådata og rapporter:
```bash
curl -s https://hackathon.blank.no/api/state | python3 -c "import sys,json; d=json.load(sys.stdin); [print(c) for c in d['claims'] if c['teamId']==1]"
```

### 2. Lever inn en badge

**ALLTID bekreft med brukeren før POST.** Vis forhåndsvisning:

```
Skal levere:
  Badge: GS1 — Live URL (5 p)
  Notat: https://friluftskameratene.vercel.app

Godkjenn? (ja/nei)
```

Når bekreftet:
```bash
curl -s -X POST https://hackathon.blank.no/api/claim \
  -H "Content-Type: application/json" \
  -d '{"teamId":1,"badgeId":"<BADGE_ID>","note":"<NOTAT>"}' \
  -w "\nHTTP %{http_code}\n"
```

Etter levering: hent state på nytt og bekreft at claim er `pending`.

### 3. Lær av andre lag

Før vi leverer en badge, sjekk hva juryen har godkjent vs avvist for samme badge:

```bash
curl -s https://hackathon.blank.no/api/state | python3 -c "
import sys, json
d = json.load(sys.stdin)
target = '$BADGE_ID'  # f.eks. GS1
for c in d['claims']:
    if c['badgeId'] == target and c['teamId'] != 1:
        print(f\"Lag {c['teamId']:2} {c['status']:9} note={c.get('note','')!r}\")
"
```

Dette avslører mønstre — f.eks. at GS1 ofte avvises hvis URL-en peker på en tom Vercel-deploy.

### 4. Sett/oppdater lagnavn

```bash
curl -s -X POST https://hackathon.blank.no/api/team-name \
  -H "Content-Type: application/json" \
  -d '{"teamId":1,"name":"Friluftskameratene"}'
```

## Badge-IDer

`GS1`–`GS5`, `DS1`–`DS5`, `TE1`–`TE5`, `F1`–`F20`, `E1`–`E2`, `SE1`–`SE2`, `J1`–`J3`. Full liste i [docs/underlag/badges.md](../../../docs/underlag/badges.md).

## Regler

1. **Bekreft før POST.** Aldri lever en badge uten at brukeren har sett notat + badge-ID og sagt ja.
2. **Sjekk eksisterende claims først.** Ikke lever den samme badgen to ganger hvis den er pending eller approved.
3. **Spar jurybadges (J1–J3) til demo.** De avvises automatisk hvis levert for tidlig — vi har allerede én avvist J1 fra tidligere på dagen.
4. **Notatet er bevis.** Det skal peke på konkret artefakt: URL, GitHub-lenke, screenshot-path, commit-hash. "Promp" og lignende → garantert avvist.
5. **Maks 280 tegn i notat.**

## Referanse

Full API-dokumentasjon: [docs/teknisk/hackathon-api.md](../../../docs/teknisk/hackathon-api.md)
Badge-katalog: [docs/underlag/badges.md](../../../docs/underlag/badges.md)
