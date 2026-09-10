/**
 * ============================================================================
 *  THE AI BOUNDARY
 * ============================================================================
 *
 *  A model may NEVER produce a part number, a price, a part name, or a fitment
 *  claim. Those come from our database or they do not appear.
 *
 *  The only thing a model is allowed to produce is the prose paragraph that sits
 *  under the results table explaining how the parts were matched and why they
 *  cost what they do.
 *
 *  That rule is enforced by these types rather than by discipline:
 *
 *   - `NarrationFacts` is the ONLY input a narrator can receive. It is built from
 *     rows already retrieved from Postgres. There is no free-text field on it, no
 *     vehicle the user typed, no "extra context" escape hatch.
 *   - `NarrationResult` is a single string. It is rendered as prose and is never
 *     parsed, never used to populate a table cell, and never persisted as data.
 *
 *  If you find yourself widening `NarrationFacts` to let a model see something it
 *  could repeat as fact, stop: that is the boundary moving, and it is the one
 *  thing in this codebase that must not move quietly.
 * ============================================================================
 */

/** One already-priced row, exactly as it will be rendered in the table. */
export interface NarrationFactItem {
  readonly partName: string;
  readonly zoneName: string;
  readonly isPriced: boolean;
  /** Decimal strings straight from Postgres numeric. Never floats. */
  readonly priceMin: string | null;
  readonly priceMax: string | null;
  readonly priceRecordedAt: string | null;
}

export interface NarrationFacts {
  readonly makeName: string;
  readonly modelName: string;
  readonly year: number | null;
  /** Whether the vehicle was matched in our catalogue or only described. */
  readonly matchedFromCatalogue: boolean;
  readonly zoneNames: readonly string[];
  readonly items: readonly NarrationFactItem[];
  readonly pricedCount: number;
  readonly unpricedCount: number;
  readonly subtotalMin: string | null;
  readonly subtotalMax: string | null;
  readonly currency: 'NGN';
}

/** Prose only. Display as text; do not parse. */
export type NarrationResult = string;

export interface Narrator {
  narrate(facts: NarrationFacts): Promise<NarrationResult>;
}

export const NARRATOR = Symbol('NARRATOR');
