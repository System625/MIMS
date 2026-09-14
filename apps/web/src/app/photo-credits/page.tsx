import type { Metadata } from 'next';
import Link from 'next/link';
import { AppHeader, PageHeading, Shell, SiteFooter } from '@/components/chrome';
import { Note, Panel, PanelBar } from '@/components/ui';
import { FLEET } from '@/mock/fleet';

export const metadata: Metadata = {
  title: 'Photo credits',
  description:
    'Every car photograph on this site, its photographer, its licence and where it came from.',
};

/**
 * PHOTO CREDITS.
 *
 * This page is a licence condition, not a courtesy. The car photographs are
 * used under CC BY and CC BY-SA, which require attribution and a link to the
 * licence, and a store that quietly skipped that while telling customers it
 * describes parts honestly would be making its own argument for it.
 *
 * It was built WITH the images rather than after them, because "we will add the
 * credits later" is how attribution never happens. Every row is generated from
 * the fleet data, so a photograph cannot be added to the site without appearing
 * here — there is no second list to keep in step.
 *
 * WHAT THESE PHOTOGRAPHS ARE. Other people's cars, of the same generation as
 * yours, used so you can recognise your car at a glance. They are not our
 * stock, not the car in any listing, and no part is described by them. Listing
 * photographs are a separate and much stricter question: a photograph of a part
 * is a claim about what arrives in the box, which is why `listing-photo.tsx`
 * refuses to show a stock image in place of one.
 */
export default function PhotoCreditsPage() {
  return (
    <>
      <AppHeader label="Parts store · Credits" meta={`${FLEET.length} photographs`} />

      <main>
        <Shell width="app">
          <PageHeading
            kicker="Attribution"
            title="Photo credits"
            lede="The car photographs on this site were taken by other people and are used under their licences. Each one is a car of the same generation as the tile it sits on."
          />

          <div className="mt-[18px]">
            <Note tone="rule">
              <strong className="font-bold">These are not photographs of our stock.</strong> They
              are pictures of other people&rsquo;s cars, there to help you find yours. No part is
              described by them, and no listing on this site shows a photograph of anything other
              than the item being sold — see{' '}
              <Link href="/how-we-price" className="text-flag-deep underline">
                how we price parts
              </Link>
              .
            </Note>
          </div>

          <div className="mt-[18px]">
            <Panel>
              <PanelBar right="Wikimedia Commons">Car photographs</PanelBar>
              <ul>
                {FLEET.map((car) =>
                  car.photo ? (
                    <li
                      key={car.id}
                      className="border-rule flex flex-wrap items-start gap-x-[14px] gap-y-[6px] border-b px-[13px] py-[11px]"
                    >
                      <span className="min-w-0 flex-[1_1_220px]">
                        <Link
                          href={`/garage/${car.id}`}
                          className="block text-[13.5px] font-bold uppercase leading-[1.25] no-underline"
                        >
                          {car.make} {car.model} · {car.generation}
                        </Link>
                        <a
                          href={car.photo.page}
                          className="text-muted mt-[3px] block break-words text-[11.5px] leading-[1.4] underline"
                        >
                          {car.photo.file}
                        </a>
                      </span>

                      <span className="min-w-0 flex-[1_1_150px] text-[12.5px] leading-[1.4]">
                        {car.photo.author}
                      </span>

                      <span className="flex-none">
                        {car.photo.licenceUrl ? (
                          <a
                            href={car.photo.licenceUrl}
                            className="text-flag-deep font-mono text-[11.5px] font-bold uppercase leading-none tracking-[0.06em] underline"
                          >
                            {car.photo.licence}
                          </a>
                        ) : (
                          <span className="text-muted font-mono text-[11.5px] font-bold uppercase leading-none tracking-[0.06em]">
                            {car.photo.licence}
                          </span>
                        )}
                      </span>
                    </li>
                  ) : null,
                )}
              </ul>
            </Panel>
          </div>

          <p className="text-muted mt-[18px] text-[12.5px] leading-[1.6]">
            Each photograph is re-hosted here rather than loaded from Commons, and cropped to a
            common frame; nothing else about it is altered. Where a car was photographed wearing a
            different badge from the name on its tile, the car&rsquo;s own page says so. If you are
            one of these photographers and something here is wrong, tell us and we will fix or
            remove it.
          </p>
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
