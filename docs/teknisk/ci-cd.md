# CI/CD og automatiserte reviews

## Claude Code Review (PR-review)

Automatisk AI-review på alle pull requests via [`anthropics/claude-code-action@v1`](https://github.com/anthropics/claude-code-action).

**Workflow-fil:** [`.github/workflows/claude-code-review.yml`](../../.github/workflows/claude-code-review.yml)

### Hva den gjør

På `pull_request` (`opened`, `synchronize`, `ready_for_review`, `reopened`):
1. Sjekker ut PR-en.
2. Starter en pending review i GitHub.
3. Henter diff og legger inn line-spesifikke kommentarer på kodekvalitet, bugs, sikkerhet, ytelse og testdekning.
4. Submitter review-en som `COMMENT` (ikke-blokkerende).

Workflowen kan også trigges manuelt via `workflow_dispatch` med et PR-nummer.

### Forutsetninger

Tre ting må være på plass for at workflowen skal virke:

| Krav | Hvor | Hvem satte det opp |
|------|------|--------------------|
| Repo-secret `CLAUDE_CODE_OAUTH_TOKEN` | Settings → Secrets and variables → Actions | Yngvar (token fra Anthropic-konto via `claude setup-token`) |
| GitHub App: [Claude](https://github.com/apps/claude) installert på repoet | https://github.com/apps/claude/installations/new | Hege (repo-eier) |
| Workflow-fil på `main` | `.github/workflows/claude-code-review.yml` | Merget via PR #10 |

### Kjente begrensninger

- **Første PR med workflow-endringer reviewes ikke.** Action-en validerer at workflow-fila i PR-en er identisk med versjonen på default branch. Når du oppretter eller endrer selve workflow-fila, hopper Claude over reviewen ("workflow validation failed"). Løsning: merge workflow-endringen først, så fungerer reviews på neste PR.
- Krever **Claude Pro eller Max** abonnement på Anthropic-kontoen som eier OAuth-tokenen.

### Token-rotasjon

Hvis Yngvars OAuth-token utløper eller skal byttes:

```bash
claude setup-token                                     # generer ny
gh secret set CLAUDE_CODE_OAUTH_TOKEN \
  --repo hegeaal/friluftskameratene                    # oppdater secret
```

### Badge-relevans

- **GS4 — AI-driven Code review (15 p)**: oppfylt etter første reelle PR med meningsfulle endringer basert på Claude sin review.
- **TE2 — Streng review av AI-generert kode (3 eksempler)**: oppfylles automatisk når 3 PR-er har gått gjennom workflowen med oppfølging.
- **TE4 — Code-review skill**: workflowen er fundamentet; kan utvides med custom prompts/skills senere.

## Andre workflows (planlagt)

- [ ] `ci.yml` — `npm run build` + `npm test` på push til `main` (issue #7, badge **TE1**)
