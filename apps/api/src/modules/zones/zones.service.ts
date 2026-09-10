import { Injectable } from '@nestjs/common';
import type { DamageZone } from '@mims/contracts';

@Injectable()
export class ZonesService {
  /** TODO: select from damage_zones order by display_order. */
  list(): Promise<DamageZone[]> {
    return Promise.resolve(MOCK_ZONES);
  }
}

const MOCK_ZONES: DamageZone[] = [
  {
    id: zoneId(1),
    code: 'front_bumper',
    name: 'Front bumper',
    description: null,
    isInternal: false,
    displayOrder: 1,
  },
  {
    id: zoneId(2),
    code: 'hood',
    name: 'Hood',
    description: null,
    isInternal: false,
    displayOrder: 2,
  },
  {
    id: zoneId(3),
    code: 'headlights',
    name: 'Headlights',
    description: null,
    isInternal: false,
    displayOrder: 3,
  },
  {
    id: zoneId(4),
    code: 'fenders',
    name: 'Fenders',
    description: null,
    isInternal: false,
    displayOrder: 4,
  },
  {
    id: zoneId(5),
    code: 'radiator',
    name: 'Radiator',
    description: 'Behind the grille — no exterior panel to tap.',
    isInternal: true,
    displayOrder: 5,
  },
  {
    id: zoneId(6),
    code: 'rear_bumper',
    name: 'Rear bumper',
    description: null,
    isInternal: false,
    displayOrder: 6,
  },
  {
    id: zoneId(7),
    code: 'rear',
    name: 'Rear',
    description: null,
    isInternal: false,
    displayOrder: 7,
  },
];

function zoneId(n: number): string {
  return `00000000-0000-4000-8000-0000000001${String(n).padStart(2, '0')}`;
}
