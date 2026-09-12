# MIMS

Car spare parts platform for the Nigerian market. Two halves of one product: a
**damage estimator** — identify a vehicle, tick the damaged body zones, get back
the parts needed with estimated Naira prices — and a **parts marketplace** that
sells those parts at one all-in Naira price. MIMS is the merchant of record on a
consignment model, so suppliers are admin rows rather than users: there is no
seller portal and there will not be one.

> **Status: web frontend built against mock data; the marketplace is being built
> schema-first.** Every consumer screen from the design canvas is implemented in
> `apps/web` and runs end to end without the API. The commerce schema and its
> contracts exist (suppliers, listings, carts, orders, addresses, pickup points,
> payments, order events) and the marketplace home is live at `/`, with the
> estimator now starting at `/estimate/new`. The API still returns typed stubs,
> and every part number and price is placeholder data — see
> [The AI boundary](#the-ai-boundary) and `apps/web/src/mock/parts.ts`.
>
> Not built yet: search and browse, product detail, cart, checkout and the admin
> dashboard. See [What is not built](#what-is-not-built).

## Layout

```
apps/
  web      Next.js (App Router) — store and estimator       → Railway
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

Visit <http://localhost:3000> for the store, or `/estimate/new` for the
estimator. **It needs neither the API nor
the database** — the whole flow runs on the mock catalogue in
`apps/web/src/mock`, so `pnpm --filter @mims/web dev` on its own is enough to
work on the frontend. `apps/admin` still renders only the scaffold's API health
panel, and that panel should go when the admin screens are designed.

[`bella.md`](bella.md) is the onboarding doc and the walkthrough: the stack, the
platforms, the decisions already made, the rules that are not negotiable, and
which VIN decodes, which makes are deliberately uncovered, and how to reach each
of the five states.

## Screens

The design is the Claude Design project **MIMS** (Direction B, desktop-first at
1280px, phone views are the same components narrowed — there is no separate
mobile build). Every route below is a transcription of one of its files.

| Route                            | Design file    | What it is                                        |
| -------------------------------- | -------------- | ------------------------------------------------- |
| `/`                              | —              | The marketplace home. Not from the canvas.        |
| `/parts`                         | —              | Search and browse. Not from the canvas.           |
| `/parts/[slug]`                  | —              | Product detail. Not from the canvas.              |
| `/cart`                          | —              | A holding page until build-plan item 5.           |
| `/estimate/new`                  | `B1Vehicle`    | Screen 1 — VIN or manual cascade, as siblings     |
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
as illustrations — `/states` just shows them together. A bad VIN on
`/estimate/new` really does produce state 01; an uncovered make (try Peugeot) really does produce state
02; `/estimate` passes through the loading state on the way to results.

Component inventory: `src/components/ui.tsx` (buttons, panels, inputs, toggles,
segmented controls, quantity stepper), `chrome.tsx` (header, shell, page
heading, footer), `zone-selector.tsx`, `parts-table.tsx`, `part-number.tsx`,
`states.tsx`, `mark.tsx`, `vehicle-context.tsx`, `part-art.tsx`. The store adds
`browse.tsx` (search, facets, results), `listing-row.tsx`, `listing-detail.tsx`,
`listing-photo.tsx` and `fitment.tsx`.

`fitment.tsx` is worth reading before anything else in the store. It holds the
four states — confirmed, probable, unknown, and "no car set", which is a fourth
rather than a synonym for the third — and every screen that mentions fitment
says it through these components so the answer cannot drift between them. There
is no green tick anywhere: `probable` takes the caution treatment, because
around half of all parts returns are fitment errors and a tick invites exactly
the skim this product cannot survive.

The marketplace screens are **not** transcriptions. The estimator was built from
the design canvas and that canvas is its specification; the store is built from
the same system by decision, extending `globals.css` and the inventory above
rather than waiting on artboards. Anything the store needs that the estimator
never had — a price that is a price rather than an estimate, a quantity stepper,
a delivery selector — gets designed _inside_ that system.

`vehicle-context.tsx` is the store's spine: the car you are shopping for, shown
on every marketplace page and changeable in place. It shares one localStorage
store with the estimator, so a car set in either half is known to both.

`part-art.tsx` draws the parts — category schematics and the plan-view car — in
the system's own two stroke weights. They are **drawings and not photographs on
purpose**: a photograph of a part is a claim about that part, we hold none, and a
stock image of somebody else's product would be the visual form of the invented
part number the AI boundary forbids. Real photography belongs on listings, of
listings.

**That rule was relaxed once, on purpose — see `bella.md` §10.** Four labelled
stock images are live as a stopgap, sourced in
`apps/web/public/listings/SOURCES.md`. The `illustrative` flag on a `StorePhoto`
is what makes it defensible: it marks the image on every search row and puts a
plain caveat on the product screen saying the photograph shows the kind of part
rather than the one you will receive. Drop the flag when a photograph is
genuinely of the listing; do not drop it to tidy the page up.

`listing-photo.tsx` is the frame those photographs will land in, and it renders
the drawn state until they do. The two states are given deliberately different
proportions — a photographic 4:3 plate, a wide shallow 16:7 diagram — so they
can never be mistaken for one another, and the product screen states in words
that the picture is a drawing. Bytes go in **Cloudflare R2**; delivery is
**Cloudflare Images** transformations at the edge (`lib/images.ts`), which is
why there is no `next/image` here — the CDN has already resized it, and doing it
again on the Railway container would pay twice for one result.

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

- **The rest of the store.** Cart, checkout and Paystack, order tracking, and
  the estimator's "add these to a cart" exit. They are items 5 to 9 of the build
  plan in `bella.md` §12, worked two per session and in that order. `/cart` is a
  holding page so the product screen's buy button is real; it is the only inert
  route in the store.
- **Admin dashboard.** Not designed, and that is the founder's call to make.
  `apps/admin` is untouched scaffold.
- **API wiring.** `src/lib/api-client.ts` is the typed client and is ready; the
  screens read from `src/mock` instead. Each mock module names the query that
  replaces it. Nothing in the commerce schema has a route in front of it yet.
- **Photographs of our own stock.** Labelled stock imagery is standing in. The
  storage and delivery are built and configured by one env var
  (`NEXT_PUBLIC_IMAGE_BASE_URL`); what is missing is pictures of the actual goods
  and the founder's call on whether we shoot them or publish a supplier's. Any
  listing without an entry in `PART_PHOTOS` still renders its drawn state.

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

### Two gaps the design opened — now closed

Building the screens surfaced two things the contracts did not carry. Both were
catalogue data rather than presentation, so both went onto the schema when the
commerce tables did:

1. **`estimateItemSchema` has `detail` and `sourceLabel`.** The results table
   prints a fitment note under each part name ("Primed, unpainted. Fog-lamp
   cut-outs for LE trim.") and a source tag in the last column ("Genuine only").
   They are snapshotted on `estimate_items` with the rest of the row, because
   they are part of what the user was told.
2. **`ResolvedVehicle` has `chassisCode`** (and `bodyStyle`), and
   `vehicle_variants` has the column behind it. Parts are matched to the chassis
   rather than the model name — it is the product's central claim and it is
   printed in three places.

Still worth knowing: the design uses **nine** damage zones, not the seven the API
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
