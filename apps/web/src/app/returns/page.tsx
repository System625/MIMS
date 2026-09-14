import type { Metadata } from 'next';
import Link from 'next/link';
import { AppHeader, PageHeading, Shell, SiteFooter } from '@/components/chrome';
import { Button, Kicker, Note, Panel, PanelBar, SquareList, Title } from '@/components/ui';
import { OUR_ERROR_GROUNDS, RETURN_REPORT_DAYS } from '@/lib/returns';
import { SUPPORT_CHANNEL } from '@/lib/support';

export const metadata: Metadata = {
  title: 'Returns and refunds',
  description:
    'What happens when a part is wrong: what is our mistake and our cost, what we cannot absorb, when an order can simply be cancelled, and how the money comes back.',
};

/**
 * THE RETURNS POLICY.
 *
 * Three things decide how this page is written.
 *
 * 1. "NO RETURN, NO REFUND" IS ILLEGAL HERE. Under the Federal Competition and
 *    Consumer Protection Act 2018, defective, counterfeit or misdescribed goods
 *    are a replacement or a refund whatever a shop's policy claims, and the
 *    FCCPC has said so publicly. So the unconditional half goes FIRST, in the
 *    loudest block on the page, and the reporting window is worded as a service
 *    promise about speed rather than as a cut-off — a policy that kills the
 *    right on day eight is the same unlawful thing in politer language.
 *
 * 2. THE ECONOMICS ARE HONEST OR THEY ARE NOTHING. Around half of all car-part
 *    returns are fitment, and against three to six weeks of sea freight a
 *    return can cost more than the part. A store in that position either lies
 *    about it or says so. Saying so is also the argument for everything else on
 *    the site: it is WHY the fitment verdict sits above the price, why
 *    `probable` is never dressed up as `confirmed`, and why we would rather
 *    lose a sale than take money for a panel that will not bolt on.
 *
 * 3. THE REAL CONCESSION IS CANCELLATION, NOT RETURN. On a four-week pre-order
 *    the money sits with us for most of the wait, so an order that has not yet
 *    been placed with a supplier can be cancelled outright for the full amount.
 *    That is worth far more to a customer than a returns process they would
 *    have to fight for, it costs us almost nothing, and it is the answer to the
 *    fear that actually stops people paying — not "will they take it back" but
 *    "have I just handed money to a stranger". It is section 03 because the two
 *    above it are legal obligations and this one is a promise.
 *
 * What is NOT on this page: section numbers of the Act (bella.md §10 — we do
 * not print a fact we do not hold, and a wrong citation on a legal page is
 * worse than none), a restocking percentage, a refund-processing time in days
 * that is really the bank's, and any phone number, because we do not have one.
 */
export default function ReturnsPage() {
  return (
    <>
      <AppHeader label="Returns and refunds" />
      <main>
        <Shell width="read" className="px-[20px] pt-[24px]">
          <PageHeading
            kicker="Returns and refunds"
            title="What happens when it is wrong"
            lede="Almost everything here comes down to one question: did we describe the part wrongly, or was a correctly described part ordered against the wrong car? The first is ours and we pay for it. The second is the expensive one, and this page says plainly what we can and cannot do about it."
            ledeBelow
          />

          {/* The whole policy in one diagram. A customer standing over an open
              box wants to know which side of this line they are on before they
              read a word of prose. */}
          <div className="mt-[22px] grid gap-[14px] sm:grid-cols-2">
            <Panel tone="soft" weight="heavy">
              <PanelBar tone="flag" weight="heavy">
                Our mistake
              </PanelBar>
              <div className="px-[15px] py-[14px]">
                <Title className="text-[16px] leading-[1.25]">
                  Replacement or refund, at our cost
                </Title>
                <p className="text-ink-soft mt-[8px] text-[13px] leading-[1.55]">
                  Broken, fake, or not what the listing said. You are entitled to this under the
                  Federal Competition and Consumer Protection Act whatever any policy says, ours
                  included, and we do not argue about it.
                </p>
              </div>
            </Panel>

            <Panel weight="heavy">
              <PanelBar weight="heavy">The harder one</PanelBar>
              <div className="px-[15px] py-[14px]">
                <Title className="text-[16px] leading-[1.25]">
                  Right part, wrong car — it depends what we claimed
                </Title>
                <p className="text-ink-soft mt-[8px] text-[13px] leading-[1.55]">
                  If we said the fit was <strong className="font-bold">confirmed</strong>, that was
                  our description and it is ours. If we said{' '}
                  <strong className="font-bold">probable</strong> and printed it that way, it is a
                  risk we named before you paid, and section 04 says exactly what we do.
                </p>
              </div>
            </Panel>
          </div>

          <div className="mt-[14px] grid gap-[14px]">
            <Clause
              number="01"
              title="If it is our mistake, it is our cost"
              tone="loud"
              body={
                <>
                  Any of the following and you get a replacement or your money back — whichever you
                  ask for — plus whatever you paid us to deliver it. We arrange and pay for the part
                  to come back. You are never asked to fund a return freight on our error, and you
                  are never offered credit in place of money.
                </>
              }
            >
              <SquareList tone="ink" className="mt-[12px]" items={OUR_ERROR_GROUNDS} />
            </Clause>

            <Clause
              number="02"
              title={`Tell us within ${RETURN_REPORT_DAYS} days — and what that window is not`}
              body={
                <>
                  Count from the day it is delivered or collected. The window exists because our own
                  recovery depends on it: a damage claim against a freight line and a fake-goods
                  claim against a factory both get harder the longer the box sits, and after a point
                  we simply cannot make either.
                </>
              }
            >
              <Note tone="rule" className="mt-[12px]">
                <strong className="font-bold">It is a deadline on us, not on your rights.</strong>{' '}
                Nothing in this policy cancels what the FCCPA gives you, and day{' '}
                {RETURN_REPORT_DAYS + 1} does not turn a counterfeit part into a lawful sale. A shop
                that writes its window as an expiry on the law has written an unlawful policy in
                polite language. Ours is a request for speed, and if you miss it, talk to us anyway.
              </Note>
            </Clause>

            <Clause
              number="03"
              title="Before it ships, cancel and take your money back"
              body={
                <>
                  This is the part worth knowing before you pay. Most of what you buy here is
                  ordered in against your name, so for most of the wait the money is still sitting
                  with us and nothing has been committed on your behalf. Until it is, you can stop
                  the order for any reason at all — including no reason — and get the full amount
                  back.
                </>
              }
            >
              {/* Anchored to the real order statuses, so a customer can find
                  themselves on the tracking page and know the answer without
                  asking. The words are the tracking screen's own. */}
              <div className="border-rule-2 bg-rule-2 mt-[13px] grid gap-px border">
                {CANCELLATION_STAGES.map((stage) => (
                  <div
                    key={stage.stage}
                    className="flex flex-wrap gap-x-[14px] gap-y-[4px] bg-white px-[12px] py-[10px]"
                  >
                    <Kicker
                      as="span"
                      className="text-muted min-w-[150px] flex-[1_1_150px] tracking-[0.09em]"
                    >
                      {stage.stage}
                    </Kicker>
                    <span className="min-w-0 flex-[3_1_260px] text-[12.5px] leading-[1.5]">
                      <strong className="font-bold">{stage.answer}</strong> {stage.note}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-muted mt-[10px] text-[12.5px] leading-[1.5]">
                Your{' '}
                <Link href="/orders" className="text-flag-deep underline">
                  order page
                </Link>{' '}
                names the stage it is at, so you can see which of these applies before you ask.
              </p>
            </Clause>

            <Clause
              number="04"
              title="When it does not fit"
              body={
                <>
                  About half of all car-part returns are the wrong fit, and a part sourced abroad
                  takes weeks to arrive — long enough that sending it back can cost more than it
                  did. We cannot fix that with a generous policy, so we spend the effort earlier
                  instead, on being sure before you pay. What we owe you depends entirely on what we
                  claimed.
                </>
              }
            >
              <div className="mt-[13px] grid gap-[10px]">
                <Note tone="flag">
                  <strong className="font-bold">We said confirmed, and it did not fit.</strong> Then
                  we described it wrongly and it falls under section 01 — replacement or refund, our
                  cost, no different from sending you the wrong part. A confirmed verdict is a
                  statement about your chassis, not an opinion, and we wear it when it is wrong.
                </Note>
                <Note>
                  <strong className="font-bold">We said probable, and printed it that way.</strong>{' '}
                  Then we told you we had not checked it on your chassis and you bought it anyway,
                  which is a decision you were given rather than one made for you. We will take the
                  part back into stock and refund what it sells for, and we tell you that figure
                  before you commit to it rather than after. We would far rather you send us the
                  number off the old part first — that check is free and it takes a day.
                </Note>
                <Note tone="dashed">
                  <strong className="font-bold">
                    Once it is fitted, painted, drilled or cut, it is yours.
                  </strong>{' '}
                  A sprayed bumper cannot go back to a supplier at any price, so that is the one
                  place we genuinely cannot help. Offer it up before it goes anywhere near a
                  workshop.
                </Note>
              </div>
            </Clause>

            <Clause
              number="05"
              title="Counterfeits are never your problem"
              body={
                <>
                  We import, so this risk is ours to carry and not one to push onto a customer who
                  has no way of checking a factory in Guangzhou. If a part turns out to be fake, you
                  get your money back in full whatever else is true — how long you have had it,
                  whether it was cheap, whether you knew the brand was unlikely at that price. We
                  also stop buying from whoever sent it, which matters more to us than the single
                  refund does.
                </>
              }
            />

            <Clause
              number="06"
              title="How the money comes back"
              body={
                <>
                  The same way it arrived. A card payment is reversed to that card, a transfer goes
                  back to the account it came from, and we do not substitute store credit for money
                  at any point. The amount is the Naira figure you paid — it is not recalculated at
                  today&rsquo;s exchange rate, whichever direction that has moved.
                </>
              }
            >
              <Note tone="dashed" className="mt-[12px]">
                Card refunds can take a few working days to appear on a statement after we send
                them. That gap is your bank rather than us, and your order page will already be
                showing the refund by then.
              </Note>
            </Clause>

            <Clause
              number="07"
              title="What we need from you"
              body={
                <>
                  Very little, and none of it is a form. Almost every case is settled from a
                  photograph.
                </>
              }
            >
              <SquareList
                className="mt-[12px]"
                items={[
                  <>
                    <strong className="font-bold">The order reference</strong> and the phone number
                    it was placed with — the same two things that open your order page.
                  </>,
                  <>
                    <strong className="font-bold">A photograph of the part as it arrived</strong>,
                    and of the outer box if anything is crushed. Before it goes to a workshop, if
                    you can.
                  </>,
                  <>
                    <strong className="font-bold">The number off the part itself</strong> where
                    there is one — stamped on a casting or printed on the lamp housing. It settles a
                    fitment argument in one message.
                  </>,
                ]}
              />
              <Note tone="rule" className="mt-[12px]">
                <strong className="font-bold">
                  If you are collecting, open it at the counter.
                </strong>{' '}
                Two minutes there saves a fortnight of messages, and nothing you find at the counter
                is ever an argument — you simply do not take it.
              </Note>
            </Clause>
          </div>

          {/* Starting one. The single most important block on the page, and the
              one we cannot finish: see lib/support.ts. */}
          <Panel weight="heavy" className="mt-[18px]">
            <PanelBar tone="dark" weight="heavy">
              Starting a return
            </PanelBar>
            <div className="px-[15px] py-[15px]">
              {SUPPORT_CHANNEL ? (
                <>
                  <p className="text-ink-soft m-0 max-w-[64ch] text-[13.5px] leading-[1.55]">
                    Message us with the order reference and a photograph. There is no form to fill
                    in and no ticket number to quote back — a person reads it and answers you.
                  </p>
                  <Button
                    variant="dark"
                    size="lg"
                    href={SUPPORT_CHANNEL.href}
                    className="mt-[13px]"
                  >
                    {SUPPORT_CHANNEL.label}
                  </Button>
                </>
              ) : (
                <Note tone="dashed">
                  <strong className="font-bold">
                    We have not published a way to reach us yet.
                  </strong>{' '}
                  On this page of all pages that is the thing most obviously missing, and we would
                  rather say so than print a number that rings nowhere. Everything above is what we
                  will do; the line to tell us on is the next thing to be built, and it will appear
                  here and on every order page at the same time.
                </Note>
              )}
            </div>
          </Panel>

          <p className="text-muted mt-[16px] pb-[26px] text-center text-[12.5px] leading-[1.5]">
            <Link href="/how-we-price" className="underline">
              How we price parts
            </Link>
            {' · '}
            <Link href="/coverage" className="underline">
              Which cars we cover
            </Link>
            {' · '}
            <Link href="/orders" className="underline">
              Track an order
            </Link>
          </p>
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}

/**
 * Where cancellation stops being free, written against the stages the tracking
 * page actually shows so the two screens cannot drift apart. The stage names
 * here are its names.
 */
const CANCELLATION_STAGES: ReadonlyArray<{ stage: string; answer: string; note: string }> = [
  {
    stage: 'Paid',
    answer: 'Cancel freely.',
    note: 'Nothing has been ordered on your behalf yet. Full refund, no reason needed, no fee.',
  },
  {
    stage: 'Supplier is putting it together',
    answer: 'Ask us and usually yes.',
    note: 'It depends whether the supplier has boxed it. We will tell you which it is the same day rather than take the cancellation and hope.',
  },
  {
    stage: 'On a ship · clearing customs',
    answer: 'It cannot be turned around.',
    note: 'A container does not stop mid-ocean and customs will not release a box back out. It has to land and reach you first, and then it is a return rather than a cancellation.',
  },
  {
    stage: 'On the counter for you',
    answer: 'Refuse it there.',
    note: 'You have not taken it and you have not paid for delivery on it. That is a cancellation, and we would rather you did that than took something you had doubts about.',
  },
];

/** A numbered clause. Matches the claim blocks on `/how-we-price` deliberately —
 *  a customer who has read one page should recognise the shape of the other. */
function Clause({
  number,
  title,
  body,
  children,
  tone = 'plain',
}: {
  number: string;
  title: string;
  body: React.ReactNode;
  children?: React.ReactNode;
  tone?: 'plain' | 'loud';
}) {
  const loud = tone === 'loud';

  return (
    <div
      className={
        loud
          ? 'border-ink bg-flag-soft flex flex-wrap gap-[14px] border-2 p-[16px]'
          : 'border-ink bg-panel flex flex-wrap gap-[14px] border-[1.5px] p-[16px]'
      }
    >
      <div
        className={
          loud
            ? 'bg-ink border-ink text-flag flex h-[46px] flex-[0_0_46px] items-center justify-center border-[1.5px] font-mono text-[15px] font-bold leading-none'
            : 'bg-flag border-ink text-flag-ink flex h-[46px] flex-[0_0_46px] items-center justify-center border-[1.5px] font-mono text-[15px] font-bold leading-none'
        }
      >
        {number}
      </div>
      <div className="min-w-0 flex-[1_1_300px]">
        <Title className={loud ? 'text-[18px] leading-[1.2]' : 'text-[17px] leading-[1.2]'}>
          {title}
        </Title>
        <p className="text-ink-soft mt-[8px] text-[13.5px] leading-[1.6]">{body}</p>
        {children}
      </div>
    </div>
  );
}
