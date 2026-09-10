import { Injectable } from '@nestjs/common';
import type { ResolvedVehicle, VinDecodeResult } from '@mims/contracts';
import { VpicClient } from './vpic.client';

/**
 * VIN decode, normalised to our vehicle shape.
 *
 * Stubbed: the catalogue match and the `vin_lookups` cache write are marked TODO.
 * The shape of the result is final — a decode always resolves to a
 * `VinDecodeResult` with an outcome, never to a thrown error, because the manual
 * cascade is a sibling route and the UI needs to move the user there calmly.
 */
@Injectable()
export class VinService {
  constructor(private readonly vpic: VpicClient) {}

  async decode(vin: string): Promise<VinDecodeResult> {
    // TODO: read-through cache on vin_lookups before calling out.
    const outcome = await this.vpic.decode(vin);

    if (outcome.kind === 'upstream_unavailable') {
      // TODO: persist a vin_lookups row with status 'upstream_error'.
      return {
        outcome: 'upstream_unavailable',
        vin,
        vehicle: null,
        message: "We couldn't reach the VIN service just now. Pick your car manually instead.",
      };
    }

    if (outcome.kind === 'not_found') {
      // TODO: persist status 'not_found' — these rows are the coverage backlog.
      return {
        outcome: 'not_found',
        vin,
        vehicle: null,
        message: "We couldn't identify that VIN. Pick your car manually instead.",
      };
    }

    const { value } = outcome;
    // TODO: match make/model/year against vehicle_variants and set inCatalogue.
    const vehicle: ResolvedVehicle = {
      variantId: null,
      make: value.make ?? '',
      model: value.model ?? '',
      year: value.year,
      trim: value.trim,
      engine: value.engine,
      inCatalogue: false,
    };

    return {
      outcome: 'decoded',
      vin,
      vehicle,
      message: 'Check this is your car before continuing.',
    };
  }
}
