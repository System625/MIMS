import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env';

/** The subset of vPIC's flat response we consume. Every field can be absent or ''. */
interface VpicResult {
  Make?: string;
  Model?: string;
  ModelYear?: string;
  Trim?: string;
  Series?: string;
  DisplacementL?: string;
  EngineCylinders?: string;
  EngineConfiguration?: string;
  ErrorCode?: string;
  ErrorText?: string;
}

export interface VpicDecoded {
  make: string | null;
  model: string | null;
  year: number | null;
  trim: string | null;
  engine: string | null;
  raw: Record<string, unknown>;
}

export type VpicOutcome =
  | { kind: 'decoded'; value: VpicDecoded }
  | { kind: 'not_found'; raw: Record<string, unknown> | null }
  | { kind: 'upstream_unavailable'; reason: string };

/**
 * Thin client over NHTSA vPIC. Free, keyless, and covers the US/Canadian imports
 * that make up most of this market.
 *
 * It never throws. Every failure mode — timeout, 500, a VIN vPIC has never seen —
 * comes back as an outcome the caller routes to the manual path. A VIN lookup
 * failing is an ordinary Tuesday, not an exception.
 */
@Injectable()
export class VpicClient {
  private readonly logger = new Logger(VpicClient.name);

  constructor(private readonly config: ConfigService<Env, true>) {}

  async decode(vin: string): Promise<VpicOutcome> {
    const base = this.config.get('VPIC_BASE_URL', { infer: true });
    const timeout = this.config.get('VPIC_TIMEOUT_MS', { infer: true });
    const url = `${base}/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`;

    let payload: { Results?: VpicResult[] };
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(timeout) });
      if (!response.ok) {
        return { kind: 'upstream_unavailable', reason: `vPIC returned ${response.status}` };
      }
      payload = (await response.json()) as { Results?: VpicResult[] };
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : 'unknown network error';
      this.logger.warn(`vPIC decode failed for ${vin}: ${reason}`);
      return { kind: 'upstream_unavailable', reason };
    }

    const result = payload.Results?.[0];
    if (!result) return { kind: 'not_found', raw: null };

    const make = blankToNull(result.Make);
    const model = blankToNull(result.Model);

    // vPIC answers 200 with empty fields for a VIN it cannot place. Make and model
    // are the minimum for a usable identification; anything less is a miss.
    if (!make || !model) {
      return { kind: 'not_found', raw: result as unknown as Record<string, unknown> };
    }

    return {
      kind: 'decoded',
      value: {
        make,
        model,
        year: toYear(result.ModelYear),
        trim: blankToNull(result.Trim) ?? blankToNull(result.Series),
        engine: formatEngine(result),
        raw: result as unknown as Record<string, unknown>,
      },
    };
  }
}

function blankToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toYear(value: string | undefined): number | null {
  const year = Number.parseInt(value ?? '', 10);
  return Number.isInteger(year) && year > 1950 && year < 2100 ? year : null;
}

/** "2.5L 4-cyl" from whichever of the three engine fields vPIC actually filled in. */
function formatEngine(result: VpicResult): string | null {
  const litres = blankToNull(result.DisplacementL);
  const cylinders = blankToNull(result.EngineCylinders);
  const parts: string[] = [];
  if (litres) parts.push(`${Number.parseFloat(litres).toFixed(1)}L`);
  if (cylinders) parts.push(`${cylinders}-cyl`);
  return parts.length > 0 ? parts.join(' ') : null;
}
