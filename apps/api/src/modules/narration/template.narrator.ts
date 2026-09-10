import { Injectable } from '@nestjs/common';
import type { NarrationFacts, NarrationResult, Narrator } from './narration.types';

/**
 * The default narrator: a deterministic template. No model, no network call, no
 * dependency.
 *
 * This is deliberately the shipped implementation. An LLM narrator is a swap of
 * the NARRATOR provider — it receives the same `NarrationFacts` and returns the
 * same string, so nothing downstream can tell the difference, and nothing
 * downstream gains the ability to be lied to.
 */
@Injectable()
export class TemplateNarrator implements Narrator {
  narrate(facts: NarrationFacts): Promise<NarrationResult> {
    const vehicle = [facts.year, facts.makeName, facts.modelName].filter(Boolean).join(' ');
    const zones = formatList(facts.zoneNames);

    const sentences: string[] = [];

    sentences.push(
      facts.matchedFromCatalogue
        ? `These parts are the ones listed for a ${vehicle} with damage to the ${zones}.`
        : `We don't have a full catalogue for the ${vehicle} yet, so this list is based on the ${zones} in general.`,
    );

    if (facts.pricedCount > 0) {
      sentences.push(
        `${facts.pricedCount} of ${facts.items.length} ${plural(facts.items.length, 'part')} ${facts.pricedCount === 1 ? 'has' : 'have'} a price on record. Prices are ranges because the same part sells for different amounts depending on the seller and condition.`,
      );
    }

    if (facts.unpricedCount > 0) {
      sentences.push(
        `We don't yet have a price for ${facts.unpricedCount} ${plural(facts.unpricedCount, 'part')} on this list. ${facts.unpricedCount === 1 ? 'It is' : 'They are'} shown so you know to ask about ${facts.unpricedCount === 1 ? 'it' : 'them'}, not because ${facts.unpricedCount === 1 ? 'it costs' : 'they cost'} nothing.`,
      );
    }

    const lastUpdated = mostRecent(facts);
    if (lastUpdated) {
      sentences.push(`Prices were last checked on ${formatDate(lastUpdated)}.`);
    }

    sentences.push('These are estimates for the parts alone. Labour is not included.');

    return Promise.resolve(sentences.join(' '));
  }
}

function plural(count: number, word: string): string {
  return count === 1 ? word : `${word}s`;
}

function formatList(values: readonly string[]): string {
  const lower = values.map((v) => v.toLowerCase());
  if (lower.length <= 1) return lower[0] ?? 'selected areas';
  return `${lower.slice(0, -1).join(', ')} and ${lower[lower.length - 1]}`;
}

function mostRecent(facts: NarrationFacts): string | null {
  const dates = facts.items
    .map((i) => i.priceRecordedAt)
    .filter((d): d is string => typeof d === 'string');
  if (dates.length === 0) return null;
  return dates.reduce((a, b) => (a > b ? a : b));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
