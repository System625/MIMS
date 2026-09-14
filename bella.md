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

| Question          | Decision                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Marketplace model | Middleman / consignment. We are the merchant of record.                                                                              |
| Currency          | **NGN only** for the MVP. No switcher, no "West Africa" framing yet.                                                                 |
| Payments          | **Paystack.** Card, bank transfer, USSD and bank account all exist — design for all four, not just card.                             |
| Fulfilment        | Door delivery **and** pickup from a collection point, coexisting. Neither defaults.                                                  |
| Estimator ending  | Pivots to **cart**. The WhatsApp and PDF exits stay.                                                                                 |
| Stock             | Build something that **tolerates both** models — held stock and pre-order against a supplier. Lead time is a range, not a promise.   |
| Pricing           | **Duty-inclusive.** One all-in Naira price. Delivery shown separately. Nothing appears for the first time on the last step.          |
| Listing images    | **Cloudflare R2** holds the bytes; **Cloudflare Images** transformations deliver them. One key in the database, resized at the edge. |

That last one is the important one. A customs surprise on arrival would destroy
exactly the trust the estimator was built to earn.

### Still open, and the founder's to settle

| Question              | What is blocked on it                                                                                                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Who photographs stock | Supplier-supplied images or our own. Still open. Labelled stock imagery is live as a stopgap (§10), which buys time but does not answer the question — a stock photo is nobody's description of the actual goods. |
| Admin dashboard       | Undesigned. `apps/admin` is untouched scaffold, and item 10 needs it.                                                                                                                                             |

**On photography — and note this is now partly overtaken by events; see §10.**
Stock imagery went live on 2026-09-12 on the founder's explicit call, labelled as
illustrative. The liability reasoning below is unchanged and is exactly why the
labelling is not optional. We are the merchant of record, so the picture on a listing is
_our_ description of the goods, and under the FCCPA a misdescribed good is a
refund whatever the policy says. A supplier's own photograph — of a different
batch, a different trim, a lamp with the other connector — becomes our
misdescription the moment we publish it. Shooting the stock we hold ourselves is
the safer answer and a real operational cost, which is worth knowing now rather
than discovering later. Until it is settled the store draws instead of
photographing; see §10.

**The plumbing for it is built and waiting.** R2 and the delivery path landed
with item 4 (`apps/web/src/lib/images.ts`, `components/listing-photo.tsx`), so
the day that call is made the only remaining work is uploading files and writing
alt text. Set `NEXT_PUBLIC_IMAGE_BASE_URL` to the bucket's Cloudflare custom
domain and photographs start appearing; leave it unset — as it is today — and
every listing takes its drawn state, which is the correct behaviour while we
hold no photography. There is no half-configured mode in which a customer sees a
broken image.

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

| Platform                             | For                          | What you'll need to know                                                                                                                                                                                                                                                                          |
| ------------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Paystack                             | payments                     | See below — it has sharp edges                                                                                                                                                                                                                                                                    |
| Cloudflare R2 + Images               | part photos, estimate photos | **Chosen.** R2 stores the object; the bucket sits behind a Cloudflare custom domain and delivery goes through `/cdn-cgi/image/<options>/<key>` — resized and format-negotiated at the edge, not on our Railway container. The database still holds only a key. Env: `NEXT_PUBLIC_IMAGE_BASE_URL`. |
| A logistics partner                  | delivery + pickup points     | Not chosen. GIG, Kwik, Sendbox and Jumia Delivery are the field; Jumia alone runs ~494 pickup stations in Nigeria.                                                                                                                                                                                |
| A freight forwarder / sourcing agent | China→Nigeria consolidation  | Operational, not code — but it sets the lead times the UI has to state honestly.                                                                                                                                                                                                                  |

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

| To get                   | Use                                                                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| A successful VIN decode  | `JTDBR32E030123456` — the only VIN that resolves                                                                                       |
| A failed VIN decode      | Any other 17 valid characters, e.g. `JTDBR32E030999999`                                                                                |
| A fully covered car      | Toyota → Corolla (the demo car, richest data)                                                                                          |
| An uncovered car         | **Peugeot** or **Innoson** — any model                                                                                                 |
| A sign-in code           | Any six digits. Nothing is checked.                                                                                                    |
| An estimate reference    | Any string. `/e/MI-4471` and `/e/ANYTHING` are the same.                                                                               |
| An order                 | `MO-2211` (stalled in customs), `MO-2214` (just placed, unpaid), `MO-2209` (mid-ocean), `MO-2205` (ready to collect), `MO-2196` (done) |
| The phone that opens one | `08000000000` — all five placeholder orders share it                                                                                   |

State lives in `localStorage` under `mims.estimate.v1`, the basket under
`mims.cart.v1`, and the orders this device has opened under `mims.orders.v1`.
**To start genuinely clean, clear site data** — otherwise your last car and
damage list are still there, which is deliberate (the slow-connection screen
promises exactly that).

Orders are guest-only: `/orders/MO-2211` will not show you anything until you
give the phone number above, and it asks for it whether or not the reference is
real, so the page cannot be used to discover which references exist. `/orders`
lists the five placeholders with a link into each.

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
4. Every link on the page must go somewhere real. Nothing in the store is a
   holding page any more: `/parts`, `/parts/[slug]`, `/cart` and `/checkout` are
   all built. The only stop is the pay button, which says so rather than spinning.

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

| Route                                    | What to check                                                                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/photos`                                | Three stages: guide → upload → review. SKIP is visible at every stage and never blocks the estimate.                                                   |
| `/e/MI-4471`                             | The read-only view a mechanic opens. No app chrome to get lost in.                                                                                     |
| `/estimate/MI-4471/share`                | WhatsApp message and A4 PDF side by side. **Print this page** (⌘P) — it should come out as one clean page.                                             |
| `/signin`                                | Phone/email tabs, six digits, and the "just give me the WhatsApp link" escape. Account is optional throughout.                                         |
| `/account/settings`                      | Leads with the garage, not profile details.                                                                                                            |
| `/account/estimates`                     | Saved estimates with staleness banners. A header link toggles the empty state.                                                                         |
| `/estimate/MI-4471/feedback`             | "Was the price right?" Answering "about right" should be ~4 taps with no amount asked.                                                                 |
| `/coverage`, `/how-we-price`, `/privacy` | Read them. They are the pages that make the numbers arguable.                                                                                          |
| `/parts`                                 | Search and browse. The vehicle grades rows rather than hiding them; `fitsOnly` reports what it hid.                                                    |
| `/cart`                                  | Add two parts, then **change your car in the band**. The basket must re-grade, never empty. Clear the car and every line says so.                      |
| `/checkout`                              | Submit it empty — every message must be a sentence, not a Zod string. Switch to **Deliver it**: there is no postcode box and no invented delivery fee. |

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

**Pictures are governed by the same idea, but the rule has been relaxed once,
deliberately, and the relaxation is written down here rather than quietly
absorbed.** A photograph of a part is a claim about that part — a shopper reads
the lamp in the image as the lamp in the box, down to the connector — and we are
merchant of record, so that claim is legally our description of the goods.

This file used to say "no stock photography, ever". **On 2026-09-12 the founder
overruled that**, with the trade-off put to them in writing first: free stock
libraries carry no isolated replacement-part photography at all (checked, not
assumed — what they carry is lamps mounted on other people's cars), the store
looked empty without imagery, and shipping something was judged worth more than
holding the line until we can photograph our own stock. Four stock images are
now live, listed in `apps/web/public/listings/SOURCES.md`.

**What the relaxation did not include, and what still holds:**

- **Every illustrative image labels itself, everywhere it appears.** The
  `illustrative` flag on a `StorePhoto` drives a corner marker on search rows and
  a plain-English caveat on the product screen: this shows the kind of part, not
  the one you will receive; judge fitment from the verdict and the number. That
  labelling is the entire difference between a presentation stopgap and a
  misdescription, so it is not a detail to tidy away when the page feels busy.
- **No manufacturer badge or wordmark** on any listing that is not that
  manufacturer's own part. A Toyota roundel on an aftermarket bumper is a
  trademark problem on top of a consumer-law one, and it is the version of this
  shortcut with no defence at all.
- **The gaps stay unillustrated.** Catalogue parts with no priced offer get no
  photograph — they are gaps, not offers, and a picture makes them look buyable.
- **This is a stopgap with an exit.** Drop the `illustrative` flag the day a
  photograph is genuinely of the listing; the frame stops cropping and the
  caveats disappear, because they will no longer be true.

The drawings have not gone anywhere and are still the honest default
(`apps/web/src/components/part-art.tsx`): a schematic says "this is the kind of
thing" without ever claiming "this is the item you will receive", and it is what
every listing without a photograph still renders. `ListingPhotoFrame` gives
drawings and photographs deliberately different proportions so the two can never
be mistaken for one another.

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
search and browse at `/parts`, product detail at `/parts/[slug]`, the cart at
`/cart`, checkout at `/checkout`, and the whole commerce schema and its
contracts. None of the commerce tables has a route in front of it yet — the store
runs on `apps/web/src/mock/listings.ts` and `mock/cart.ts`, and wiring it to
Postgres is item 10. The store has no holding pages left.

**Payments are the exception to "screens first".** `apps/api/src/modules/payments`
is a working, tested Paystack integration — initialize, server-side verify, and a
raw-body HMAC-SHA512 webhook — built at item 6 rather than deferred to item 10,
because a checkout that trusts the redirect is not a smaller version of a correct
one. It has no orders to attach to yet: `OrderPaymentsRepository` is the seam,
and today's in-memory stand-in honestly refuses every reference. Set
`PAYSTACK_SECRET_KEY` (test keys are fine) and the routes work; leave it unset
and they refuse rather than half-work.

**Does not exist:** order PLACEMENT (tracking, confirmation and history are
built, on placeholder orders — item 7), a published support channel of any kind,
the admin dashboard, API wiring, listing photographs (the storage and delivery
for them exist — see §3), and `apple-icon.png` (Apple touch icons can't be SVG,
so it needs a rasterised export).

**The missing support channel is worth calling out separately.** There is no
phone number, WhatsApp line or address anywhere in this repository, and it now
costs on two screens: the tracking page, where a customer who has prepaid for a
part stuck in customs has nowhere to go, and the returns policy, which sets out
in detail what we will do and then cannot say who to tell. `SUPPORT_CHANNEL` in
**`apps/web/src/lib/support.ts`** is the seam — it was a private constant in
`order-tracking.tsx` until item 9 needed the same answer — set it and every
escalation block on the site comes alive; leave it null and they say plainly
that there is no line yet, which is at least true. It is a founder's call, not a
build task.

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

**Done: 1–9. Item 10 is next** — API wiring and admin.

**The store now runs end to end on mock data**: browse, product, cart, checkout,
order tracking and order history, plus the estimator's pivot into the basket.
The two stops are the pay button, which says payment is not open rather than
spinning, and the orders themselves, which are placeholders until item 10.

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
3. ~~**Search and browse**~~ — **done.** One screen and one query for both, at
   `/parts`, replacing the holding page. Part name or number (punctuation
   ignored, because nobody reads a hyphen off a casting), category, condition
   and availability, all held in the URL so a filtered catalogue can be sent to
   a mechanic. **The vehicle grades rather than filters** — rows we cannot vouch
   for stay visible and marked, and `Only show confirmed fits` is the customer's
   own choice and reports what it cost them. Results come in two tiers: parts
   you can buy, and parts we can name but hold no priced offer for, which is a
   better answer to a search than an empty page.
4. ~~**Product detail**~~ — **done.** At `/parts/[slug]`, prerendered per
   listing. Fitment sits above the price and is built as evidence — the claim,
   the chassis it was matched on, the source, and what narrowing still applies —
   with `probable` given the caution treatment so it can never be skimmed as a
   yes. Also: the FX price-validity window, lead time as a range and never a
   date, the other condition grade offered as a choice rather than a discount,
   and the FCCPA position stated where the money is committed.
   **The photography half of §3 is now settled** — R2 for the bytes, Cloudflare
   Images for delivery — so the frame, its drawn state and the delivery pipeline
   are all built. Who takes the photographs is still the founder's call.
5. ~~**Cart**~~ — **done.** At `/cart`, replacing the holding page. The basket
   lives on the device (`lib/cart.tsx`) until item 10, on one rule: **snapshot
   the identity, derive the volatile.** Name, number, grade, SKU and stock model
   are frozen at add — that is what the customer read, and all a line can still
   say once its listing is withdrawn. Price, fitment, lead time and availability
   are looked up fresh on every read, because a cart that remembers a price
   cannot notice the price has moved. `priceAtAdd` and `fitmentAtAdd` sit across
   that line deliberately, kept for comparison so a re-priced line shows both
   figures. Changing the car re-grades the basket rather than emptying it; mixed
   lead times get two answers and the option to split; a withdrawn line keeps its
   part number, leaves the total, and carries no fitment grade at all.
   `mock/cart.ts` is the placeholder for `GET /api/v1/cart` and is
   contract-shaped, so item 10 deletes it and changes no screen.
6. ~~**Checkout and Paystack**~~ — **done, in two halves that meet at item 10.**
   `/checkout` is guest checkout — no account, phone as identity, pickup listed
   first as a peer of delivery, and a Nigerian address shape with no postcode
   field and landmark given its own row. Validation is built from the contract
   schemas, so a form that passes in the browser cannot be rejected by the API
   for a different reason, and unconfirmed fitment is acknowledged in writing
   before payment.
   **`apps/api/src/modules/payments` is real and tested**: server-side verify,
   `data.status` and never the envelope, amount and currency compared in minor
   units, idempotent settlement, and an HMAC-SHA512 webhook over the **raw** body
   (`main.ts` boots Nest with `rawBody: true`). The signed body is still not the
   evidence — the handler re-verifies, so exactly one code path can pay an order.
   25 tests run with no network or database; the API gained a `test` script.
   `OrderPaymentsRepository` is the seam item 10 implements against Postgres.
   **Two things the screen refuses to invent:** no logistics partner is chosen
   (§3), so a delivery order says plainly that we cannot total it yet while
   pickup totals exactly; and the pay button validates everything and then says
   payment is not open, because orders do not reach the database until item 10.
7. ~~**Confirmation, tracking, order history**~~ — **done.** `/orders` and
   `/orders/[reference]`, on placeholder orders until item 10. The screen's real
   subject is not events, it is SILENCE: a prepaid customer whose order stops
   emitting updates cannot tell the difference between customs and being robbed.
   So every stage says how long it has been quiet and whether that is normal
   there — sea freight's three weeks of nothing is named as the crossing itself,
   and a stall past its allowance turns the block orange and says somebody should
   be chasing it. No promised date anywhere. Stages that cannot happen are not
   drawn: held stock gets a four-step rail with no customs step to worry about,
   a sourced part gets seven. Confirmation is a STATE of this page rather than a
   separate one, because the screen you land on after paying is the screen you
   come back to for five weeks.
   **Order history without accounts:** the reference plus the phone it was placed
   with, and `lib/orders.tsx` keeps a keyring of the ones this device has been
   shown — the reference and four digits, nothing more. Two security choices: the
   gate is checked BEFORE the order is resolved, so an unknown device gets the
   lookup form whether or not the reference is real; and the lookup returns one
   failure for both halves, because "that reference exists, the number is wrong"
   hands an attacker the fact they were missing. The real endpoint needs a rate
   limit on top, which is item 10's.
   **Placeholder orders are pickup-only**, for the §3 reason that stops
   `/checkout` totalling a delivery order: no logistics partner, so no derivable
   fee, so none invented. Prices, names, numbers and fitment grades are read out
   of the catalogue rather than typed into `mock/orders.ts`.
   Also fixed here: `nigerianPhoneSchema` rejected `0803 123 4567` — the format
   its own error message recommends — which broke `/checkout` too. Separators are
   now accepted.
8. ~~**Estimator → cart**~~ — **done.** `/estimate/buy`, and a screen rather than
   a button because **"add to cart" must never silently mean "add the four we
   could price"**. An estimate is a list of parts a car needs; a basket is a list
   of things we can sell, and a five-zone estimate routinely contains a part we
   can name, number and confirm the fitment of and hold no priced offer for. Both
   groups are counted in the heading and the gaps are printed with their part
   numbers, which is what is still useful to somebody who now has to buy that
   piece elsewhere.
   It also has to explain that an estimate is a RANGE and a basket is a PRICE:
   where the canvas tags a part "aftermarket & genuine" both listings are offered
   with prices and lead times, the estimate's own assumption starts selected, and
   the summary prints the two figures side by side. A line already in the basket
   starts unticked so a revisit cannot double an order; changing its grade
   re-enables it. The join between the two catalogues is the part number with
   punctuation stripped, falling back to an exact name for the rows the canvas
   never numbered.
   The WhatsApp and PDF exits are untouched on `/estimate` and repeated on the
   buy screen. **Open design call:** the buy panel and the WhatsApp button are now
   two orange primaries on `/estimate`; whether WhatsApp steps down to ink after
   the pivot is the founder's to say.
9. ~~**Returns policy and trust surfaces**~~ — **done 2026-09-14.** `/returns`,
   and the promise repeated on the four screens where money is at stake.
   **The lawful position comes first and the window is not allowed to look like
   an expiry on it.** "No return, no refund" is contrary to the FCCPA 2018, so
   clause 01 is the loud one — defective, counterfeit, damaged in transit,
   misdescribed, or a fit we called `confirmed` that was not: replacement or
   refund, our cost, return freight included. Clause 02 then says in as many
   words that the seven-day window is a deadline on US, because our claim
   against a freight line or a factory decays, and that day eight does not turn
   a counterfeit part into a lawful sale. A policy that writes its window as an
   expiry on the law is the same unlawful thing in politer language.
   **The concession that actually matters is cancellation, not return.** On a
   four-week pre-order our money sits with us for most of the wait, so clause 03
   maps cancellation onto the real order statuses: free while `paid`, usually
   possible while `sourcing`, impossible once it is on the water, and refusable
   at the counter. That is worth more to a frightened buyer than a returns
   process they would have to fight for, and it costs us almost nothing.
   The fitment case splits on what we claimed: `confirmed` that does not fit is
   our misdescription and falls under clause 01; `probable`, printed as
   `probable`, is a risk named before payment and we re-list the part and refund
   what it sells for. Fitted, painted or drilled is the one honest no.
   **Deliberately not on the page:** section numbers of the Act (a wrong
   citation on a legal page is worse than none — §10), a restocking percentage,
   and a refund time in days that is really the bank's.
   Copy lives in `lib/returns.ts` and renders through one `ReturnsPosition`
   component on the product page, the basket, the checkout and the tracker,
   because a refund promise worded four ways is read as four promises.
   `SUPPORT_CHANNEL` moved to `lib/support.ts` for the same reason.
   **Also here: the three shelves we have not opened**, at `/soon/[shelf]` —
   facelift kits, tokunbo, accessories — with `waitlist_source` gaining
   `tokunbo_shelf` (migration `0002`, one additive line). They are pages rather
   than teaser boxes because each is shut for a reason worth reading: a facelift
   kit is one compatibility claim across ten parts at once and needs its own
   fitment data; tokunbo is blocked outright on the photography question, since
   every used part is a specific object with its own grade; accessories is the
   easy shelf we are doing last, and narrower than expected because we will not
   sell another manufacturer's badge. Each page draws what will go on it, and
   accessories draws EMPTY SLOTS — we have not chosen that range, and
   illustrating one would be choosing it by accident. The ask comes last, after
   the explanation, and says what the address actually decides.
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
