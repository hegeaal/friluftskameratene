# APIer

> Kilde: [hackathon.blank.no/apis](https://hackathon.blank.no/apis)

15 APIer er tilgjengelige for Friluftskompis: 10 åpne (uten registrering) og 5 som krever konto eller credentials. Credentials til de siste ligger i Blanks 1Password der ikke annet er nevnt.

---

## Åpne APIer (ingen registrering)

### 1. Yr / MET Norway — vær

- **Base URL:** `https://api.met.no`
- **Auth:** `User-Agent`-header (må inkludere appnavn og kontaktinfo)
- **Rate limit:** 20 req/s per applikasjon
- **Endepunkter:**
  - `/weatherapi/locationforecast/2.0/compact` — 9-dagers varsel (temp, nedbør, vind)
  - `/weatherapi/locationforecast/2.0/complete` — fullt varsel med alle parametre
  - `/weatherapi/nowcast/2.0/complete` — neste 2 timer, høy presisjon (kun Norden)
  - `/api/v0/regions/{id}/watertemperatures` — sanntids badetemperaturer
- **Eksempel:**
  ```bash
  curl -H "User-Agent: Friluftskompis/1.0 team@blank.no" \
    "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=62.0&lon=9.7"
  ```
- **Merk:** Trunker koordinater til 4 desimaler. Respekter `Expires`-header. HTTPS påkrevd.

### 2. Kartverket / Geonorge — kart og stedsnavn

- **Base URLer:** `https://cache.kartverket.no` (kart), `https://ws.geonorge.no` (tjenester)
- **Auth:** Ingen
- **Rate limit:** Ikke publisert på `cache.kartverket.no`. Legacy `opencache.statkart.no`: 10 000 kall/IP/dag
- **Endepunkter:**
  - `cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png` — topografiske kartfliser
  - `cache.kartverket.no/v1/wmts/1.0.0/toporaster/default/webmercator/{z}/{y}/{x}.png` — turkart (raster)
  - `ws.geonorge.no/stedsnavn/v1/sted?sok={query}` — stedsnavnsøk (1M+ lokasjoner)
- **Eksempel:**
  ```bash
  curl "https://ws.geonorge.no/stedsnavn/v1/sted?sok=Trolltunga&treffPerSide=5"
  ```
- **Merk:** Bruk `cache.kartverket.no` (ny), ikke legacy. Attribusjon påkrevd. Egnet for autocomplete.

### 3. Entur — kollektivtransport

- **Base URL:** `https://api.entur.io`
- **Auth:** `ET-Client-Name`-header
- **Rate limit:** Ikke dokumentert; header kreves for å unngå throttling
- **Endepunkter:**
  - `/journey-planner/v3/graphql` — reiseplanlegger A→B (GraphQL, sanntid + ruter)
  - `/geocoder/v1/autocomplete?text={query}` — søk etter stoppesteder/steder
  - `/geocoder/v1/reverse?point.lat={lat}&point.lon={lon}` — nærmeste stopp fra koordinater
- **Eksempel:**
  ```bash
  curl -H "ET-Client-Name: blank-friluftskompis" \
    "https://api.entur.io/geocoder/v1/autocomplete?text=Otta%20stasjon&size=3"
  ```
- **Merk:** GraphQL Explorer på <https://api.entur.io/graphql-explorer/journey-planner-v3>. `NSR:StopPlace`-IDer er stabile. Geocoderen er REST og enklest å starte med.

### 4. Varsom / NVE — skred- og flomvarsel

- **Base URL:** `https://api01.nve.no`
- **Auth:** Ingen
- **Rate limit:** Ikke dokumentert; oppdateres hver 30–60 min
- **Endepunkter:**
  - `/hydrology/forecast/avalanche/v6.2.1/api/AvalancheWarningByRegion/Simple/{regionId}/{days}/{from}/{to}` — skredvarsel (faregrad 1–5)
  - `/hydrology/forecast/flood/v1.0.10/Warning/{lang}/{from}/{to}` — flomvarsel
  - `/hydrology/forecast/landslide/v1.0.8/api/Warning/Id/{id}/{days}` — jordskredvarsel
- **Eksempel:**
  ```bash
  curl "https://api01.nve.no/hydrology/forecast/avalanche/v6.2.1/api/AvalancheWarningByRegion/Simple/3028/2/2026-05-01/2026-05-02"
  ```
- **Merk:** Bruk `/Region`-endepunktet for region-IDer og polygoner. Mest relevant om vinteren. Attribusjon påkrevd.

### 5. OpenStreetMap — kart og POI

- **Base URLer:** `https://tile.openstreetmap.org` (fliser), `https://overpass-api.de` (POI)
- **Auth:** `User-Agent`-header
- **Rate limit:** Ikke dokumentert; cache fliser lokalt 7 dager. Overpass: maks 2 samtidige requests
- **Endepunkter:**
  - `tile.openstreetmap.org/{z}/{x}/{y}.png` — standard rasterfliser
  - `overpass-api.de/api/interpreter` — Overpass-query for POI (gapahuker, utsiktspunkter, vann)
- **Eksempel:**
  ```bash
  curl -X POST "https://overpass-api.de/api/interpreter" \
    -d "data=[out:json][bbox:61.8,9.5,62.2,10.0];(node[tourism=alpine_hut];node[tourism=viewpoint];);out body;"
  ```
- **Merk:** Attribusjon og HTTPS påkrevd. Kun ett domene (`tile.openstreetmap.org`).

### 6. UT.no / DNT — hytter og ruter

- **Base URL:** `https://ut-backend-api-2-41145913385.europe-north1.run.app/internal/graphql`
- **Auth:** Ingen
- **Rate limit:** Ikke dokumentert; bruk fornuftig
- **GraphQL-felter:**
  - `cabins(paging, filter)` — søk/list 1 999 hytter; id, name, serviceLevel, geojson, beds
  - `cabin(id)` — full hytte-detalj inkl. senger, betjeningsstatus, fasiliteter
  - `cabinsNear(input: { coordinates: { lat, lon }, distance })` — hytter nær koordinat + radius (meter)
  - `routes(paging, filter)` — søk/list 1 395 ruter; filtrerbare felter: `gradingAb`, `gradingBa`, `distance`
  - `routesNear(input: { coordinates: [lon, lat], maxDistance })` — ruter nær punkt; returnerer `[{ route }]` (ikke edges)
  - `route(id)` — full rute med GeoJSON (inkl. høydeprofil), start, slutt, beskrivelse
  - `pois(paging, filter)` / `poisNear(input)` — utsiktspunkter, rasteplasser, POI
  - `areas(paging, filter)` — turområder med navn og grenser
  - `search(input: { searchString })` — returnerer `SearchPayload { prioritizedResult, result }` (result er `[String!]!`, ikke Route-objekter direkte)
- **Faktiske feltnavn på Route** (bekreftet via introspeksjon):
  - `distance` (meter, Int) — filtrerbar server-side med `{ lte, gte, eq }`
  - `gradingAb` / `gradingBa` — enum: `EASY`, `MODERATE`, `TOUGH`, `VERY_TOUGH`; filtrerbar med `{ eq: EASY }` eller `{ in: [TOUGH, VERY_TOUGH] }`
  - `durationHoursAb` / `durationMinutesAb` / `durationDaysAb` — varighet; **ikke** filtrerbar server-side, filtrer client-side
  - `name` — filtrerbar med `{ like: "%..." }`, men gir INTERNAL_SERVER_ERROR — unngå, filtrer client-side
- **Eksempel — ruter nær Rondane med gradering:**
  ```bash
  curl -X POST "https://ut-backend-api-2-41145913385.europe-north1.run.app/internal/graphql" \
    -H "Content-Type: application/json" -H "Origin: https://ut.no" \
    -d '{"query":"{ routesNear(input: { coordinates: [9.72, 61.93], maxDistance: 30000 }) { route { id name distance gradingAb durationHoursAb geojson } } }"}'
  ```
- **Eksempel — hytter (eksisterende):**
  ```bash
  curl -X POST "https://ut-backend-api-2-41145913385.europe-north1.run.app/internal/graphql" \
    -H "Content-Type: application/json" -H "Origin: https://ut.no" \
    -d '{"query":"{ cabins(paging:{first:5}) { totalCount edges { node { id name serviceLevel geojson } } } }"}'
  ```
- **Merk:** Sett `Origin` og `Content-Type`. GeoJSON: `Point` for hytter `[lon, lat, altitude]`, `LineString` for ruter. `serviceLevel`: `STAFFED`, `SELF_SERVICE`, `NO_SERVICE`, `RENTAL`. Cursor-basert paginering for `routes`/`cabins`, men `routesNear`/`cabinsNear` returnerer array direkte.

### 7. iNatur — kommersielle hytter

- **Base URL:** `https://www.inatur.no/internal/search`
- **Auth:** Ingen
- **Rate limit:** Ikke dokumentert; bruk fornuftig
- **Endepunkter:**
  - `/internal/search?type=hyttetilbud` — søk hytter; 12/side; paginering med `?side=0,1,2…`
  - `/internal/search` (uten filter) — alle 5 639 tilbud (hytter, fiske, jakt, småvilt)
- **Eksempel:**
  ```bash
  curl "https://www.inatur.no/internal/search?type=hyttetilbud&side=0" \
    -H "Accept: application/json"
  ```
- **Felter:** id, tittel, fraPris, antallSenger, amenities, fylker, kommuner, kortBeskrivelse, thumbnailImageSrc
- **Amenities:** heating, electricity, wifi, parking, water, cooking, refrigerator, pet, disabilityAccessible
- **Merk:** Ingen koordinater i søkeresultat — bruk kommune/fylke for grov plassering. Bilder via Cloudflare. Kombiner med UT.no for fullstendig hyttebilde.

### 8. Miljødirektoratet — friluftsområder og naturvern

- **Base URL:** `https://kart.miljodirektoratet.no/arcgis/rest/services`
- **Auth:** Ingen
- **Rate limit:** Ikke dokumentert; standard ArcGIS REST. Bruk `resultRecordCount` for å begrense
- **Endepunkter:**
  - `friluftsliv_kartlagt/MapServer/0/query` — kartlagte friluftsområder (verdi, type, egnethet, brukerfrekvens)
  - `friluftsliv_statlig_sikra/MapServer/0/query` — statlig sikra friluftsområder (offentlig tilgjengelige)
  - `vern/MapServer/query` — vernet natur (nasjonalparker, naturreservater)
- **Eksempel:**
  ```bash
  curl "https://kart.miljodirektoratet.no/arcgis/rest/services/friluftsliv_kartlagt/MapServer/0/query?where=1%3D1&outFields=*&resultRecordCount=5&f=json"
  ```
- **Feltverdier:**
  - `omraadetype`: `Utfartsomraade`, `Naerturterreng`, `Sti_loeype`, `Badeplass`, `Annet friluftslivsomraade`
  - `omraadeverdi`: `SvaertViktigFriluftslivsomraade`, `ViktigFriluftslivsomraade`, `RegistrertFriluftslivsomraade`
  - `brukerfrekvens`: `Hoey`, `Middels`, `Lav`
- **Merk:** Geometri er ESRI-JSON-ringer; konverter til GeoJSON med terraformer eller turf.js. `faktaark`-feltet lenker til Naturbase-detaljer.

### 9. Vegvesen Trafikkdata — trafikkmengde

- **Base URL:** `https://trafikkdata-api.atlas.vegvesen.no/`
- **Auth:** Ingen
- **Rate limit:** Ikke dokumentert; bruk presise queries
- **GraphQL-felter:**
  - `trafficRegistrationPoints` — alle 9 963 målepunkter; navn, koordinater, vegreferanse
  - `trafficData(trafficRegistrationPointId)` — volum for et punkt; `byHour`, `byDay`, `byMonth` med `from`/`to`
  - `areas` — fylker for filtrering
  - `roadCategories` — vegtyper: E (europa), R (riks), F (fylke)
- **Eksempel:**
  ```bash
  curl -X POST "https://trafikkdata-api.atlas.vegvesen.no/" \
    -H "Content-Type: application/json" \
    -d '{"query":"{ trafficRegistrationPoints { id name location { coordinates { latLon { lat lon } } } } }"}'
  ```
- **Merk:** Finn punkter via `trafficRegistrationPoints`, hent volum via `trafficData`. `roadReference.shortForm` gir vegnummer (f.eks. `EV6 S26D1 m1470`). Test på <https://trafikkdata.atlas.vegvesen.no>.

### 10. NVDB — rasteplasser, fjelloverganger, bompenger

- **Base URL:** `https://nvdbapiles-v3.atlas.vegvesen.no`
- **Auth:** `User-Agent`-header (browser-like)
- **Rate limit:** Ikke dokumentert
- **Endepunkter (vegobjekter):**
  - `/vegobjekter/39` — rasteplasser (1 091 totalt; areal, parkering, dekke, fasiliteter)
  - `/vegobjekter/319` — kolonnekjøringsstrekninger (85; fjelloverganger med kolonnekjøring/vinterstengt)
  - `/vegobjekter/45` — bomstasjoner (449; takster, rushpriser)
  - `/vegobjekter/856` — trafikkreguleringer (6 766; kjøreforbud, restriksjoner)
- **Eksempel:**
  ```bash
  curl "https://nvdbapiles-v3.atlas.vegvesen.no/vegobjekter/39?inkluder=egenskaper,lokasjon&antall=5" \
    -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Friluftskompis"
  ```
- **Merk:** Bruk `?inkluder=egenskaper,lokasjon` for data + koordinater. Filter: `?fylke=50`, `?kommune=5001`, `?kartutsnitt=bbox`. Koordinater i UTM33/EPSG:25833 — konverter til WGS84 med proj4js.

---

## APIer som krever registrering

### 1. Apify — Airbnb-scraper

- **Base URL:** `https://api.apify.com/v2/acts/NDa1latMI7JHJzSYU/runs`
- **Auth:** Apify-konto + API-token
- **Pris:** $1,25 per 1 000 resultater. Gratis: $5/mnd. Maks ~240 resultater per søk
- **Eksempel:**
  ```bash
  curl "https://api.apify.com/v2/acts/NDa1latMI7JHJzSYU/runs" \
    -H "Authorization: Bearer <APIFY_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"locationQueries":["Rondane, Norway"],"maxResults":50}'
  ```
- **Merk:** Bruk norske stedsnavn. Inkluderer lat/lon. Kombiner med UT.no. **API-token i Blank 1Password.**

### 2. Strava — ruter og aktiviteter

- **Base URL:** `https://www.strava.com/api/v3`
- **Auth:** OAuth 2.0 (client credentials i 1Password)
- **Rate limit:** 200 req/15 min, 2 000/dag
- **Pris:** Gratis
- **Endepunkter:**
  - `/athlete` — innlogget brukers profil
  - `/athlete/activities` — brukerens aktiviteter (turer, løp, sykkel)
  - `/routes/{id}` — rute med GeoJSON
  - `/segments/explore` — populære segmenter i området
- **Merk:** OAuth-flow: bruker logger inn på Strava og autoriserer → `access_token` (utløper etter 6t, bruk `refresh_token`). Egnet for «importer dine turer» eller «finn populære ruter i nærheten». Callback-domene: `localhost` for dev. **Client ID/secret i Blank 1Password.**

### 3. Google Maps Platform

- **Auth:** API-nøkkel via Blank GCP
- **Rate limit:** Per produkt
- **Pris:** Pay-as-you-go. $300 trial credit. 10K gratis kall/mnd per produkt
- **Produkter:**
  - Geocoding API — adresse ↔ koordinater
  - Places API — søk steder rundt en posisjon
  - Directions API — bilrute A→B
- **Merk:** Maps JavaScript API for interaktive kart, Static Maps for bilder. Places API for «nærmeste bensinstasjon ved utgangspunktet». Directions API som alternativ til Entur for bilister. Vurder Kartverket + Overpass først for å spare kostnad. **API-nøkkel fra Blanks GCP-konto.**

### 4. Claude API

- **Base URL:** `https://api.anthropic.com/v1/messages`
- **Auth:** `x-api-key`-header
- **Rate limit:** Tier-avhengig
- **Pris:** Sonnet 4.6 — $3/MTok input, $15/MTok output. Haiku 4.5 — $1/MTok input, $5/MTok output
- **Merk:** Haiku for raske/billige kall (autocomplete, klassifisering); Sonnet for kompleks turplanlegging. Bruk system-prompt med norsk friluftskontekst, DNT-gradering og fjellsikkerhetsregler. Tool use / function calling for å kalle andre APIer. Streaming for bedre UX. **Hvert team bruker eget Anthropic-abonnement.**

### 5. DATEX II v3 — Vegvesen sanntid

- **Base URL:** `https://datex-server-get-v3-1.atlas.vegvesen.no/datexapi/`
- **Auth:** HTTP Basic Auth (credentials i 1Password)
- **Rate limit:** Ikke dokumentert; pull snapshot, ikke poll oftere enn hvert 60. sekund
- **Endepunkter:**
  - `.../GetSituation/pullsnapshotdata` — trafikkhendelser: ulykker, stengninger, vegarbeid, vegforhold
  - `.../GetTravelTimeData/pullsnapshotdata` — sanntids reisetid mellom faste punkter
  - `.../GetMeasuredWeatherData/pullsnapshotdata` — vegvær: temp, sikt, vind, vegbane
  - `.../GetCCTVSiteTable/pullsnapshotdata` — webkameraer; bilde-URLer
  - `.../GetForecastPointData/pullsnapshotdata` — værprognose for vegstrekninger
  - `.../GetPredefinedTravelTimeLocations/pullsnapshotdata` — predefinerte strekninger
- **Eksempel:**
  ```bash
  curl -u "username:password" \
    "https://datex-server-get-v3-1.atlas.vegvesen.no/datexapi/GetSituation/pullsnapshotdata"
  ```
- **Merk:** Responsene er store XML (5–20 MB) — bruk streaming-parser (sax-js for Node, `lxml.etree.iterparse` for Python). `GetSituation` er mest nyttig (stengninger, kolonnekjøring, ulykker, vegarbeid med koordinater). `GetMeasuredWeatherData` for «er det trygt å krysse fjellet?» — kombiner med Yr. Webkamera-URLer kan vise live fjelloverganger. **Credentials i 1Password — aldri hardkodet.**

---

## Anbefalt stack uten registrering

**Kart:**
- Kartverket WMTS som bakgrunn (norsk turkart med høydekoter og stier)
- Overpass for POI-overlay (hytter, utsiktspunkter, vann)
- Geonorge stedsnavn for søk/autocomplete

**Vær og sikkerhet:**
- Yr LocationForecast (9-dagers per utgangspunkt)
- Yr NowCast (sanntid, kun Norden)
- Varsom/NVE (skred- og farevarsel på kart)

**Hytter og ruter:**
- UT.no GraphQL (1 999 DNT-hytter, 1 395 merkede ruter, koordinater, beskrivelser)
- iNatur søk (5 639 kommersielle hytter/utleier, bilder, priser)
- Miljødirektoratet (kartlagte friluftsområder, verdi, egnethet)

**Transport og veg:**
- Entur Geocoder (stoppestedssøk)
- Entur Journey Planner (kollektiv til utgangspunkt)
- Vegvesen Trafikkdata (trafikkmengde til start)
- NVDB (rasteplasser, fjelloverganger, bomstasjoner)
