# Deploy – Vercel

> Live URL: https://friluftskameratene.vercel.app
> Vercel-dashbord: https://vercel.com/hegeaals-projects/apps

## Vercel-prosjektet

| Felt | Verdi |
|------|-------|
| Team | `Friluftskameratene` (slug: `hegeaals-projects`) |
| Team ID | `team_k7BfAtz3Q7CZlmtHUJAcwo7x` |
| Plan | Hobby (gratis, ikke-kommersielt bruk) |
| Prosjektnavn | `apps` |
| Project ID | `prj_FPE0D2skVf1o3k82JZ0esWk58kUb` |
| Framework | Next.js 16.2.6 |
| Node | 24.x |
| GitHub-repo | `hegeaal/friluftskameratene` (branch `main`) |

## Repo-struktur og Root Directory

Next.js-appen ligger i `apps/`, ikke i repo-roten. Vercel **må** derfor ha
`Root Directory` satt til `apps` i prosjektinnstillingene, ellers feiler
bygget med:

```
Error: Couldn't find any `pages` or `app` directory.
Please create one under the project root
```

Sjekk: Vercel Dashboard → Project `apps` → **Settings → Build & Development
Settings → Root Directory** = `apps`.

## Tilgang for teammedlemmer

Hege (eier) inviterer via:
**Team → Settings → Members → Invite** → GitHub-e-post.

Etter at invitasjonen er akseptert:

```bash
# Logg inn med samme GitHub-konto som invitasjonen ble sendt til
vercel login

# Bekreft tilgang
vercel teams ls
# Forventet: hegeaals-projects skal være i listen

# Bytt scope til teamet
vercel switch hegeaals-projects
```

For å koble lokal repo-klone til Vercel-prosjektet:

```bash
cd apps
vercel link --scope hegeaals-projects
# Velg eksisterende prosjekt: apps
```

Det skriver `.vercel/project.json` (gitignorert) med team- og prosjekt-ID.

## Miljøvariabler

Variablene fra `.env.example` skal settes i **Vercel Project Settings →
Environment Variables** (Production + Preview), ikke i GitHub.

Hent dem lokalt:

```bash
cd apps
vercel env pull .env.local
```

`.env.local` er gitignorert. Master-kopien av hemmelighetene ligger i
1Password (vault: "Italia – Hackathon-nøkler"); Anthropic-nøkkel bruker
hver enkelt sin egen.

## Auto-deploy

Hver `git push` til `main` trigger en ny production-deploy via
GitHub-integrasjonen. PR-er får automatisk en Preview Deployment med URL
i PR-kommentaren.

## Nyttige kommandoer

```bash
# Status på siste deploy (alle teammedlemmer)
vercel ls --scope hegeaals-projects

# Bygg-logger for en spesifikk deploy
vercel inspect <deployment-url> --logs

# Manuell production-deploy
cd apps && vercel deploy --prod

# Trekk produksjons-env til lokal utvikling
cd apps && vercel env pull .env.local
```

## For Claude Code (MCP)

Vercel MCP (`plugin:vercel:vercel`) gir Claude direkte tilgang til
prosjektet. Etter første `/mcp`-autentisering må sesjonen restartes for
at nye team-tilganger skal lastes inn. Etter det kan Claude liste
deploys, hente build-logger og lese runtime-logger uten CLI.

Relevante MCP-verktøy:

- `list_teams`, `list_projects`, `get_project`
- `list_deployments`, `get_deployment`, `get_deployment_build_logs`
- `get_runtime_logs`, `deploy_to_vercel`

## Kjente saker

- **Build cache fra forrige deploy gjenbrukes** automatisk; tøm via
  Vercel Dashboard → Settings → Advanced hvis bygget oppfører seg rart.
- **`Found lockfile missing swc dependencies`**-warning er ufarlig —
  oppstår fordi `package-lock.json` ble generert på en annen plattform
  enn build-machinen. Forsvinner hvis vi kjører `npm install` på Linux.
