/**
 * THE RETURNS POSITION, IN ONE PLACE.
 *
 * Why a module rather than copy on a page: this promise is made on four screens
 * — the product page, the basket, the checkout and the order tracker — and a
 * returns promise that is worded differently in four places is read as four
 * different promises, which is precisely the suspicion this store exists to
 * answer. One source, imported everywhere, and `/returns` is the long form of
 * the same thing.
 *
 * WHAT THE LAW ACTUALLY REQUIRES, since the temptation to soften it is constant.
 * "No return, no refund" is contrary to the Federal Competition and Consumer
 * Protection Act 2018 and the FCCPC has said so publicly. Goods that are
 * defective, counterfeit or not as described entitle the buyer to a replacement
 * or a refund no matter what any policy claims, and a shop cannot contract out
 * of that. So this file separates OUR error from the customer's, states the
 * first as unconditional, and is careful that the window below reads as a
 * service promise about speed rather than as a cut-off on a statutory right —
 * a policy that extinguishes the right on day eight is the same unlawful thing
 * in politer language.
 *
 * NO SECTION NUMBERS. The Act is cited by name here and on the page, and never
 * by section, because a wrong citation on a legal page is worse than no
 * citation — and §10 of bella.md forbids generating a fact we do not hold.
 * If somebody wants the section, they should read it off the Act.
 */

/** Where the long form lives. Imported so no screen hard-codes the path. */
export const RETURNS_HREF = '/returns';

/**
 * How quickly we ask to hear about a problem, counted from the day the part is
 * delivered or collected.
 *
 * This is a POLICY CHOICE, not a derived fact — a founder can change the number
 * here and it moves everywhere. Seven days is what the operation can act on: a
 * supplier claim against a Chinese factory and a freight-damage claim both get
 * harder the longer the box sits, so the window is about our ability to recover
 * the cost, not about the customer's rights. Which is exactly how the page
 * words it.
 */
export const RETURN_REPORT_DAYS = 7;

/**
 * What counts as ours. Deliberately written as things a customer can check
 * against the box in front of them rather than as legal categories they would
 * have to interpret.
 */
export const OUR_ERROR_GROUNDS: readonly string[] = [
  'It arrived broken, cracked or damaged in transit.',
  'It is counterfeit, or the brand is not the one we sold you.',
  'It is not the part on the order — wrong number, wrong side, wrong variant.',
  'It does not match what we described: a different connector, finish, or fitting.',
  'We told you the fit was confirmed and it does not fit.',
];

/**
 * The short promise. One sentence of unconditional, one of the boundary, so
 * nobody reads the first without the second — and nobody has to click through
 * to a policy page to find out which side of the line they are on.
 */
export const RETURNS_SUMMARY =
  'Defective, counterfeit, damaged in transit, or not what we described — that is our mistake ' +
  'and our cost, and no policy of ours overrides your right to a replacement or a refund. ' +
  'What we cannot absorb is a part that was described correctly and ordered against the wrong ' +
  'car, which is why the fitment verdict sits above the price rather than below it.';
