import 'dotenv/config';
import { createDatabase } from './client.js';
import * as t from './schema/index.js';

/**
 * Development seed.
 *
 * ⚠️  EVERY PART NUMBER AND PRICE BELOW IS FAKE.
 *
 * Part numbers are prefixed `PLACEHOLDER-` and prices are round invented figures
 * so that nothing here can be mistaken for catalogue data if it leaks into a
 * screenshot or a demo. Replace wholesale with the real catalogue — do not
 * "correct" these numbers, delete them.
 */

const ZONES = [
  { code: 'front_bumper', name: 'Front bumper', displayOrder: 1, isInternal: false },
  { code: 'hood', name: 'Hood', displayOrder: 2, isInternal: false },
  { code: 'headlights', name: 'Headlights', displayOrder: 3, isInternal: false },
  { code: 'fenders', name: 'Fenders', displayOrder: 4, isInternal: false },
  {
    code: 'radiator',
    name: 'Radiator',
    displayOrder: 5,
    isInternal: true,
    description: 'Behind the grille — no exterior panel to tap.',
  },
  { code: 'rear_bumper', name: 'Rear bumper', displayOrder: 6, isInternal: false },
  { code: 'rear', name: 'Rear', displayOrder: 7, isInternal: false },
];

const CATEGORIES = [
  { code: 'body_panel', name: 'Body panels' },
  { code: 'bumper', name: 'Bumpers' },
  { code: 'lighting', name: 'Lighting' },
  { code: 'cooling', name: 'Cooling' },
  { code: 'grille', name: 'Grilles' },
];

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set.');

  const db = createDatabase({ url, maxConnections: 1 });
  console.warn('Seeding placeholder data…');

  const zones = await db.insert(t.damageZones).values(ZONES).returning();
  const zoneByCode = new Map(zones.map((z) => [z.code, z]));

  const categories = await db.insert(t.partCategories).values(CATEGORIES).returning();
  const categoryByCode = new Map(categories.map((c) => [c.code, c]));

  const [toyota, honda] = await db
    .insert(t.makes)
    .values([
      { name: 'Toyota', slug: 'toyota', countryCode: 'JP' },
      { name: 'Honda', slug: 'honda', countryCode: 'JP' },
    ])
    .returning();
  if (!toyota || !honda) throw new Error('Make seed failed.');

  const [camry, corolla, accord] = await db
    .insert(t.vehicleModels)
    .values([
      { makeId: toyota.id, name: 'Camry', slug: 'camry' },
      { makeId: toyota.id, name: 'Corolla', slug: 'corolla' },
      { makeId: honda.id, name: 'Accord', slug: 'accord' },
    ])
    .returning();
  if (!camry || !corolla || !accord) throw new Error('Model seed failed.');

  // Trim and engine left NULL: these variants cover every trim of the generation,
  // which is what a user who does not know their trim will resolve to.
  const [camryXv50, corollaE170, accordCr] = await db
    .insert(t.vehicleVariants)
    .values([
      {
        modelId: camry.id,
        label: 'XV50',
        yearStart: 2012,
        yearEnd: 2017,
        bodyStyle: 'Sedan',
      },
      {
        modelId: corolla.id,
        label: 'E170',
        yearStart: 2014,
        yearEnd: 2019,
        bodyStyle: 'Sedan',
      },
      {
        modelId: accord.id,
        label: 'CR (9th gen)',
        yearStart: 2013,
        yearEnd: 2017,
        bodyStyle: 'Sedan',
      },
    ])
    .returning();
  if (!camryXv50 || !corollaE170 || !accordCr) throw new Error('Variant seed failed.');

  const [genuine, aftermarket] = await db
    .insert(t.manufacturers)
    .values([
      { name: 'OEM (placeholder)', slug: 'oem-placeholder', isOem: true },
      { name: 'Aftermarket (placeholder)', slug: 'aftermarket-placeholder', isOem: false },
    ])
    .returning();
  if (!genuine || !aftermarket) throw new Error('Manufacturer seed failed.');

  type PartSeed = {
    name: string;
    slug: string;
    category: string;
    zone: string;
    position: (typeof t.partPosition.enumValues)[number];
    mpn: string;
    priceMin: string;
    priceMax: string;
  };

  const partSeeds: PartSeed[] = [
    {
      name: 'Front bumper cover',
      slug: 'front-bumper-cover-camry-xv50',
      category: 'bumper',
      zone: 'front_bumper',
      position: 'front',
      mpn: 'PLACEHOLDER-BUM-0001',
      priceMin: '85000.00',
      priceMax: '120000.00',
    },
    {
      name: 'Front grille',
      slug: 'front-grille-camry-xv50',
      category: 'grille',
      zone: 'front_bumper',
      position: 'front',
      mpn: 'PLACEHOLDER-GRL-0002',
      priceMin: '32000.00',
      priceMax: '48000.00',
    },
    {
      name: 'Hood panel',
      slug: 'hood-panel-camry-xv50',
      category: 'body_panel',
      zone: 'hood',
      position: 'front',
      mpn: 'PLACEHOLDER-HOD-0003',
      priceMin: '140000.00',
      priceMax: '195000.00',
    },
    {
      name: 'Headlight assembly, left',
      slug: 'headlight-left-camry-xv50',
      category: 'lighting',
      zone: 'headlights',
      position: 'left',
      mpn: 'PLACEHOLDER-HLL-0004',
      priceMin: '95000.00',
      priceMax: '145000.00',
    },
    {
      name: 'Headlight assembly, right',
      slug: 'headlight-right-camry-xv50',
      category: 'lighting',
      zone: 'headlights',
      position: 'right',
      mpn: 'PLACEHOLDER-HLR-0005',
      priceMin: '95000.00',
      priceMax: '145000.00',
    },
    {
      name: 'Front fender, left',
      slug: 'fender-left-camry-xv50',
      category: 'body_panel',
      zone: 'fenders',
      position: 'left',
      mpn: 'PLACEHOLDER-FND-0006',
      priceMin: '55000.00',
      priceMax: '78000.00',
    },
    {
      name: 'Radiator assembly',
      slug: 'radiator-camry-xv50',
      category: 'cooling',
      zone: 'radiator',
      position: 'front',
      mpn: 'PLACEHOLDER-RAD-0007',
      priceMin: '68000.00',
      priceMax: '92000.00',
    },
    {
      name: 'Rear bumper cover',
      slug: 'rear-bumper-cover-camry-xv50',
      category: 'bumper',
      zone: 'rear_bumper',
      position: 'rear',
      mpn: 'PLACEHOLDER-BUM-0008',
      priceMin: '80000.00',
      priceMax: '115000.00',
    },
  ];

  const inserted = await db
    .insert(t.parts)
    .values(
      partSeeds.map((p) => ({
        name: p.name,
        slug: p.slug,
        categoryId: categoryByCode.get(p.category)?.id ?? null,
        manufacturerId: aftermarket.id,
        mpn: p.mpn,
        position: p.position,
        description: 'Placeholder seed part — not catalogue data.',
      })),
    )
    .returning();

  await db.insert(t.partZones).values(
    inserted.map((part, i) => {
      const zoneCode = partSeeds[i]!.zone;
      const zone = zoneByCode.get(zoneCode);
      if (!zone) throw new Error(`Unknown zone ${zoneCode}`);
      return { partId: part.id, zoneId: zone.id, quantity: 1 };
    }),
  );

  // Every seeded part fits the Camry generation; two also fit the Corolla, so the
  // many-to-many has something real to exercise.
  await db
    .insert(t.partFitments)
    .values([
      ...inserted.map((part) => ({ partId: part.id, variantId: camryXv50.id })),
      { partId: inserted[6]!.id, variantId: corollaE170.id, qualifier: 'Shared cooling pack' },
      { partId: inserted[1]!.id, variantId: accordCr.id, qualifier: 'Placeholder cross-fitment' },
    ]);

  await db.insert(t.partPrices).values(
    inserted.map((part, i) => ({
      partId: part.id,
      condition: 'new_aftermarket' as const,
      amountMin: partSeeds[i]!.priceMin,
      amountMax: partSeeds[i]!.priceMax,
      currency: 'NGN',
      source: 'manual_entry' as const,
      sourceNote: 'Placeholder seed price — invented figure, not a market observation.',
    })),
  );

  await db.insert(t.waitlistEntries).values([
    { email: 'seed-facelift@example.com', source: 'facelift_hub' },
    { email: 'seed-accessories@example.com', source: 'accessories_store' },
  ]);

  console.warn(
    `Seeded ${zones.length} zones, 3 vehicle variants, ${inserted.length} placeholder parts.`,
  );
}

seed()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
