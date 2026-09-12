import type { Metadata } from 'next';
import { AppHeader, PageHeading, Shell, SiteFooter } from '@/components/chrome';
import { VehicleContext } from '@/components/vehicle-context';
import { Button, Kicker, Note, Panel, PanelBar, SquareList, Title } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Your cart',
  description: 'The MIMS basket — line-by-line fitment, mixed lead times, one all-in total.',
};

/**
 * ⚠️ HOLDING PAGE — deliberately inert, and the only inert route the store has
 * now that search and product detail are real.
 *
 * The cart is build-plan item 5. The product screen shipped with item 4 and has
 * to offer a way to buy or it is not a product screen, so this route catches
 * that button rather than 404ing it, and it says exactly what it is instead of
 * showing an empty basket and letting somebody conclude their part fell out of
 * it. That distinction matters here more than most places: an empty cart on a
 * store you already half-suspect is how people decide the site is broken and go
 * back to WhatsApp.
 */
export default function CartHoldingPage() {
  return (
    <>
      <AppHeader label="Parts store · Cart" meta="NGN · Duty included" />
      <VehicleContext />

      <main>
        <Shell width="read">
          <PageHeading
            kicker="Basket"
            title="The cart is not open yet"
            lede="Nothing was added and nothing was lost — this part of the store is still being built, and we would rather tell you that than show you an empty basket."
            size="md"
          />

          <Panel weight="heavy" className="mt-[20px]">
            <PanelBar weight="heavy" right="Item 5 of the build plan">
              Next to land
            </PanelBar>
            <div className="px-[15px] py-[18px]">
              <Title className="text-[18px]">What the cart will do</Title>
              <SquareList
                className="mt-[12px]"
                items={[
                  <>
                    <strong className="font-bold">Re-check fitment on every line.</strong> Change
                    your car and the basket is re-graded rather than emptied. Throwing away your
                    basket because you corrected your own trim would be the rudest possible answer
                    to being told the truth.
                  </>,
                  <>
                    <strong className="font-bold">Snapshot each line.</strong> The name, number and
                    price you were shown are copied onto the order, so what you read back weeks
                    later is what you agreed to.
                  </>,
                  <>
                    <strong className="font-bold">Handle mixed lead times honestly.</strong> A
                    basket holding one part from the Lagos shelf and one sourced from abroad has two
                    answers to &ldquo;when&rdquo;, and it will give you both rather than the worse
                    one dressed as the whole.
                  </>,
                ]}
              />

              <Note tone="rule" className="mt-[18px]">
                In the meantime the part page carries everything you would take to a workshop: the
                manufacturer number, the grade, the all-in price and every car we have confirmed the
                part against.
              </Note>

              <div className="mt-[16px] flex flex-wrap gap-[10px]">
                <Button variant="primary" size="lg" href="/parts">
                  Back to the catalogue
                </Button>
                <Button variant="outline" size="lg" href="/estimate/new">
                  Get a parts estimate
                </Button>
              </div>

              <Kicker as="div" className="text-muted-2 mt-[16px] tracking-[0.1em]">
                No payment is possible on this site yet
              </Kicker>
            </div>
          </Panel>
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
