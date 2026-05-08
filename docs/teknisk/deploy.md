# Deploy – Vercel

> Live URL: https://friluftskameratene.vercel.app

## Oppsett

Appen er deployet via Vercel CLI fra `apps/`-mappen:

```bash
cd apps && npx vercel
```

Vercel oppdaget Next.js automatisk og deployet til produksjon.

## Auto-deploy

Hver `git push` til `main` trigger en ny deploy automatisk via Vercel/GitHub-integrasjonen.

## Nyttige kommandoer

```bash
# Se status på siste deploy
vercel inspect apps-mop8ecpu9-hegeaals-projects.vercel.app

# Manuell deploy til produksjon
cd apps && vercel deploy --prod
```

## Vercel-dashbord

https://vercel.com/hegeaals-projects/apps
