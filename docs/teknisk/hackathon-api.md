# Hackathon-plattformens API

Interne endpoints på `https://hackathon.blank.no` — funnet ved å inspisere JS-bundlen `/_next/static/chunks/app/lag/[id]/page-*.js`.

Ingen offisiell dokumentasjon; ingen synlig auth (kun `teamId` i body).

## Endpoints

| Metode | Path | Body | Formål |
|--------|------|------|--------|
| GET | `/api/state` | — | Henter alle lags claims, status og avgjørelser (offentlig) |
| POST | `/api/team-name` | `{teamId, name}` | Setter lagnavn. `name: null` fjerner |
| POST | `/api/claim` | `{teamId, badgeId, note}` | Sender inn badge til godkjenning. `note` valgfritt (maks 280 tegn) |

`Content-Type: application/json` på alle POST.

## Eksempler

### Sett lagnavn

```bash
curl -X POST https://hackathon.blank.no/api/team-name \
  -H "Content-Type: application/json" \
  -d '{"teamId":1,"name":"Friluftskameratene"}'
```

### Send inn badge

```bash
curl -X POST https://hackathon.blank.no/api/claim \
  -H "Content-Type: application/json" \
  -d '{"teamId":1,"badgeId":"GS1","note":"https://friluftskameratene.vercel.app"}'
```

### Sjekk status / se hva andre har levert

```bash
curl -s https://hackathon.blank.no/api/state | jq '.claims[] | select(.teamId == 1)'
```

## Observasjoner fra `/api/state`

- Juryen avviser ofte GS1 (Live URL) når innholdet er for tynt — en deployet "hello world" holder ikke. Krever klikkbart, delbart innhold.
- Lag 4 fikk godkjent TE1 ved å lenke til GitHub deployments-siden, og GS1 ved å lenke til Vercel-URL med innhold.
- `claimId` har formatet `c_<base36-timestamp>_<random>`.
- `status`: `pending`, `approved`, `rejected`. `decidedBy: "Jury"`.

## Badge-IDer

Se `<select id="badge">` på lagsiden for fullstendig liste. Format: `GS1`–`GS5`, `DS1`–`DS5`, `TE1`–`TE5`, `F1`–`F20`, `E1`–`E2`, `SE1`–`SE2`, `J1`–`J3`.
