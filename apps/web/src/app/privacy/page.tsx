import type { Metadata } from 'next';
import Link from 'next/link';
import { AppHeader, PageHeading, Shell, SiteFooter } from '@/components/chrome';
import { Button, Kicker, Panel, PanelBar, SquareList, StatCells, Title } from '@/components/ui';

export const metadata: Metadata = {
  title: 'What we hold, and why',
  description:
    'MIMS privacy notice. Written to be read: what we hold, why, how long, and how to get rid of it.',
};

/**
 * Privacy, written to be read.
 *
 * Short version first, then a what/why/kept-for table, then rights expressed as
 * the actual button to press rather than as a legal entitlement — "Settings →
 * Delete my account" is more useful to somebody than the phrase "right to
 * erasure". The bar for this page is that a user who is already worried about
 * being cheated finds nothing here that increases the worry.
 */
const ROWS = [
  {
    what: 'Your vehicle',
    tag: 'VIN or make/model/year',
    why: 'To match part numbers to your exact chassis code. This is the whole product.',
    kept: 'WITH THE ESTIMATE',
  },
  {
    what: 'Damage zones',
    tag: 'What you ticked',
    why: 'To build the parts list, and in aggregate to decide which parts to price next.',
    kept: 'WITH THE ESTIMATE',
  },
  {
    what: 'Phone number',
    tag: 'Only if you sign in',
    why: 'To send sign-in codes and the alerts you switched on. Never used for marketing.',
    kept: 'UNTIL YOU DELETE',
  },
  {
    what: 'Email address',
    tag: 'Only if you ask',
    why: "To send a PDF, or to tell you when a part we couldn't price gets a price.",
    kept: 'UNTIL YOU DELETE',
  },
  {
    what: 'Photos',
    tag: 'Optional',
    why: 'Reviewed by us to check the parts list against the real damage.',
    kept: '90 DAYS',
  },
  {
    what: 'Prices you report',
    tag: 'Optional',
    why: 'To correct our figures. Stored against the part, not against you.',
    kept: 'INDEFINITELY, ANONYMISED',
  },
] as const;

export default function PrivacyPage() {
  return (
    <>
      <AppHeader label="Privacy · NDPA 2023" />
      <main>
        <Shell width="narrow" className="px-[20px] pt-[24px]">
          <PageHeading
            title="What we hold, and why"
            lede="Written to be read. If anything here is unclear, that is our failure — ask and we will fix the wording."
            ledeBelow
          />
          <div className="text-muted mt-[12px] flex flex-wrap gap-x-4 gap-y-[6px] font-mono text-[11px] font-bold uppercase leading-[1.5] tracking-[0.09em]">
            <span>Effective 01 Sep 2026</span>
            <span aria-hidden>·</span>
            <span>Nigeria Data Protection Act 2023</span>
          </div>

          <Panel weight="heavy" className="mt-[20px]">
            <PanelBar tone="dark">The short version</PanelBar>
            <div className="p-[14px]">
              <SquareList
                items={[
                  'You can get an estimate without giving us anything at all.',
                  'We never sell your data, and we do not pass your details to workshops, traders or insurers.',
                  'Emails and phone numbers are used to sign you in and to send the alerts you asked for. Nothing else.',
                  'You can delete everything from Settings, and it is gone within 24 hours.',
                ]}
              />
            </div>
          </Panel>

          {/* what / why / kept-for */}
          <Panel className="mt-[16px]">
            <div className="bg-panel-2 border-ink text-muted flex gap-[10px] border-b-[1.5px] px-[13px] py-[8px] font-mono text-[11px] font-bold leading-[1.3] tracking-[0.1em]">
              <span className="flex-[34_1_180px]">WHAT</span>
              <span className="flex-[40_1_240px]">WHY</span>
              <span className="flex-[22_1_140px]">KEPT FOR</span>
            </div>
            {ROWS.map((row, index) => (
              <div
                key={row.what}
                className={`border-rule flex flex-wrap gap-x-[10px] gap-y-2 border-b px-[13px] py-[12px] ${
                  index % 2 === 1 ? 'bg-panel-4' : 'bg-panel'
                }`}
              >
                <div className="min-w-0 flex-[34_1_180px]">
                  <div className="text-[13.5px] font-bold uppercase leading-[1.25]">{row.what}</div>
                  <Kicker as="div" className="text-muted mt-[4px] leading-[1.4] tracking-[0.06em]">
                    {row.tag}
                  </Kicker>
                </div>
                <div className="text-ink-soft min-w-0 flex-[40_1_240px] text-[12.5px] leading-[1.5]">
                  {row.why}
                </div>
                <div className="min-w-0 flex-[22_1_140px] font-mono text-[12px] font-bold leading-[1.4]">
                  {row.kept}
                </div>
              </div>
            ))}
          </Panel>

          <div className="mt-[16px] grid gap-[14px]">
            <Panel className="px-[14px] py-[15px]">
              <Title className="text-[16px] leading-[1.2]">Photos</Title>
              <p className="text-ink-soft mt-[8px] text-[13.5px] leading-[1.6]">
                Photos you upload are reviewed by our own team to check the parts list, then deleted
                after 90 days. They are not published, not shown to traders, and not used to train
                anything. If a photo happens to show a plate number or a person, we crop it on
                review.
              </p>
            </Panel>

            <Panel className="px-[14px] py-[15px]">
              <Title className="text-[16px] leading-[1.2]">Share links</Title>
              <p className="text-ink-soft mt-[8px] text-[13.5px] leading-[1.6]">
                A shared estimate link is public to anyone holding it — that is the point, since a
                mechanic should not need an account. Links carry your car and the parts list, never
                your name, number or email. They expire after 30 days, and you can revoke one at any
                time from My estimates.
              </p>
            </Panel>

            <Panel className="px-[14px] py-[15px]">
              <Title className="text-[16px] leading-[1.2]">Who else touches it</Title>
              <p className="text-ink-soft mt-[8px] text-[13.5px] leading-[1.6]">
                Three processors, and only for the job named: an SMS gateway to send sign-in codes,
                an email provider for PDFs and alerts, and cloud hosting in the EU for the database.
                Nobody else receives your data, and we do not run advertising trackers.
              </p>
              <StatCells
                className="mt-[12px]"
                items={[
                  { label: 'SMS codes', value: 'Termii · Nigeria', basis: '140px' },
                  { label: 'Email', value: 'Postmark · USA', basis: '140px' },
                  { label: 'Hosting', value: 'Frankfurt · EU', basis: '140px' },
                ]}
              />
            </Panel>

            <div className="border-ink bg-flag-soft border-2 px-[14px] py-[15px]">
              <Title className="text-[16px] leading-[1.2]">Your rights, in practice</Title>
              <SquareList
                tone="ink"
                className="mt-[11px]"
                items={[
                  <>
                    <strong className="font-bold">See it:</strong> Settings → Download my estimates
                    gives you everything as a file, immediately.
                  </>,
                  <>
                    <strong className="font-bold">Correct it:</strong> edit your details in
                    Settings, or reply to any alert.
                  </>,
                  <>
                    <strong className="font-bold">Delete it:</strong> Settings → Delete my account.
                    No email required, no retention period.
                  </>,
                  <>
                    <strong className="font-bold">Complain:</strong> to us at privacy@mims.ng, or to
                    the Nigeria Data Protection Commission.
                  </>,
                ]}
              />
              <div className="mt-[14px] flex flex-wrap gap-[10px]">
                <a
                  href="mailto:privacy@mims.ng"
                  className="bg-ink text-paper border-ink flex min-h-[50px] flex-[1_1_200px] items-center justify-center border-[1.5px] px-[10px] text-center text-[12.5px] font-bold uppercase leading-[1.2] tracking-[0.04em]"
                >
                  Email privacy@mims.ng
                </a>
                <Button
                  variant="outline"
                  size="md"
                  href="/account/settings"
                  className="min-h-[50px] flex-[1_1_200px]"
                >
                  Go to my settings
                </Button>
              </div>
            </div>
          </div>

          <div className="text-muted mt-[18px] flex flex-wrap gap-x-4 gap-y-2 font-mono text-[11px] font-bold uppercase leading-[1.5] tracking-[0.09em]">
            <span>MIMS Technologies Ltd · Lagos</span>
            <span aria-hidden>·</span>
            <span>RC 1234567</span>
            <span aria-hidden>·</span>
            <Link href="/privacy" className="underline">
              Previous version: 04 Jul 2026
            </Link>
          </div>
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
