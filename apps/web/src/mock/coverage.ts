/**
 * Catalogue coverage by make.
 *
 * "Covered" is a claim with a definition behind it — part numbers matched to the
 * chassis code, and at least three verified Nigerian prices per part. Anything
 * short of that is said plainly rather than rounded up, which is the whole point
 * of showing this page before a user spends four taps reaching a dead end.
 */

export type CoverageStatus = 'full' | 'partial' | 'none';

export interface CoverageModel {
  name: string;
  years: string;
  parts: string;
}

export interface MakeCoverage {
  status: CoverageStatus;
  models: readonly CoverageModel[];
}

function model(name: string, years: string, parts: string): CoverageModel {
  return { name, years, parts };
}

export const COVERAGE: Readonly<Record<string, MakeCoverage>> = {
  Toyota: {
    status: 'full',
    models: [
      model('Corolla', '2003–2023', '412'),
      model('Camry', '2007–2021', '388'),
      model('RAV4', '2013–2022', '301'),
      model('Hilux', '2008–2023', '356'),
      model('Highlander', '2008–2019', '274'),
    ],
  },
  Honda: {
    status: 'full',
    models: [
      model('Accord', '2008–2022', '341'),
      model('Civic', '2006–2021', '298'),
      model('CR-V', '2012–2022', '263'),
      model('Pilot', '2009–2018', '187'),
    ],
  },
  Nissan: {
    status: 'full',
    models: [
      model('Almera', '2012–2022', '204'),
      model('Altima', '2007–2020', '286'),
      model('X-Trail', '2008–2021', '231'),
    ],
  },
  Lexus: {
    status: 'full',
    models: [
      model('ES 350', '2007–2018', '247'),
      model('RX 350', '2010–2019', '263'),
      model('GX 460', '2010–2019', '152'),
    ],
  },
  'Mercedes-Benz': {
    status: 'partial',
    models: [
      model('C-Class', '2008–2018', '238'),
      model('E-Class', '2010–2019', '196'),
      model('GLK', '2009–2015', '104'),
    ],
  },
  Hyundai: {
    status: 'partial',
    models: [
      model('Elantra', '2011–2020', '178'),
      model('Sonata', '2010–2019', '192'),
      model('Tucson', '2010–2021', '141'),
    ],
  },
  Kia: {
    status: 'partial',
    models: [model('Rio', '2012–2021', '134'), model('Sportage', '2011–2021', '158')],
  },
  Peugeot: { status: 'none', models: [] },
  Innoson: { status: 'none', models: [] },
};

/** Full first, then partial, then the gaps — nobody has to hunt for good news. */
export const COVERAGE_ORDER: readonly string[] = [
  'Toyota',
  'Honda',
  'Nissan',
  'Lexus',
  'Mercedes-Benz',
  'Hyundai',
  'Kia',
  'Peugeot',
  'Innoson',
];

export const STATUS_BADGE: Record<CoverageStatus, string> = {
  full: 'FULL',
  partial: 'PARTIAL',
  none: 'NONE',
};

export const STATUS_LABEL: Record<CoverageStatus, string> = {
  full: 'COVERED',
  partial: 'PARTIAL COVER',
  none: 'NOT YET COVERED',
};

export const STATUS_BODY: Record<CoverageStatus, string> = {
  full: 'Priced properly. Part numbers are matched to the chassis code and every panel we estimate has at least three verified Nigerian prices.',
  partial:
    "We have the part numbers, but not a verified price for every panel yet. You'll get an estimate that says plainly which parts are missing.",
  none: "Not in the catalogue yet. We won't show you numbers we can't stand behind, so an estimate would come back empty.",
};

export const CATALOGUE_STATS = {
  modelsPriced: '41',
  partNumbers: '6,180',
  addedLastMonth: '+9',
  refreshed: 'WEEKLY',
  lastRefresh: '04 SEP 2026',
} as const;
