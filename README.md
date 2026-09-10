# MIMS

Car spare parts platform for the Nigerian market. Phase one is a **damage
estimator**: identify a vehicle, tick the damaged body zones, get back the parts
needed with estimated Naira prices.

A buyer-to-seller marketplace comes later. The schema is shaped to accept it; no
marketplace code exists yet.

> **Status: web frontend built against mock data.** Every consumer screen from
> the Claude Design canvas is implemented in `apps/web` and runs end to end
> without the API. The API still returns typed stubs, and every part number and
> price is placeholder data carried over from the design — see
> [The AI boundary](#the-ai-boundary) and `apps/web/src/mock/parts.ts`.
>
> Not built yet: the landing page and the admin dashboard, neither of which has
> been designed. See [What is not built](#what-is-not-built).

## Layout

```
apps/
  web      Next.js (App Router) — the estimator              → Railway
  admin    Vite + React SPA — internal catalogue tooling      → Cloudflare Pages
  api      NestJS — serves web, admin, and a future mobile app → Railway
packages/
  db         Drizzle ORM + PostgreSQL schema, migrations, seed
  contracts  Zod schemas; every shared type is inferred from them
```

There is no `packages/ui`. Web and admin have different design languages and
premature sharing would cost more than the duplication does.

## Getting started

```bash
pnpm install
cp .env.example .env                      # root: DATABASE_URL for Drizzle Kit
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env

pnpm db:generate    # SQL migrations from the Drizzle schema
pnpm db:migrate     # apply them
pnpm db:seed        # placeholder vehicles, parts and prices

pnpm dev            # api :3333 · web :3000 · admin :5173
```

Visit <http://localhost:3000> for the estimator. **It needs neither the API nor
the database** — the whole flow runs on the mock catalogue in
`apps/web/src/mock`, so `pnpm --filter @mims/web dev` on its own is enough to
work on the frontend. `apps/admin` still renders only the scaffold's API health
panel, and that panel should go when the admin screens are designed.

[`TESTING.md`](TESTING.md) is the walkthrough: which VIN decodes, which makes
are deliberately uncovered, and how to reach each of the five states.

## Screens

The design is the Claude Design project **MIMS** (Direction B, desktop-first at
1280px, phone views are the same components narrowed — there is no separate
mobile build). Every route below is a transcription of one of its files.

| Route                            | Design file    | What it is                                        |
| -------------------------------- | -------------- | ------------------------------------------------- |
| `/`                              | `B1Vehicle`    | Screen 1 — VIN or manual cascade, as siblings     |
| `/damage`                        | `B2Damage`     | Screen 2 — plan-view diagram **and** checklist    |
| `/estimate`                      | `B3Results`    | Screen 3 — parts table, prices, WhatsApp exit     |
| `/states`                        | `B4States`     | Screen 4 — the five states, side by side          |
| `/e/[reference]`                 | `B5Shared`     | The read-only estimate a mechanic opens           |
| `/estimate/[reference]/share`    | `B6Handoff`    | The WhatsApp message and the one-page A4 PDF      |
| `/photos`                        | `B7Photos`     | Optional photo upload, three stages               |
| `/coverage`                      | `B8Coverage`   | Which makes we price properly today               |
| `/how-we-price`                  | `B9Sources`    | Five numbered claims, including where we're wrong |
| `/signin`                        | `B10Auth`      | Six-digit code, no password, skippable            |
| `/account/settings`              | `B11Settings`  | Garage, alerts, details, deletion                 |
| `/account/estimates`             | `B12Estimates` | Saved estimates, with staleness banners           |
| `/estimate/[reference]/feedback` | `B13Feedback`  | "Was the price right?" — asked once               |
| `/privacy`                       | `B14Privacy`   | What we hold, why, and for how long               |

The five states in `B4States` are built as components used by the live flow, not
as illustrations — `/states` just shows them together. A bad VIN on `/` really
does produce state 01; an uncovered make (try Peugeot) really does produce state
02; `/estimate` passes through the loading state on the way to results.

Component inventory: `src/components/ui.tsx` (buttons, panels, inputs, toggles,
segmented controls), `chrome.tsx` (header, shell, page heading, footer),
`zone-selector.tsx`, `parts-table.tsx`, `part-number.tsx`, `states.tsx`,
`mark.tsx`.

### The logo

`MIMS Logos.dc.html` on the canvas carries fourteen candidate marks. The one
chosen is **2B, "shut line"** — two body panels and the jogged gap where they
meet. `mark.tsx` transcribes its geometry; both fills are existing palette
tokens (`paper`/`flag` on dark ground, `ink`/`flag-deep` on light), so the mark
introduced no new colour.

It appears in three places: the header lockup, the PDF letterhead on
`/estimate/[reference]/share`, and `src/app/icon.svg` as the favicon. The canvas
draws the mark twice — the display gap is widened and the lower panel raised
below 20px, because six units on a 64-unit grid vanish when rasterised that
small — and `Mark` picks the variant from its `size`, so callers don't have to.

Still missing: `apple-icon.png`. Apple touch icons can't be SVG, so it needs a
rasterised export the App Router picks up by filename.

## What is not built

- **Landing page.** Not designed — the canvas ends with "Remaining from the
  original brief: landing page and admin dashboard". Rather than invent one, `/`
  opens the estimator. When the landing page arrives it takes `/` and screen 1
  moves to `/estimate/new`; nothing else has to change.
- **Admin dashboard.** Also not designed. `apps/admin` is untouched.
- **API wiring.** `src/lib/api-client.ts` is the typed client and is ready; the
  screens read from `src/mock` instead. Each mock module names the query that
  replaces it.

## Root scripts

| Command                        | Does                                      |
| ------------------------------ | ----------------------------------------- |
| `pnpm dev`                     | All three apps, watch mode                |
| `pnpm build`                   | Turborepo build, correct dependency order |
| `pnpm lint` / `pnpm typecheck` | Across every workspace                    |
| `pnpm db:generate`             | Write migration SQL from schema changes   |
| `pnpm db:migrate`              | Apply pending migrations                  |
| `pnpm db:seed`                 | Load placeholder development data         |
| `pnpm db:studio`               | Drizzle Studio                            |

## How types flow

```
Drizzle schema  →  packages/db  (row types, inferred)
                        ↓  hand-checked against
Zod schemas     →  packages/contracts  (request/response types, inferred)
                        ↓  imported by
apps/api        →  validates every input with the same schemas
apps/web        →  typed client, return types from contracts
apps/admin      →  typed client, return types from contracts
```

No `any`, and no hand-written interface describing a row or a response. A change
to a route's shape becomes a compile error in both frontends.

### Two gaps the design opened

Building the screens surfaced two things the contracts do not yet carry. Both are
catalogue data rather than presentation, so they belong on the schema:

1. **`estimateItemSchema` needs a `detail` and a source label.** The results
   table prints a fitment note under each part name ("Primed, unpainted.
   Fog-lamp cut-outs for LE trim.") and a source tag in the last column
   ("Genuine only"). `apps/web/src/mock/parts.ts` carries them on a local
   `EstimateItemView` for now, marked with this note.
2. **`ResolvedVehicle` needs a chassis code.** Parts are matched to the chassis,
   not the model name — it is the product's central claim, it is printed on the
   confirmation band, the shared estimate and the PDF, and there is no field for
   it. `VehicleDetail` in `src/mock/vehicles.ts` adds it locally.

Also worth knowing: the design uses **nine** damage zones, not the seven the API
stubs. It splits headlights and fenders into left and right and separates the
rear bumper from the rear panel, so a user who was rear-ended can point at one
without claiming the other. `apps/web/src/mock/zones.ts` is the list to seed
`damage_zones` from.

## Conventions

- **No business logic in route handlers or components.** The API has a service
  layer; the frontends get thin data-access hooks over the typed client.
- **Every API response is `{ data }` or `{ error: { code, message } }`.** Applied
  centrally in one interceptor and one exception filter.
- **Money is a decimal string**, never a float — `numeric(14,2)` in Postgres,
  strings on the wire, converted only where it is displayed.
- **A failed VIN lookup is a normal result, not an error.** `/vin/decode` always
  returns 200 with an `outcome`; the manual make/model/year cascade is a sibling
  route, not an exception handler.

## The AI boundary

A model may **never** generate or infer a part number, a price, a part name, or a
fitment claim. Those come out of Postgres or they do not appear.

The only thing a model may produce is the prose paragraph under the results table
explaining how parts were matched and why they cost what they do. That rule is
enforced by types, not by discipline — see
`apps/api/src/modules/narration/narration.types.ts`. The shipped narrator is a
deterministic template with no model behind it; an LLM narrator would be a
one-line provider swap receiving exactly the same facts.

The same rule holds in the frontend's mock data. `apps/web/src/mock/parts.ts`
carries only the rows the design canvas itself specifies; for zones the design
does not enumerate a part number for, the row is present but **unpriced with a
null part number** rather than filled in with a plausible-looking invention.
That is also the honest state while the catalogue is small, and it is why the
partial-coverage path is easy to reach in the demo. `explain()` in that file
mirrors the API's template narrator: it can only restate facts already in the
rows it is handed.

## Deployment

| App     | Platform         | Config                                                                            |
| ------- | ---------------- | --------------------------------------------------------------------------------- |
| `api`   | Railway          | `apps/api/railway.json` — root dir `/`, healthcheck `/health`, migrates on deploy |
| `web`   | Railway          | `apps/web/railway.json` — root dir `/`                                            |
| `admin` | Cloudflare Pages | `apps/admin/wrangler.toml` — output `apps/admin/dist`                             |

Both Railway services build from the repo root with a `--filter` so a change to
one app does not rebuild the other; `watchPatterns` narrows what triggers a
deploy at all.
