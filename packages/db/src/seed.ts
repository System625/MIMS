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
        // The one chassis code in this file that is not invented: the design
        // canvas states it for the 2018 Corolla LE. Camry and Accord are left
        // NULL rather than filled in with something plausible.
        chassisCode: 'ZRE172',
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

  // Every seeded part fits the Camry generation; two also fit other models, so the
  // many-to-many has something real to exercise. The cross-fitments are graded
  // `probable` on purpose: "should fit, not confirmed on your chassis" is a state
  // the product screen has to render, and it needs data to render it from.
  await db.insert(t.partFitments).values([
    ...inserted.map((part) => ({
      partId: part.id,
      variantId: camryXv50.id,
      confidence: 'confirmed' as const,
      evidence: 'Placeholder seed fitment — not a verified claim.',
    })),
    {
      partId: inserted[6]!.id,
      variantId: corollaE170.id,
      qualifier: 'Shared cooling pack',
      confidence: 'probable' as const,
      evidence: 'Placeholder seed fitment — cross-reference not physically confirmed.',
    },
    {
      partId: inserted[1]!.id,
      variantId: accordCr.id,
      qualifier: 'Placeholder cross-fitment',
      confidence: 'probable' as const,
      evidence: 'Placeholder seed fitment — cross-reference not physically confirmed.',
    },
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

  /* ------------------------------------------------------- marketplace -- */

  // Suppliers are admin rows, not users — there is no seller portal, and these
  // two exist only so a listing has something to hang off. One holds stock in
  // Lagos and ships in days; one is sourced from China and lands in weeks.
  const [lagosStock, chinaSourced] = await db
    .insert(t.suppliers)
    .values([
      {
        name: 'Placeholder Lagos supplier',
        slug: 'placeholder-lagos-supplier',
        countryCode: 'NG',
        city: 'Lagos',
        defaultLeadTimeMinDays: 2,
        defaultLeadTimeMaxDays: 5,
        notes: 'Placeholder seed supplier — not a real trading relationship.',
      },
      {
        name: 'Placeholder sourcing agent',
        slug: 'placeholder-sourcing-agent',
        countryCode: 'CN',
        defaultLeadTimeMinDays: 21,
        defaultLeadTimeMaxDays: 45,
        notes: 'Placeholder seed supplier — not a real trading relationship.',
      },
    ])
    .returning();
  if (!lagosStock || !chinaSourced) throw new Error('Supplier seed failed.');

  // One held-stock listing per part, plus two tokunbo pre-orders so condition is
  // exercised as the axis it is: genuine and tokunbo are different goods at
  // different prices, not a discount on each other.
  //
  // Retail figures are the invented `priceMax` from the table above. They are
  // duty-inclusive by policy, which here means nothing, because they are fake.
  const listingRows = [
    ...inserted.map((part, i) => ({
      partId: part.id,
      supplierId: lagosStock.id,
      sku: `PLACEHOLDER-SKU-${String(i + 1).padStart(4, '0')}`,
      condition: 'new_aftermarket' as const,
      stockModel: 'held_stock' as const,
      status: 'active' as const,
      retailPrice: partSeeds[i]!.priceMax,
      quantityAvailable: 3,
      leadTimeMinDays: 2,
      leadTimeMaxDays: 5,
      description: 'Placeholder seed listing — not a real offer.',
    })),
    ...[0, 3].map((i) => ({
      partId: inserted[i]!.id,
      supplierId: chinaSourced.id,
      sku: `PLACEHOLDER-SKU-TK-${String(i + 1).padStart(4, '0')}`,
      title: `${partSeeds[i]!.name}, tokunbo (placeholder)`,
      condition: 'used_tokunbo' as const,
      stockModel: 'pre_order' as const,
      status: 'active' as const,
      retailPrice: partSeeds[i]!.priceMin,
      quantityAvailable: 0,
      leadTimeMinDays: 21,
      leadTimeMaxDays: 45,
      description: 'Placeholder seed listing — not a real offer.',
      fitmentNote: 'Pulled part. Condition graded on arrival before dispatch.',
    })),
  ];

  const listings = await db.insert(t.listings).values(listingRows).returning();

  // Every price is an entry in the ledger, including the first one.
  await db.insert(t.listingPriceChanges).values(
    listings.map((listing) => ({
      listingId: listing.id,
      previousPrice: null,
      newPrice: listing.retailPrice,
      reason: 'Initial placeholder seed price.',
      changedBy: 'seed',
    })),
  );

  // Collection points. Addresses are deliberately not plausible: an invented
  // street that resolves to a real place is worse than an obvious placeholder.
  await db.insert(t.pickupPoints).values([
    {
      code: 'PLACEHOLDER-LAG-01',
      name: 'Placeholder counter, Lagos',
      line1: 'PLACEHOLDER — no real address',
      city: 'Lagos',
      state: 'Lagos',
      openingHours: 'Mon–Sat 9am–6pm',
      displayOrder: 1,
      notes: 'Placeholder seed pickup point.',
    },
    {
      code: 'PLACEHOLDER-ABJ-01',
      name: 'Placeholder counter, Abuja',
      line1: 'PLACEHOLDER — no real address',
      city: 'Abuja',
      state: 'FCT — Abuja',
      openingHours: 'Mon–Fri 9am–5pm',
      displayOrder: 2,
      notes: 'Placeholder seed pickup point.',
    },
  ]);

  await db.insert(t.waitlistEntries).values([
    { email: 'seed-facelift@example.com', source: 'facelift_hub' },
    { email: 'seed-accessories@example.com', source: 'accessories_store' },
  ]);

  console.warn(
    `Seeded ${zones.length} zones, 3 vehicle variants, ${inserted.length} placeholder parts, ` +
      `${listings.length} placeholder listings across 2 suppliers.`,
  );
}

seed()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
