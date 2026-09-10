# @mims/db

Drizzle schema, migrations and seed data.

## The fitment model

The thing everything else depends on. Three levels, narrowing:

```
makes              Toyota
vehicle_models     Camry
vehicle_variants   XV50, 2012–2017, trim NULL, engine NULL
```

A **variant** is what fitment targets, and it carries a year _range_ rather than a
single year — parts catalogues publish fitment by generation, and one row per
model-year would multiply the table for nothing.

`trim` and `engine` are nullable on purpose: **NULL means "covers all"**. Most
users identifying manually will not know their trim, and vPIC routinely returns
it blank on imports, so the common path has to resolve to a variant with those
fields empty rather than dead-end.

The many-to-many is `part_fitments`:

```
part_fitments(part_id, variant_id, year_start?, year_end?, qualifier?)
```

`year_start`/`year_end` are NULL for the ordinary case, meaning "the whole of the
variant's range". They exist for mid-generation changes — a 2015 facelift that
altered the bumper inside a 2012–2017 variant.

## Zones → parts

`part_zones(part_id, zone_id, quantity)` states zone membership **directly on the
part**, not inherited from its category. A radiator support belongs to the
radiator zone on one vehicle and the front bumper zone on another; category
inheritance cannot express that.

An estimate resolves as: selected zones → `part_zones` → parts → filtered by
`part_fitments` for the identified variant.

## Prices are history, not a column

`part_prices` is append-only. Every row is an observation — this part, in this
condition, cost this much, on this date, from this source. Nothing is updated in
place; a new price is a new row.

That gives "last updated" for free, and it is what lets the results screen show a
figure with provenance instead of a number of unknown age. `amount_min` /
`amount_max` because the UI shows ranges; a single known figure is stored with
min == max. `fx_rate_usd_ngn` is stored alongside because imported parts reprice
with the rate, and a Naira figure without its rate cannot be aged honestly.

Money is `numeric(14,2)`, which Drizzle returns as a **string** — deliberate, so
that converting to a number is always an explicit decision and float arithmetic
on money is impossible by accident.

## Estimates are snapshots

Part names, numbers and prices are **copied onto** `estimate_items` when the
estimate is produced. A user may show it to a mechanic weeks later or read a part
number aloud from it; it has to still say exactly what they were shown, even if
the catalogue has since been re-priced. Foreign keys are kept alongside the
copies for analytics and are all nullable-on-delete.

`is_priced = false` is a first-class row: _you need this part and we do not have a
price_. Partial coverage is the expected early outcome, not an edge case.

## Commands

```bash
pnpm db:generate   # SQL from schema changes — commit the output
pnpm db:migrate    # apply pending migrations
pnpm db:push       # dev only: sync schema without a migration file
pnpm db:seed       # placeholder data
pnpm db:studio     # browse
```

> Every part number in `src/seed.ts` is prefixed `PLACEHOLDER-` and every price is
> an invented round figure, so nothing there can be mistaken for catalogue data.
> Replace it wholesale — do not "correct" those numbers.

## Auth tables

`src/schema/auth.ts` holds Better Auth's four tables (`user`, `session`,
`account`, `verification`). Their names and columns are dictated by the library,
so they break the conventions used elsewhere in this schema. Regenerate with
`pnpm dlx @better-auth/cli generate` rather than editing by hand. Nothing is
wired up yet — they exist so migrations do not need rewriting when auth is
switched on.
