'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ListingSort, PartCondition, StockModel } from '@mims/contracts';
import { useEstimateFlow } from '@/lib/estimate-flow';
import {
  categoryName,
  CONDITION_LABEL,
  searchListings,
  STOCK_LABEL,
  type SearchResult,
} from '@/mock/listings';
import { zoneByCode } from '@/mock/zones';
import { CatalogueGapRow, ListingRow, ResultTierHeading } from './listing-row';
import { Button, cx, Kicker, Note, Panel, PanelBar, Title } from './ui';

/**
 * SEARCH AND BROWSE — build plan item 3.
 *
 * Browse and search are the same question asked two ways, so this is one screen
 * and one query rather than a search page beside a category page. A part name,
 * a part number off the old casting, a category, or nothing at all and just
 * look — all four land here and narrow the same list.
 *
 * The rule the whole screen is built around: THE VEHICLE GRADES, IT DOES NOT
 * FILTER. With a car set, every row says how sure we are it fits that car — and
 * the rows we cannot vouch for stay visible, marked, rather than quietly
 * disappearing. Hiding them would make the catalogue look more certain than it
 * is and would stop the customer ever learning the part exists. `Only show
 * confirmed fits` is offered as the customer's own decision, and when it is on
 * the screen says what it cost them.
 *
 * State lives in the URL, not in React. A filtered catalogue is a thing people
 * send to their mechanic over WhatsApp, and a link that opens on a different
 * list than the sender saw would be its own small betrayal of the point.
 */

const CONDITIONS: readonly PartCondition[] = [
  'new_oem',
  'new_aftermarket',
  'used_tokunbo',
  'refurbished',
];

const SORTS: ReadonlyArray<{ value: ListingSort; label: string }> = [
  { value: 'fitment', label: 'Fitment first' },
  { value: 'price_asc', label: 'Price, low to high' },
  { value: 'price_desc', label: 'Price, high to low' },
  { value: 'newest', label: 'Recently listed' },
];

function isCondition(value: string): value is PartCondition {
  return (CONDITIONS as readonly string[]).includes(value);
}

function isSort(value: string | null): value is ListingSort {
  return value !== null && SORTS.some((sort) => sort.value === value);
}

/** A zone code we actually draw. Anything else in the URL is ignored, not searched for. */
function isZoneCode(value: string | undefined): value is string {
  return value !== undefined && zoneByCode(value) !== undefined;
}

export function BrowseParts() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { vehicle, hydrated } = useEstimateFlow();

  const q = params.get('q') ?? '';
  const categoryCode = params.get('category') ?? undefined;
  /* A body zone, arrived at by tapping a panel on a car's plan — build plan
     item 12. It is read the same way as a category and lives in the URL for the
     same reason: "the front of my Corolla" is exactly the kind of list somebody
     sends to their mechanic. An unrecognised code is dropped rather than
     searched for, so a mangled link returns the catalogue instead of nothing. */
  const zoneParam = params.get('zone') ?? undefined;
  /* Joined into a stable string first: an array rebuilt on every render is a
     new dependency every render, and the search below would then re-run
     whether or not the filters actually changed. */
  const conditionKey = params.getAll('condition').filter(isCondition).join(',');
  const condition = useMemo(
    () => (conditionKey ? (conditionKey.split(',') as PartCondition[]) : []),
    [conditionKey],
  );
  const stockParam = params.get('stock');
  const stockModel: StockModel | undefined =
    stockParam === 'held_stock' || stockParam === 'pre_order' ? stockParam : undefined;
  const fitsOnly = params.get('fits') === '1';
  const sortParam = params.get('sort');
  const sort: ListingSort = isSort(sortParam) ? sortParam : 'fitment';

  /** One writer for the whole query string, so no control can clobber another. */
  const update = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const result: SearchResult = useMemo(
    () =>
      searchListings({
        q,
        categoryCode,
        /* Validated here rather than above, so the memo's dependency is the raw
           parameter — the same shape as every other filter in this list. */
        zoneCode: isZoneCode(zoneParam) ? zoneParam : undefined,
        condition,
        stockModel,
        fitsOnly,
        sort,
        // Before the device store has been read the car is genuinely unknown to
        // us, and grading against `null` would flash "car not set" at somebody
        // who set one an hour ago. The results wait instead.
        vehicle: hydrated ? vehicle : null,
      }),
    [q, categoryCode, zoneParam, condition, stockModel, fitsOnly, sort, hydrated, vehicle],
  );

  /* Looked up after the query, not before it: the search takes the raw
     parameter, and this is only the zone's name and description for the chip. */
  const zone = isZoneCode(zoneParam) ? zoneByCode(zoneParam) : undefined;

  const activeFilters =
    (categoryCode ? 1 : 0) +
    (zone ? 1 : 0) +
    condition.length +
    (stockModel ? 1 : 0) +
    (fitsOnly ? 1 : 0);

  return (
    <div className="mt-[20px] flex flex-wrap items-start gap-[20px]">
      <FilterRail
        result={result}
        categoryCode={categoryCode}
        condition={condition}
        stockModel={stockModel}
        fitsOnly={fitsOnly}
        activeFilters={activeFilters}
        hasVehicle={hydrated && vehicle !== null}
        update={update}
      />

      <div className="min-w-0 flex-[3_1_460px]">
        <SearchField initial={q} update={update} />

        {/*
         * The zone is shown as a removable chip rather than as another checkbox
         * in the rail, because it did not come from the rail — somebody tapped
         * the front bumper of a picture of their car, and the screen has to
         * carry that context back to them or the narrowed result reads as a
         * catalogue that has lost most of its stock. Clearing it is one tap and
         * leaves every other filter alone.
         */}
        {zone ? (
          <div className="mt-[12px] flex flex-wrap items-center gap-[9px]">
            <span className="border-flag bg-flag-soft flex min-h-[36px] items-center gap-[8px] border-[1.5px] px-[10px] text-[12.5px] font-bold uppercase leading-none">
              {zone.name}
              <button
                type="button"
                onClick={() => update((next) => next.delete('zone'))}
                className="text-flag-deep font-mono text-[12px] font-bold"
              >
                ×<span className="sr-only">— show every panel again</span>
              </button>
            </span>
            <span className="text-muted text-[12px] leading-[1.4]">
              Parts on this part of the car. {zone.description}.
            </span>
          </div>
        ) : null}

        <div className="mt-[14px] flex flex-wrap items-center justify-between gap-x-[16px] gap-y-[10px]">
          <Kicker as="div" className="text-muted tracking-[0.11em]">
            {describeQuery(q, categoryCode, zone?.name)}
          </Kicker>

          <label className="flex items-center gap-[8px]">
            <Kicker as="span" className="text-muted tracking-[0.11em]">
              Sort
            </Kicker>
            <select
              value={sort}
              onChange={(event) =>
                update((next) => {
                  if (event.target.value === 'fitment') next.delete('sort');
                  else next.set('sort', event.target.value);
                })
              }
              className="border-ink text-ink h-[38px] min-w-0 border-[1.5px] bg-white px-[9px] text-[12.5px]"
            >
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!hydrated ? (
          <ResultsSkeleton />
        ) : (
          <Results result={result} fitsOnly={fitsOnly} q={q} update={update} />
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- the controls -- */

function SearchField({
  initial,
  update,
}: {
  initial: string;
  update: (mutate: (next: URLSearchParams) => void) => void;
}) {
  const [draft, setDraft] = useState(initial);

  /*
   * Submitted rather than typed-through. A search that re-runs on every
   * keystroke would rewrite the URL a dozen times per word, and on the mobile
   * data this product assumes it would also mean a dozen requests once the API
   * is behind this. Enter, or the button, is the whole interaction.
   */
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        update((next) => {
          const value = draft.trim();
          if (value) next.set('q', value);
          else next.delete('q');
        });
      }}
      className="flex flex-wrap gap-[9px]"
    >
      <label className="min-w-0 flex-[1_1_260px]">
        <span className="sr-only">Search parts by name or part number</span>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Part name, or the number off the old part"
          enterKeyHint="search"
          autoComplete="off"
          className="border-ink text-ink placeholder:text-faint h-[48px] w-full min-w-0 border-2 bg-white px-[12px] text-[14px]"
        />
      </label>
      <Button type="submit" variant="dark" size="md" className="flex-none">
        Search
      </Button>
      {initial ? (
        <Button
          variant="quiet"
          size="md"
          className="flex-none"
          onClick={() => {
            setDraft('');
            update((next) => next.delete('q'));
          }}
        >
          Clear
        </Button>
      ) : null}
    </form>
  );
}

function FilterRail({
  result,
  categoryCode,
  condition,
  stockModel,
  fitsOnly,
  activeFilters,
  hasVehicle,
  update,
}: {
  result: SearchResult;
  categoryCode: string | undefined;
  condition: readonly PartCondition[];
  stockModel: StockModel | undefined;
  fitsOnly: boolean;
  activeFilters: number;
  hasVehicle: boolean;
  update: (mutate: (next: URLSearchParams) => void) => void;
}) {
  // On a phone the filters must not push the results off the screen. They open
  // on demand there and are simply present on a wide one.
  const [open, setOpen] = useState(false);

  return (
    <div className="min-w-0 flex-[1_1_230px] lg:max-w-[266px]">
      <div className="lg:hidden">
        <Button variant="outline" size="md" full onClick={() => setOpen((prev) => !prev)}>
          {open ? 'Hide filters' : `Filters${activeFilters > 0 ? ` · ${activeFilters}` : ''}`}
        </Button>
      </div>

      <div className={cx('mt-[10px] grid gap-[14px] lg:mt-0', open ? 'grid' : 'hidden lg:grid')}>
        {/* Fitment first, because it is the axis this store is actually about. */}
        <Panel weight="heavy">
          <PanelBar weight="heavy">Fitment</PanelBar>
          <div className="p-[12px]">
            {hasVehicle ? (
              <>
                <ul className="grid gap-[6px]">
                  {result.facets.fitment.map((facet) => (
                    <li
                      key={facet.confidence}
                      className="flex items-baseline justify-between gap-[10px] text-[12.5px] leading-[1.3]"
                    >
                      <span className="text-muted capitalize">
                        {facet.confidence === 'unknown' ? 'No record' : `${facet.confidence} fit`}
                      </span>
                      <span className="font-mono text-[12px] font-bold">{facet.count}</span>
                    </li>
                  ))}
                </ul>
                <label className="border-rule-2 mt-[11px] flex cursor-pointer items-start gap-[9px] border-t pt-[11px]">
                  <input
                    type="checkbox"
                    checked={fitsOnly}
                    onChange={(event) =>
                      update((next) => {
                        if (event.target.checked) next.set('fits', '1');
                        else next.delete('fits');
                      })
                    }
                    className="accent-flag mt-[2px] h-[16px] w-[16px] flex-none"
                  />
                  <span className="text-ink-soft min-w-0 text-[12.5px] leading-[1.4]">
                    Only show confirmed fits
                  </span>
                </label>
              </>
            ) : (
              <p className="text-muted m-0 text-[12.5px] leading-[1.5]">
                Set your car in the band above and every row here is graded against it — confirmed,
                probable, or no record.
              </p>
            )}
          </div>
        </Panel>

        <Panel>
          <PanelBar>Category</PanelBar>
          <div className="p-[12px]">
            <ul className="grid gap-[3px]">
              <FacetButton
                label="All categories"
                count={result.facets.categories.reduce((sum, item) => sum + item.count, 0)}
                active={categoryCode === undefined}
                onClick={() => update((next) => next.delete('category'))}
              />
              {result.facets.categories.map((facet) => (
                <FacetButton
                  key={facet.code}
                  label={facet.name}
                  count={facet.count}
                  active={categoryCode === facet.code}
                  onClick={() =>
                    update((next) => {
                      if (categoryCode === facet.code) next.delete('category');
                      else next.set('category', facet.code);
                    })
                  }
                />
              ))}
            </ul>
          </div>
        </Panel>

        <Panel>
          <PanelBar>Condition</PanelBar>
          <div className="p-[12px]">
            {/*
             * Condition is a first-class axis here, not a discount ladder:
             * genuine and tokunbo are different goods with different buyers. A
             * zero beside one of them is information — it says we list none of
             * that grade for this search — and is left visible for that reason.
             */}
            <ul className="grid gap-[3px]">
              {result.facets.conditions.map((facet) => (
                <FacetButton
                  key={facet.condition}
                  label={CONDITION_LABEL[facet.condition]}
                  count={facet.count}
                  active={condition.includes(facet.condition)}
                  disabled={facet.count === 0 && !condition.includes(facet.condition)}
                  onClick={() =>
                    update((next) => {
                      const current = next.getAll('condition');
                      next.delete('condition');
                      const toggled = current.includes(facet.condition)
                        ? current.filter((value) => value !== facet.condition)
                        : [...current, facet.condition];
                      toggled.forEach((value) => next.append('condition', value));
                    })
                  }
                />
              ))}
            </ul>
          </div>
        </Panel>

        <Panel>
          <PanelBar>Availability</PanelBar>
          <div className="p-[12px]">
            <ul className="grid gap-[3px]">
              {(['held_stock', 'pre_order'] as StockModel[]).map((model) => (
                <FacetButton
                  key={model}
                  label={STOCK_LABEL[model]}
                  active={stockModel === model}
                  onClick={() =>
                    update((next) => {
                      if (stockModel === model) next.delete('stock');
                      else next.set('stock', model);
                    })
                  }
                />
              ))}
            </ul>
            <p className="text-muted m-0 mt-[10px] text-[11.5px] leading-[1.45]">
              Held stock ships from Lagos in days. Sourced parts are quoted in weeks, because sea
              freight and customs are not a date anyone can promise.
            </p>
          </div>
        </Panel>

        {activeFilters > 0 ? (
          <Button
            variant="quiet"
            size="sm"
            full
            onClick={() =>
              update((next) => {
                next.delete('category');
                next.delete('zone');
                next.delete('condition');
                next.delete('stock');
                next.delete('fits');
              })
            }
          >
            Clear {activeFilters} filter{activeFilters === 1 ? '' : 's'}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function FacetButton({
  label,
  count,
  active,
  disabled = false,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={active}
        onClick={onClick}
        className={cx(
          'flex min-h-[34px] w-full items-center justify-between gap-[10px] border-[1.5px] px-[9px] text-left text-[12.5px] leading-[1.25]',
          active
            ? 'border-ink bg-ink text-paper'
            : disabled
              ? 'border-rule-2 text-faint bg-transparent'
              : 'border-rule-2 text-ink-soft hover:bg-panel-4 bg-white',
        )}
      >
        <span className="min-w-0">{label}</span>
        {count !== undefined ? (
          <span className="flex-none font-mono text-[11.5px] font-bold">{count}</span>
        ) : null}
      </button>
    </li>
  );
}

/* ------------------------------------------------------------- the results -- */

function Results({
  result,
  fitsOnly,
  q,
  update,
}: {
  result: SearchResult;
  fitsOnly: boolean;
  q: string;
  update: (mutate: (next: URLSearchParams) => void) => void;
}) {
  const nothingAtAll = result.listings.length === 0 && result.gaps.length === 0;

  return (
    <div className="mt-[14px] grid gap-[20px]">
      {fitsOnly && result.hiddenByFitment > 0 ? (
        <Note tone="rule">
          <strong className="font-bold">
            {result.hiddenByFitment} result{result.hiddenByFitment === 1 ? '' : 's'} hidden
          </strong>{' '}
          because we have not confirmed {result.hiddenByFitment === 1 ? 'it' : 'them'} on your
          chassis. Some of those will fit.{' '}
          <button
            type="button"
            onClick={() => update((next) => next.delete('fits'))}
            className="text-flag-deep underline"
          >
            Show them, marked
          </button>
        </Note>
      ) : null}

      {result.listings.length > 0 ? (
        <section aria-labelledby="results-heading">
          <ResultTierHeading title="Parts you can buy" count={result.listings.length} />
          <div className="mt-[12px] grid gap-[12px]">
            {result.listings.map((listing) => (
              <ListingRow key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      ) : null}

      {result.gaps.length > 0 ? (
        <section aria-labelledby="gaps-heading">
          <ResultTierHeading
            title="In the catalogue, not in stock"
            count={result.gaps.length}
            note="No priced offer"
          />
          <p className="text-muted mt-[9px] max-w-[68ch] text-[12.5px] leading-[1.5]">
            We can name {result.gaps.length === 1 ? 'this part' : 'these parts'} and, where we hold
            the number, tell you what it is. We are not listing a price, because we have not got a
            verified one — and a plausible figure would be worth less to you than nothing.
          </p>
          <div className="mt-[12px] grid gap-[10px]">
            {result.gaps.map((gap) => (
              <CatalogueGapRow key={gap.slug} gap={gap} />
            ))}
          </div>
        </section>
      ) : null}

      {nothingAtAll ? <NothingFound q={q} update={update} /> : null}
    </div>
  );
}

/**
 * Nothing matched. Said plainly, with the two things that actually help — widen
 * the search, or go the other way round and let the estimator name the part
 * from the damage. No "did you mean", because we would be guessing at a part
 * number, and no apology dressed up as a promotion.
 */
function NothingFound({
  q,
  update,
}: {
  q: string;
  update: (mutate: (next: URLSearchParams) => void) => void;
}) {
  return (
    <Panel weight="heavy">
      <PanelBar weight="heavy" right="Nothing matched">
        No results
      </PanelBar>
      <div className="px-[15px] py-[16px]">
        <Title className="text-[17px]">
          {q ? <>Nothing here matches “{q}”</> : <>Nothing matches those filters</>}
        </Title>
        <p className="text-ink-soft mt-[9px] max-w-[62ch] text-[13px] leading-[1.55]">
          The catalogue is small and honest about it — we are stocking crash and body parts first,
          for the cars we can source them for. If the part you want is not here, it is not hidden
          behind a filter; we do not have it yet.
        </p>
        <div className="mt-[15px] flex flex-wrap gap-[10px]">
          <Button
            variant="outline"
            size="md"
            onClick={() =>
              update((next) => {
                next.delete('q');
                next.delete('category');
                next.delete('zone');
                next.delete('condition');
                next.delete('stock');
                next.delete('fits');
              })
            }
          >
            Show everything
          </Button>
          <Button variant="primary" size="md" href="/estimate/new">
            Name the part from the damage
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function ResultsSkeleton() {
  return (
    <div className="mt-[14px] grid gap-[12px]" aria-hidden>
      {[0, 1, 2].map((row) => (
        <div key={row} className="border-rule-2 bg-panel flex gap-[13px] border-[1.5px] p-[13px]">
          <div className="hatch border-rule-2 h-[86px] w-[132px] flex-none border-[1.5px]" />
          <div className="grid min-w-0 flex-1 content-start gap-[8px]">
            <div className="bg-panel-2 border-rule-3 h-[14px] w-[62%] border" />
            <div className="bg-panel-2 border-rule-3 h-[12px] w-[38%] border" />
            <div className="bg-panel-2 border-rule-3 h-[12px] w-[48%] border" />
          </div>
        </div>
      ))}
    </div>
  );
}

function describeQuery(
  q: string,
  categoryCode: string | undefined,
  zoneName: string | undefined,
): string {
  // The zone outranks the category in the description because it is the more
  // specific of the two and the one the customer arrived by.
  if (q && zoneName) return `“${q}” on the ${zoneName.toLowerCase()}`;
  if (zoneName) return zoneName;
  if (q && categoryCode) return `“${q}” in ${categoryName(categoryCode)}`;
  if (q) return `Results for “${q}”`;
  if (categoryCode) return categoryName(categoryCode);
  return 'Everything we stock';
}
