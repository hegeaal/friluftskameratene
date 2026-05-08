# Supabase

Issue #1 bruker én tabell med én JSONB-kolonne per tur. Next.js API-rutene
snakker med Supabase fra serveren med `SUPABASE_SERVICE_ROLE_KEY`, slik at
deltakere fortsatt kan bruke delbare tur-lenker uten innlogging.

## Miljøvariabler

Sett disse i `apps/.env.local` lokalt og i Vercel Project Settings for Preview
og Production:

```bash
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

Service role key skal aldri eksponeres til klientkode eller prefikses med
`NEXT_PUBLIC_`.

## SQL

Kjør i Supabase SQL editor:

```sql
create table if not exists public.trips (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_trips_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trips_set_updated_at on public.trips;

create trigger trips_set_updated_at
before update on public.trips
for each row
execute function public.set_trips_updated_at();

alter table public.trips enable row level security;
```

Ingen public RLS-policy trengs så lenge all lesing og skriving går via
server-side API-rutene.

## API-kontrakt

### `POST /api/trips`

Request:

```json
{
  "destination": { "name": "Rondane", "lat": 62, "lon": 9.8 },
  "activityLevel": "medium"
}
```

Response:

```json
{
  "id": "generated-uuid",
  "trip": {
    "id": "generated-uuid",
    "destination": { "name": "Rondane", "lat": 62, "lon": 9.8 },
    "activityLevel": "medium",
    "suggestedDates": [],
    "chosenDate": null,
    "participants": [],
    "packingList": [],
    "expenses": [],
    "createdAt": "2026-05-08T12:00:00.000Z",
    "updatedAt": "2026-05-08T12:00:00.000Z"
  }
}
```

### `GET /api/trips/[id]`

Returnerer `{ "trip": ... }` eller `404` hvis turen ikke finnes.

### `PATCH /api/trips/[id]`

Kan erstatte hele felter:

```json
{
  "participants": [{ "name": "Ola", "rsvp": "yes" }]
}
```

Kan også legge til enkeltobjekter for de vanligste flytene:

```json
{ "participant": { "name": "Ola", "rsvp": "maybe" } }
```

```json
{ "packingItem": { "item": "Regntøy", "reason": "Regn spådd lørdag" } }
```

```json
{ "expense": { "description": "Bensin", "amount": 450, "paidBy": "Kari" } }
```
