# Testing MIMS — the frontend walkthrough

Everything below runs on mock data. **You do not need the API, the database, or
`.env`.** One command, one browser tab.

```bash
pnpm install          # first time only
pnpm --filter @mims/web dev
```

Open <http://localhost:3000>.

> If port 3000 is busy: `pnpm --filter @mims/web exec next dev --port 3001`.
> Don't run `pnpm build` while `dev` is running — they share `apps/web/.next`
> and the production build will break the dev server. If that happens:
> stop dev, `rm -rf apps/web/.next`, start dev again.

## The test data

Everything you need to reach every path:

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

---

## 1. The main flow — do this first

This is the path a real user takes. It should never dead-end.

**Screen 1 — `/`**

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

## 2. The states — the common outcomes, not edge cases

`/states` shows all five side by side. But test them **live**, because they are
real components in the real flow, not illustrations:

- **VIN not found** — on `/`, decode `JTDBR32E030999999`. You should land on
  state 01, which routes you to the manual cascade rather than scolding you.
- **Not in catalogue** — on `/`, use Route B: **Peugeot** → 508 → any year →
  any trim. You should get "We don't price this car yet" with email capture,
  _not_ an error. This is the most common early outcome and must not read as
  failure.
- **Partial coverage** — the main flow above already produces it (2 of 5).
- **Loading / slow connection** — seen on the way into `/estimate`.

## 3. The rest of the screens

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

## 4. Responsive

There is no separate mobile build — phone views are the same components
narrowed. **Test at 390px** (DevTools → iPhone 14). The damage diagram at 380px
with a thumb is the interaction the whole product hangs on; if that fails,
nothing else matters.

Also worth one pass: the logo lockup in the header, and `/estimate/…/share`
printed in **black and white** — the PDF is meant to survive a workshop laser
and be left on a counter for a week.

---

## What is deliberately inert

None of these are bugs. They are the honest edge of "frontend built against
mock data":

- **Every email capture** (coverage gap, notify-me, waitlist) shows its
  confirmed state locally and posts nowhere. There is no API behind it yet.
- **Sign-in accepts any six digits.** There is no auth.
- **Every part number and price is placeholder data** carried over from the
  design canvas. See `apps/web/src/mock/parts.ts`.
- **DOWNLOAD PDF** navigates to the print sheet and relies on the browser's own
  print dialog. There is no PDF generator.
- **`apps/admin`** still renders only the scaffold's API health panel.

## What does not exist yet

The **landing page** and the **admin dashboard**. Neither has been designed —
the Claude Design canvas ends with "Remaining from the original brief: landing
page and admin dashboard", so there is nothing to test. `/` opens the estimator
in the meantime.
