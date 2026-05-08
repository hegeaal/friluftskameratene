---
name: pr-review-handler
description: >
  Hent og håndter PR-reviews. Bruk denne skillen når brukeren nevner: PR-reviews,
  review-kommentarer, bot-reviews (Claude, Copilot, Gemini), "sjekk PR'en",
  "hva sa reviewen", lenker til pullrequestreview, eller ber om å fikse
  review-feedback. Henter alle reviews + inline-kommentarer via gh CLI,
  kategoriserer dem og hjelper med å løse dem.
---

# PR Review Handler

Hent, prioriter og fiks issues fra pull request-reviews systematisk.

## Når skillen brukes

- "sjekk reviews på PR #X"
- "hva sa Claude/Copilot/Gemini om PR'en"
- Lenker som `github.com/.../pull/X#pullrequestreview-...`
- "fiks review-kommentarene"
- Ny review fra automatisk bot

## Workflow

### Fase 1: Hent og analyser

**Viktig:** Boter (Claude, Copilot, Gemini Code Assist) legger ofte den faktiske
feedbacken i **inline-kommentarer**, mens review-summaryen bare er "ser bra ut".
Du må alltid hente begge.

```bash
# 1. PR-info + review-summaries
gh pr view PR_NUMBER --json title,body,reviews

# 2. Inline-kommentarer (REST) — hopp ALDRI over denne
gh api repos/OWNER/REPO/pulls/PR_NUMBER/comments --paginate

# 3. Review-tråder med resolusjon-status (GraphQL) — for å vite hva som er løst
gh api graphql -f query='
{
  repository(owner: "OWNER", name: "REPO") {
    pullRequest(number: PR_NUMBER) {
      reviewThreads(first: 100) {
        totalCount
        nodes {
          id
          isResolved
          comments(first: 5) {
            nodes { databaseId author { login } body path line }
          }
        }
      }
    }
  }
}'
```

Hvis `totalCount > 100`: bruk `pageInfo { endCursor hasNextPage }` og paginer.

### Fase 2: Lag plan og vent på godkjenning

Kategoriser hver kommentar:

- **Type**: bug, sikkerhet, ytelse, vedlikehold, stil, dokumentasjon
- **Prioritet**: HIGH (blokker merge), MEDIUM (bør fikses), LOW (nice-to-have)
- **Anbefaling**: ACCEPT (fiks nå), DEFER (senere), IGNORE (med begrunnelse)

**🚨 STOPP: Presenter planen som tabell og vent på godkjenning fra bruker
før du fikser noe, svarer i tråder eller resolver tråder.** Gjelder hver
review-runde, også oppfølginger.

### Fase 3: Fiks

For hver godkjent fix:

1. Implementer
2. Kjør sjekker før commit:
   ```bash
   cd apps && npm run lint && npm run build
   ```
3. Commit én fix (eller logisk gruppe) av gangen. Referér review-kommentaren
   i commit-bodyen, og legg til co-authorship-footer.

### Fase 4: Svar og resolve

Etter at fix er pushet:

```bash
# Svar på inline-kommentar (REST, bruker comment-ID)
gh api -X POST repos/OWNER/REPO/pulls/PR_NUMBER/comments/COMMENT_ID/replies \
  -f body="✅ Fikset i commit SHORT_SHA — [kort beskrivelse]"

# Resolve tråden (GraphQL, bruker thread-ID som starter med PRRT_)
gh api graphql -f query='
mutation {
  resolveReviewThread(input: {threadId: "THREAD_ID"}) {
    thread { id isResolved }
  }
}'
```

Push når alle fix er commitet og alle tråder er besvart/resolvet.

## Prioriteringsguide

| Prioritet | Eksempler |
|---|---|
| **HIGH** | Sikkerhetshull (XSS, secrets), kritiske bugs, ødelagte API-kontrakter |
| **MEDIUM** | Duplisert kode, manglende error-håndtering, manglende tester, ufullstendig docs |
| **LOW** | Navngiving, formatering, mikro-optimaliseringer |
| **IGNORE** (med begrunnelse) | Utenfor scope, falsk-positiv fra bot, allerede fikset annet sted |

## Prinsipper

- **Plan først, alltid.** Ikke implementer eller resolve uten godkjenning.
- **Én commit per fix** (eller tett relatert gruppe).
- **Svar før du resolver** — alltid forklar hva som ble gjort + commit-SHA.
- **Bruk GraphQL for tråd-resolusjon** (REST kan ikke resolve tråder).
- **Hopp aldri over inline-kommentarer** — det er der den faktiske feedbacken er.
