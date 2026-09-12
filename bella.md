# Bella — start here

Everything you need to know to work on MIMS: what it is, what it is becoming,
how to run it, and the handful of rules that are not up for negotiation.

If you read nothing else, read [The rules](#the-rules-that-are-not-negotiable).
They are the reason the product is trusted, and they are easy to break by
accident.

---

## 1. What MIMS is

A car spare parts platform for the Nigerian market.

**Phase one, built:** a damage estimator. Someone identifies their vehicle — by
VIN or by picking make, model, year and trim — ticks which body zones are
damaged, and gets back the parts they will need with estimated Naira prices.
They leave with a WhatsApp message or a one-page A4 PDF.

The user is not a shopper. They have just crashed, or a mechanic has just quoted
them ₦400,000 and they suspect they are being cheated. The product's value is not
convenience, it is **ammunition** — it exists so someone can walk into a workshop
knowing what things actually cost. That framing decides everything about how it
looks and reads. Credibility over delight. Every number looks sourced. Nothing is
a guess dressed up nicely.

Assume the user is on a phone, on mobile data, possibly at a roadside, in
sunlight, on a cheap Android. Desktop is the adaptation, not the other way round.

**Phase two, starting now:** a marketplace. The same user can buy the parts.

---

## 2. Where it is going

MIMS becomes an e-commerce app that connects vetted Chinese and Japanese parts
manufacturers to West African car owners. The marketplace becomes the front door
— the first thing a user sees on opening the app — and the estimator becomes one
of several ways into it rather than the whole product.

The founder's framing is "like Temu or Jumia". Concretely that means the
**consignment model**: suppliers agree a wholesale price, MIMS sets the retail
price, and MIMS owns the customer relationship, the pricing, the support and the
returns. The customer never talks to a supplier.

This matters more than it sounds. It means **there is no vendor portal, no seller
onboarding, no per-supplier payouts and no Paystack subaccounts or transaction
splits.** Suppliers are rows in the admin tool, not users with logins. If you
find yourself designing a seller dashboard, stop — that is the semi-managed model
and it is not what we are building.

---

## 3. Decisions already made

Settled with the founder. Don't reopen these without going back to them.

| Question          | Decision                                                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Marketplace model | Middleman / consignment. We are the merchant of record.                                                                            |
| Currency          | **NGN only** for the MVP. No switcher, no "West Africa" framing yet.                                                               |
| Payments          | **Paystack.** Card, bank transfer, USSD and bank account all exist — design for all four, not just card.                           |
| Fulfilment        | Door delivery **and** pickup from a collection point, coexisting. Neither defaults.                                                |
| Estimator ending  | Pivots to **cart**. The WhatsApp and PDF exits stay.                                                                               |
| Stock             | Build something that **tolerates both** models — held stock and pre-order against a supplier. Lead time is a range, not a promise. |
| Pricing           | **Duty-inclusive.** One all-in Naira price. Delivery shown separately. Nothing appears for the first time on the last step.        |

That last one is the important one. A customs surprise on arrival would destroy
exactly the trust the estimator was built to earn.

---

## 4. What the research says you are up against

These are researched constraints, not opinions. They shape the build.

- **Fitment is the whole risk.** Auto parts return rates run as high as 20%, and
  about half of all returns are fitment problems. Now add 3–6 week sea freight
  from China: a cross-continental return costs more than the part. Fitment
  certainty has to be established _before_ purchase. It cannot be backstopped by
  a returns process.
- **"No return, no refund" is illegal in Nigeria.** The FCCPC has declared it
  contrary to the FCCPA 2018. Defective, counterfeit or materially misdescribed
  goods entitle the customer to replacement or refund regardless of store policy.
  We need a lawful policy that separates our error from the customer's, and we
  may not print a blanket refusal.
- **Nigerian buyers prefer cash on delivery**, specifically out of scam fear. COD
  is incompatible with importing on four-week lead times, so we are prepaid —
  which means the entire trust burden lands on the interface with no safety net.
  The pickup option helps here more than it looks: collecting from a real place
  is far less frightening than prepaying a stranger.
- **FX moves enough to matter.** The naira traded roughly ₦1,350–₦1,430 across
  2026 with active pass-through into import prices. We take payment upfront, so
  **we** carry FX risk between order and landing. Listings need a price-validity
  window; orders must snapshot the rate at payment.
- **Landed cost is a real calculation**: duty (5–35% by HS code — auto parts vary
  more than any other category) on CIF, +7% port surcharge on the duty, +1% CISS,
  +0.5% ETLS, then 7.5% VAT on the assembled base, plus freight. That stack lives
  in an admin tool. The customer sees one number.
- **Competitors are workshop-facing.** Fixit45, Mecho Autotech and Garage sell to
  mechanics and retailers; Autochek and Cars45 do vehicle sourcing and financing.
  A consumer-facing parts store with an estimator as its acquisition channel is a
  genuinely different position.

---

## 5. Repo layout

```
apps/
  web      Next.js (App Router) — the store and the estimator          → Railway
  admin    Vite + React SPA — internal catalogue tooling               → Cloudflare Pages
  api      NestJS — serves web, admin, and a future mobile app         → Railway
packages/
  db         Drizzle ORM + PostgreSQL schema, migrations, seed
  contracts  Zod schemas; every shared type is inferred from them
```

There is deliberately no `packages/ui`. Web and admin have different design
languages and premature sharing would cost more than the duplication does.

### How types flow

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
to a route's shape becomes a compile error in both frontends. **Schema first,
then contracts, then screens** — building a screen before its contract means
inventing the shape twice.

---

## 6. The stack

|                 |                                                         |
| --------------- | ------------------------------------------------------- |
| Runtime         | Node ≥ 22 (currently v22)                               |
| Package manager | pnpm 12.3.4, workspaces                                 |
| Monorepo        | Turborepo                                               |
| Web             | Next.js 15 App Router, React 19, Tailwind CSS 4         |
| Admin           | Vite 7, React 19, Tailwind CSS 4                        |
| API             | NestJS 11, Zod 4 validation                             |
| Database        | PostgreSQL via Drizzle ORM 0.44 + Drizzle Kit           |
| Auth            | Better Auth 1.3 — **tables exist, nothing is wired up** |
| Lint/format     | ESLint 9 (flat config), Prettier 3 + Tailwind plugin    |

Type on the consumer side is **Chivo** for prose and headings, **Space Mono** for
anything a user might read aloud to a dealer — part numbers, VINs, prices, codes.
The palette lives in `apps/web/src/app/globals.css` and every value there was
lifted from the design canvas. If a colour is not in that file, it is not in the
design.

---

## 7. Platforms involved

**Live now**

| Platform         | For             | Notes                                                                                                                                                                    |
| ---------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Railway          | `api` and `web` | `apps/*/railway.json`. Both build from the repo root with a `--filter` so one app's change doesn't rebuild the other. API healthchecks `/health` and migrates on deploy. |
| Cloudflare Pages | `admin`         | `apps/admin/wrangler.toml`, output `apps/admin/dist`                                                                                                                     |
| PostgreSQL       | everything      | Railway Postgres in production; use the internal URL there                                                                                                               |
| NHTSA vPIC       | VIN decoding    | Free, no API key. Slow and occasionally down, which is why we cache and audit every decode in `vin_lookups`.                                                             |

**Coming with the marketplace**

| Platform                             | For                          | What you'll need to know                                                                                           |
| ------------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Paystack                             | payments                     | See below — it has sharp edges                                                                                     |
| Object storage                       | part photos, estimate photos | Schema already stores only a key, not the blob. Provider not chosen.                                               |
| A logistics partner                  | delivery + pickup points     | Not chosen. GIG, Kwik, Sendbox and Jumia Delivery are the field; Jumia alone runs ~494 pickup stations in Nigeria. |
| A freight forwarder / sourcing agent | China→Nigeria consolidation  | Operational, not code — but it sets the lead times the UI has to state honestly.                                   |

### Paystack, concretely

The docs are worth reading, but these are the things that bite:

- `POST /transaction/initialize` with `email`, `amount` **in kobo** (₦5,000 =
  `500000`), our own `reference`, and `callback_url`. Returns `authorization_url`
  and `access_code`.
- `GET /transaction/verify/:reference` — **server-side only**, with the secret key.
- Webhook event `charge.success`, signed in the `x-paystack-signature` header as
  **HMAC-SHA512 of the raw request body** using the secret key. Hash the _raw_
  body, not re-serialised JSON, or it will never match.
- Check `data.status === 'success'` — not the envelope's `status`, which only
  tells you the API call worked. Then check the amount and the currency.
- **Never grant value on the redirect alone.** A user can fabricate a callback
  with a spoofed reference. Verify server-side, every time.
- Webhook handlers must be idempotent — check whether the reference has already
  been fulfilled before granting value again.
- Fees: 1.5% + ₦100, capped at ₦2,000; the ₦100 is waived under ₦2,500.
  Settlement is T+1.

---

## 8. Getting it running

### The whole thing

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

### Just the frontend — which is all you need most days

Everything on the consumer side runs on mock data. **You do not need the API, the
database, or `.env`.**

```bash
pnpm install          # first time only
pnpm --filter @mims/web dev
```

Open <http://localhost:3000>.

> If port 3000 is busy: `pnpm --filter @mims/web exec next dev --port 3001`.
> Don't run `pnpm build` while `dev` is running — they share `apps/web/.next`
> and the production build will break the dev server. If that happens:
> stop dev, `rm -rf apps/web/.next`, start dev again.

### Root scripts

| Command                        | Does                                      |
| ------------------------------ | ----------------------------------------- |
| `pnpm dev`                     | All three apps, watch mode                |
| `pnpm build`                   | Turborepo build, correct dependency order |
| `pnpm lint` / `pnpm typecheck` | Across every workspace                    |
| `pnpm format`                  | Prettier over everything                  |
| `pnpm db:generate`             | Write migration SQL from schema changes   |
| `pnpm db:migrate`              | Apply pending migrations                  |
| `pnpm db:seed`                 | Load placeholder development data         |
| `pnpm db:studio`               | Drizzle Studio                            |

---

## 9. The frontend walkthrough

Use this to check nothing has regressed. Everything below runs on mock data.

### The test data

| To get                  | Use                                                      |
| ----------------------- | -------------------------------------------------------- |
| A successful VIN decode | `JTDBR32E030123456` — the only VIN that resolves         |
| A failed VIN decode     | Any other 17 valid characters, e.g. `JTDBR32E030999999`  |
| A fully covered car     | Toyota → Corolla (the demo car, richest data)            |
| An uncovered car        | **Peugeot** or **Innoson** — any model                   |
| A sign-in code          | Any six digits. Nothing is checked.                      |
| An estimate reference   | Any string. `/e/MI-4471` and `/e/ANYTHING` are the same. |

State lives in `localStorage` under `mims.estimate.v1`. **To start genuinely
clean, clear site data** — otherwise your last car and damage list are still
there, which is deliberate (the slow-connection screen promises exactly that).

### The store — the front door

`/` is the marketplace home, and the only screen here that is not a canvas
transcription. Check the band under the header first: it is the persistent
vehicle context, and it is the store's spine.

1. With no car set, it reads "Not set". Press **SET YOUR CAR**, choose
   Honda → Accord → 2019–2023 → XLE. The button names the car before you commit
   to it; press it and the band stamps `2023 HONDA ACCORD XLE`.
2. Navigate to `/parts` and back. The car is still there — the store and the
   estimator share one `localStorage` key, so a car set in either half is known
   to both.
3. Set an uncovered car (**Peugeot** → 508) and the band adds a NOT PRICED YET
   flag rather than pretending.
4. Every link on the page must go somewhere real. `/parts` is a holding page
   until build-plan item 3 and says so plainly.

### The main flow — do this first

This is the path a real user takes. It should never dead-end.

**Screen 1 — `/estimate/new`**

1. Type `JTDBR32E030123456` into ENTER YOUR VIN. Watch the counter reach 17/17
   and DECODE enable.
2. Press DECODE. A confirmation band appears: `2018 TOYOTA COROLLA LE`, chassis
   `ZRE172`, 148 parts on file.
3. Press **YES — MARK THE DAMAGE**.

   _Check:_ the header now reads `2018 TOYOTA COROLLA LE · ZRE172` with a CHANGE
   link, and chip `02 DAMAGE` is lit. The car carried across the screen.

**Screen 2 — `/damage`**

4. Tap zones on the plan-view diagram. Try **01 Front bumper**, **04 Headlight
   right**, **05 Radiator**, **06 Fender left**, **07 Fender right**.

   _Check:_ each tap adds a removable chip to SELECTED on the right, and the
   zone count on the GET PARTS & PRICES button updates. The cabin/doors band is
   hatched and inert — not in the catalogue, and it says so.

5. Switch to **CHECKLIST** and back to **DIAGRAM**.

   _Check:_ your selection survives the switch. These are two views of one
   state, not two widgets.

6. Press **GET PARTS & PRICES**.

**Screen 3 — `/estimate`**

7. _Check:_ it passes through a loading state before results. That is the real
   state 04, not a mock screenshot.
8. _Check:_ the header says **2 of 5 parts are priced**. Unpriced rows show
   `NOT ON FILE` or `No price` with a `Coverage gap` source — **they are never
   filled in with an invented number.** That is the product's central rule.
9. Press **COPY** on part `52119-02997`, then paste somewhere. Then press
   **COPY ALL PART NUMBERS**.
10. Try each exit: **SEND TO WHATSAPP** (opens a wa.me link), **DOWNLOAD PDF**
    (goes to the share screen), **SAVE ESTIMATE** (goes to sign-in), **PREVIEW
    WHAT THE MECHANIC SEES**.

### The states — the common outcomes, not edge cases

`/states` shows all five side by side. But test them **live**, because they are
real components in the real flow, not illustrations:

- **VIN not found** — on `/estimate/new`, decode `JTDBR32E030999999`. You should land on
  state 01, which routes you to the manual cascade rather than scolding you.
- **Not in catalogue** — on `/estimate/new`, use Route B: **Peugeot** → 508 → any year →
  any trim. You should get "We don't price this car yet" with email capture,
  _not_ an error. This is the most common early outcome and must not read as
  failure.
- **Partial coverage** — the main flow above already produces it (2 of 5).
- **Loading / slow connection** — seen on the way into `/estimate`.

### The rest of the screens

| Route                                    | What to check                                                                                                  |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `/photos`                                | Three stages: guide → upload → review. SKIP is visible at every stage and never blocks the estimate.           |
| `/e/MI-4471`                             | The read-only view a mechanic opens. No app chrome to get lost in.                                             |
| `/estimate/MI-4471/share`                | WhatsApp message and A4 PDF side by side. **Print this page** (⌘P) — it should come out as one clean page.     |
| `/signin`                                | Phone/email tabs, six digits, and the "just give me the WhatsApp link" escape. Account is optional throughout. |
| `/account/settings`                      | Leads with the garage, not profile details.                                                                    |
| `/account/estimates`                     | Saved estimates with staleness banners. A header link toggles the empty state.                                 |
| `/estimate/MI-4471/feedback`             | "Was the price right?" Answering "about right" should be ~4 taps with no amount asked.                         |
| `/coverage`, `/how-we-price`, `/privacy` | Read them. They are the pages that make the numbers arguable.                                                  |
| `/parts`                                 | The browse holding page. It should say it is not open yet, not show an empty result set.                       |

### Responsive

There is no separate mobile build — phone views are the same components
narrowed. **Test at 390px** (DevTools → iPhone 14). The damage diagram at 380px
with a thumb is the interaction the whole product hangs on; if that fails,
nothing else matters.

Also worth one pass: the logo lockup in the header, and `/estimate/…/share`
printed in **black and white** — the PDF is meant to survive a workshop laser
and be left on a counter for a week.

---

## 10. The rules that are not negotiable

**A model may never generate or infer a part number, a price, a part name, a
fitment claim, or a delivery date.** Those come out of Postgres or they do not
appear. The only thing a model may produce is the prose paragraph under the
results table explaining how parts were matched. That rule is enforced by types,
not by discipline — see `apps/api/src/modules/narration/narration.types.ts`. The
shipped narrator is a deterministic template with no model behind it.

The founder describes MIMS as having an "AI product matcher and price checker".
That is true in the sense that matching and explanation can be model-driven —
but every _fact_ in the output is retrieved, never generated.

The same rule holds in the mock data. Where the design canvas does not specify a
part number for a zone, the row is present but **unpriced with a null part
number**, not filled in with something plausible.

**The same rule applies to pictures.** A photograph of a part is a claim about
that part — a shopper reads the lamp in the image as the lamp in the box, down to
the connector. So no stock photography, ever: a stock image of somebody else's
product is the visual form of an invented part number. The store draws instead
(`apps/web/src/components/part-art.tsx`), because a schematic can honestly say
"this is the kind of thing" without claiming "this is the item you will receive".
Real photographs are allowed, and wanted, once they are photographs **of the
listing being sold** — that is what `listing_photos` is for, and it needs an
object-storage provider first.

**Everything else:**

- **No business logic in route handlers or components.** The API has a service
  layer; the frontends get thin data-access hooks over the typed client.
- **Every API response is `{ data }` or `{ error: { code, message } }`.** Applied
  centrally in one interceptor and one exception filter.
- **Money is a decimal string**, never a float — `numeric(14,2)` in Postgres,
  strings on the wire, converted only where displayed.
- **A failed VIN lookup is a normal result, not an error.** `/vin/decode` always
  returns 200 with an `outcome`; the manual cascade is a sibling route, not an
  exception handler.
- **Estimates are snapshots**, and orders will be too. Part names, numbers and
  prices are copied onto the record when it is created. Someone may read a part
  number off it aloud weeks later — it must still say what they were shown, even
  if the catalogue has been re-priced since. Foreign keys are kept alongside the
  copies for analytics and are all nullable-on-delete.
- **Prices are append-only history, not a column on `parts`.** Every row is an
  observation: this part, this condition, this much, this date, this source. A
  new price is a new row.
- **Commits are authored as System625 only.** No co-author trailers, no
  "generated with" lines, and no tool names in commit messages.

---

## 11. What exists, what is inert, what does not

**Built:** every consumer screen from the design canvas, running end to end in
`apps/web` on mock data. Fourteen routes, all transcribed from the canvas files
`B1Vehicle`…`B14Privacy`. The README has the route-to-design-file table.

**Deliberately inert** — not bugs, just the honest edge of "frontend on mocks":

- Every email capture shows its confirmed state locally and posts nowhere.
- Sign-in accepts any six digits. There is no auth.
- Every part number and price is placeholder data from the design canvas.
- DOWNLOAD PDF relies on the browser's print dialog. There is no PDF generator.
- `apps/admin` renders only the scaffold's API health panel.

**Also built:** the marketplace home at `/`, the persistent vehicle-context band,
and the whole commerce schema and its contracts. None of the commerce tables has
a route in front of it yet — that is item 10.

**Does not exist:** search and browse, product detail, cart, checkout, order
tracking, the admin dashboard, API wiring, object storage for part photos, and
`apple-icon.png` (Apple touch icons can't be SVG, so it needs a rasterised
export).

### Two gaps the design opened — closed with item 1

1. **`estimateItemSchema` carries `detail` and `sourceLabel`**, snapshotted on
   `estimate_items` like the rest of the row.
2. **`ResolvedVehicle` carries `chassisCode`** (and `bodyStyle`), with the column
   on `vehicle_variants` behind it. Parts match to the chassis, not the model
   name — it is the product's central claim and it is printed in three places.

Also: the design uses **nine** damage zones, not the seven the API stubs. It
splits headlights and fenders left/right and separates rear bumper from rear
panel. `apps/web/src/mock/zones.ts` is the list to seed `damage_zones` from.

---

## 12. The build plan

Ten items, worked **two per session**. Order matters — schema before screens.

1. ~~**Commerce schema and contracts**~~ — **done.** `suppliers`, `listings`
   (+ photos, + an append-only retail price ledger), `addresses`, `pickup_points`,
   `carts`, `orders` (+ items, + events), `payments` (+ raw provider events).
   Migration `0001`, placeholder seed, and Zod contracts in
   `packages/contracts/src/{listings,cart,fulfilment,orders,payments}.ts`. No UI,
   no routes — nothing in the API points at any of it yet.
   Three things rode along with it, all of them schema work: `part_fitments`
   gained a **confidence grade** (`confirmed` / `probable` / `unknown`) with
   evidence, and the two contract gaps the design opened were closed —
   `estimateItemSchema` now carries `detail` and `sourceLabel`, and
   `ResolvedVehicle` carries `chassisCode` and `bodyStyle`.
2. ~~**Marketplace home at `/`**~~ — **done.** The store is the front door; the
   estimator moved to `/estimate/new` and every link that meant "start an
   estimate" was repointed. `vehicle-context.tsx` is the persistent vehicle band,
   sharing one store with the estimator so the car is known to both halves.
   `/parts` is a holding page until item 3 lands, so no link on the home page is
   a dead one.
3. **Search and browse** — by part name, number, category, or the `B1Vehicle`
   cascade. Per-row fitment. Condition as a first-class axis. Replaces the
   `/parts` holding page; `searchListingsQuerySchema` is already written for it.
   **Next session starts here, with item 4.**
4. **Product detail** — the screen the business lives or dies on. Fitment shown
   as evidence, with "probably fits, can't confirm" as its own designed state.
5. **Cart** — line snapshots, per-line fitment recheck, mixed lead times.
6. **Checkout and Paystack** — guest checkout, phone as identity, delivery or
   pickup, Nigerian address shape, server-side verify and signed webhooks.
7. **Confirmation, tracking, order history** — through to customs clearance,
   which stalls unpredictably and must not look broken when it does.
8. **Estimator → cart** — keeping the WhatsApp and PDF exits. The partial
   coverage case needs explicit handling.
9. **Returns policy and trust surfaces** — FCCPC-compliant. Plus the three
   coming-soon category pages; `waitlist_source` needs a third enum value.
10. **API wiring and admin** — replace `apps/web/src/mock/*` with real queries;
    admin gets supplier management, the landed-cost calculator, a listing editor
    and an order queue.

### Design authority

The estimator was transcribed from a Claude Design canvas, and for those screens
**the canvas is the specification** — exact colours, type sizes, rule weights and
copy. Don't improve on it.

The **marketplace is different**: it is being built from the existing design
patterns rather than from a canvas, by decision. Extend the system in
`globals.css` and the component inventory (`ui.tsx`, `chrome.tsx`,
`parts-table.tsx`, `zone-selector.tsx`, `states.tsx`, `mark.tsx`,
`vehicle-context.tsx`, `part-art.tsx`). If the
marketplace genuinely needs a component the estimator never had — a price that is
a price rather than an estimate, a quantity stepper, a delivery selector — design
it _in_ that system.

The **landing page and admin dashboard** remain undesigned and are the founder's
call. The marketplace home largely supersedes the landing page question; the
admin dashboard does not.

### One thing to hold onto

E-commerce convention pulls hard against this product's tone: urgency badges,
crossed-out prices, "23 people are viewing this", confetti at checkout. To a user
who thinks they are being cheated, every one of those reads as the behaviour of
someone about to overcharge them.

Build a store that sells the way the estimator informs. Prices stated flat and
once. No manufactured scarcity. Closer to a purchase order than a checkout funnel.
