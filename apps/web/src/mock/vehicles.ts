import type { ResolvedVehicle } from '@mims/contracts';

/**
 * The manual cascade's mock rows: make → model → year range → trim, each
 * selection narrowing the next. Lifted from the design canvas (B1Vehicle), so
 * the makes are the ones a Nigerian owner actually picks from — Innoson and
 * Peugeot included, both deliberately uncovered so the coverage-gap path can be
 * demonstrated without contriving it.
 */

export const MAKES: readonly string[] = [
  'Toyota',
  'Honda',
  'Nissan',
  'Mercedes-Benz',
  'Hyundai',
  'Kia',
  'Lexus',
  'Peugeot',
  'Innoson',
];

export const MODELS: Readonly<Record<string, readonly string[]>> = {
  Toyota: ['Corolla', 'Camry', 'RAV4', 'Hilux', 'Highlander', 'Sienna', 'Venza'],
  Honda: ['Accord', 'Civic', 'CR-V', 'Pilot', 'Odyssey'],
  Nissan: ['Almera', 'Altima', 'X-Trail', 'Pathfinder', 'Micra'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'GLK', 'ML', 'GLE'],
  Hyundai: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Accent'],
  Kia: ['Rio', 'Cerato', 'Sportage', 'Sorento', 'Picanto'],
  Lexus: ['ES 350', 'RX 350', 'GX 460', 'IS 250'],
  Peugeot: ['301', '308', '3008', '508'],
  Innoson: ['IVM G5', 'IVM Fox', 'IVM Carrier'],
};

/** Generations, not single years — one range is one set of part numbers. */
export const YEAR_RANGES: readonly string[] = ['2019–2023', '2014–2018', '2008–2013', '2003–2007'];

export const TRIMS: readonly string[] = ['LE', 'XLE', 'SE', 'S', 'L'];

/** Makes we hold no priced catalogue for. Drives the "not in catalogue" state. */
const UNCOVERED_MAKES = new Set(['Peugeot', 'Innoson']);

export function isCovered(make: string | null): boolean {
  return make !== null && !UNCOVERED_MAKES.has(make);
}

/**
 * Extra facts the confirmation band shows that `ResolvedVehicle` has no field
 * for yet. Chassis code is the important one — parts are matched to it rather
 * than to the model name, which is the whole reason a 2018 and a 2019 that look
 * identical get different part numbers.
 */
export interface VehicleDetail extends ResolvedVehicle {
  chassisCode: string | null;
  bodyStyle: string | null;
  partsOnFile: number | null;
}

/** The vehicle a successful VIN decode returns, and the demo's default car. */
export const DEMO_VEHICLE: VehicleDetail = {
  variantId: '00000000-0000-4000-8000-000000000021',
  make: 'Toyota',
  model: 'Corolla',
  year: 2018,
  trim: 'LE',
  engine: '1.8L 2ZR-FE petrol',
  inCatalogue: true,
  chassisCode: 'ZRE172',
  bodyStyle: '4-door sedan',
  partsOnFile: 148,
};

/** The uncatalogued car, used by the coverage-gap state. */
export const UNCOVERED_VEHICLE: VehicleDetail = {
  variantId: null,
  make: 'Peugeot',
  model: '508',
  year: 2011,
  trim: 'Allure',
  engine: null,
  inCatalogue: false,
  chassisCode: null,
  bodyStyle: null,
  partsOnFile: null,
};

export const DEMO_VIN = 'JTDBR32E030123456';

/** "2018 Toyota Corolla LE" — the one line that must be right before continuing. */
export function vehicleTitle(vehicle: Pick<VehicleDetail, 'year' | 'make' | 'model' | 'trim'>) {
  return [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ');
}

/** "2018 TOYOTA COROLLA LE · ZRE172" — the header band's context line. */
export function vehicleStamp(vehicle: VehicleDetail): string {
  const title = vehicleTitle(vehicle).toUpperCase();
  return vehicle.chassisCode ? `${title} · ${vehicle.chassisCode}` : title;
}

/**
 * Builds a vehicle from a completed manual cascade. A year range resolves to its
 * newest year, which is what the confirmation band shows and what the user
 * corrects if it is wrong.
 */
export function vehicleFromCascade(
  make: string,
  model: string,
  yearRange: string,
  trim: string,
): VehicleDetail {
  const newest = Number(yearRange.split('–')[1] ?? yearRange);
  const covered = isCovered(make);

  // Only the demo car has catalogue detail behind it. Everything else resolves
  // honestly to "we know what you drive, we may not have priced it".
  const isDemoCar = make === 'Toyota' && model === 'Corolla';

  return {
    variantId: covered ? DEMO_VEHICLE.variantId : null,
    make,
    model,
    year: Number.isFinite(newest) ? newest : null,
    trim,
    engine: isDemoCar ? DEMO_VEHICLE.engine : null,
    inCatalogue: covered,
    chassisCode: isDemoCar ? DEMO_VEHICLE.chassisCode : null,
    bodyStyle: isDemoCar ? DEMO_VEHICLE.bodyStyle : null,
    partsOnFile: isDemoCar ? DEMO_VEHICLE.partsOnFile : null,
  };
}
