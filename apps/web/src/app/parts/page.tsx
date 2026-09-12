import type { Metadata } from 'next';
import { AppHeader, PageHeading, Shell, SiteFooter } from '@/components/chrome';
import { Button, Kicker, Note, Panel, PanelBar, Title } from '@/components/ui';
import { VehicleContext } from '@/components/vehicle-context';
import { STORE_CATEGORIES } from '@/mock/store';

export const metadata: Metadata = {
  title: 'Browse parts',
  description:
    'Search and browse the MIMS parts catalogue by name, part number, category or vehicle.',
};

/**
 * ⚠️ HOLDING PAGE — deliberately inert, and the only inert route the store has.
 *
 * Search and browse is build-plan item 3; the marketplace home is item 2. The
 * home page has to offer a way into the catalogue or it is not a front door, so
 * this route exists to catch those links rather than 404 them, and it says what
 * it is instead of pretending to be a search that finds nothing. The category
 * links carry their `?category=` code through, so nothing needs rewiring when
 * the real screen lands here.
 */
export default function BrowsePartsPage() {
  return (
    <>
      <AppHeader label="Parts store · Browse" meta="NGN · Duty included" />
      <VehicleContext />

      <main>
        <Shell width="app">
          <PageHeading
            kicker="Catalogue"
            title="Browse parts"
            lede="Search by part name or number, filter by category and condition, and see every result graded against your car."
            size="md"
          />

          <Panel weight="heavy" className="mt-[20px]">
            <PanelBar weight="heavy" right="Item 3 of the build plan">
              Not open yet
            </PanelBar>
            <div className="px-[15px] py-[18px]">
              <Title className="text-[18px]">Search is being built</Title>
              <p className="text-ink-soft mt-[9px] max-w-[62ch] text-[13.5px] leading-[1.55]">
                This is where searching and browsing will live — by part name, by the number stamped
                on the old part, by category, or by picking your car. It is not here yet, and we
                would rather say so than show you an empty results page and let you conclude we have
                nothing.
              </p>

              <div className="mt-[16px]">
                <Kicker as="div" className="text-muted tracking-[0.12em]">
                  Categories it will open with
                </Kicker>
                <ul className="mt-[9px] flex flex-wrap gap-[8px]">
                  {STORE_CATEGORIES.map((category) => (
                    <li
                      key={category.code}
                      className="border-edge bg-panel-3 text-ink-soft border-[1.5px] px-[9px] py-[6px] text-[12.5px] leading-none"
                    >
                      {category.name}
                    </li>
                  ))}
                </ul>
              </div>

              <Note tone="rule" className="mt-[18px]">
                In the meantime, the estimator does the harder half of the job: mark where your car
                is damaged and it names the parts you need, with part numbers and Naira ranges you
                can take to any workshop.
              </Note>

              <div className="mt-[16px] flex flex-wrap gap-[10px]">
                <Button variant="primary" size="lg" href="/estimate/new">
                  Start an estimate
                </Button>
                <Button variant="outline" size="lg" href="/coverage">
                  Check if your car is covered
                </Button>
              </div>
            </div>
          </Panel>
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
