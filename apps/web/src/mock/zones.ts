import type { DamageZone } from '@mims/contracts';

/**
 * The nine damage zones the interface actually offers.
 *
 * The scaffold's API stubs seven; the design splits headlights and fenders into
 * left and right, and separates the rear bumper from the rear panel, because a
 * user who has been rear-ended can point at one without claiming the other.
 * Nine is the product. When the API is wired, `damage_zones` should be seeded
 * from this list.
 */
export interface ZoneView extends DamageZone {
  /** Two-digit stamp. Ties a diagram cell to its row in the parts table. */
  ordinal: string;
  /** Short form for the diagram cell, where a full name will not fit. */
  diagramLabel: string;
}

function zoneId(n: number): string {
  return `00000000-0000-4000-8000-0000000001${String(n).padStart(2, '0')}`;
}

export const ZONES: readonly ZoneView[] = [
  {
    id: zoneId(1),
    code: 'front_bumper',
    ordinal: '01',
    name: 'Front bumper',
    diagramLabel: 'Front bumper',
    description: 'Cover, grille and brackets',
    isInternal: false,
    displayOrder: 1,
  },
  {
    id: zoneId(2),
    code: 'hood',
    ordinal: '02',
    name: 'Hood / bonnet',
    diagramLabel: 'Hood',
    description: 'Panel, hinges, catch',
    isInternal: false,
    displayOrder: 2,
  },
  {
    id: zoneId(3),
    code: 'headlight_left',
    ordinal: '03',
    name: 'Headlight — left',
    diagramLabel: 'Headlight left',
    description: 'Driver side',
    isInternal: false,
    displayOrder: 3,
  },
  {
    id: zoneId(4),
    code: 'headlight_right',
    ordinal: '04',
    name: 'Headlight — right',
    diagramLabel: 'Headlight right',
    description: 'Passenger side',
    isInternal: false,
    displayOrder: 4,
  },
  {
    id: zoneId(5),
    code: 'radiator',
    ordinal: '05',
    name: 'Radiator',
    diagramLabel: 'Radiator · internal',
    // The one zone with no exterior surface to tap. The diagram draws it dashed
    // and says so rather than pretending it is a panel.
    description: 'Behind the bumper — tick if leaking or overheating',
    isInternal: true,
    displayOrder: 5,
  },
  {
    id: zoneId(6),
    code: 'fender_left',
    ordinal: '06',
    name: 'Fender — left',
    diagramLabel: 'Fender left',
    description: 'Panel above the front wheel',
    isInternal: false,
    displayOrder: 6,
  },
  {
    id: zoneId(7),
    code: 'fender_right',
    ordinal: '07',
    name: 'Fender — right',
    diagramLabel: 'Fender right',
    description: 'Panel above the front wheel',
    isInternal: false,
    displayOrder: 7,
  },
  {
    id: zoneId(8),
    code: 'rear_bumper',
    ordinal: '08',
    name: 'Rear bumper',
    diagramLabel: 'Rear bumper',
    description: 'Cover and brackets',
    isInternal: false,
    displayOrder: 8,
  },
  {
    id: zoneId(9),
    code: 'rear_panel',
    ordinal: '09',
    name: 'Rear panel / boot lid',
    diagramLabel: 'Rear panel / boot',
    description: 'Boot lid, tail panel, lamps',
    isInternal: false,
    displayOrder: 9,
  },
];

const BY_CODE = new Map(ZONES.map((zone) => [zone.code, zone]));

export function zoneByCode(code: string): ZoneView | undefined {
  return BY_CODE.get(code);
}

export function zoneName(code: string): string {
  return BY_CODE.get(code)?.name ?? code;
}

/** Selection order is never display order — always sort before rendering. */
export function sortZoneCodes(codes: readonly string[]): string[] {
  return [...codes].sort(
    (a, b) => (zoneByCode(a)?.displayOrder ?? 99) - (zoneByCode(b)?.displayOrder ?? 99),
  );
}
