import type * as schema from './schema/index.js';

/**
 * Row types inferred straight from the schema. These are the single origin of
 * every type in the system: Drizzle infers them here, `@mims/contracts` builds
 * its Zod schemas to match, and both frontends consume the contracts. Nothing
 * downstream should hand-write an interface for a database row.
 */
export type Make = typeof schema.makes.$inferSelect;
export type NewMake = typeof schema.makes.$inferInsert;

export type VehicleModel = typeof schema.vehicleModels.$inferSelect;
export type NewVehicleModel = typeof schema.vehicleModels.$inferInsert;

export type VehicleVariant = typeof schema.vehicleVariants.$inferSelect;
export type NewVehicleVariant = typeof schema.vehicleVariants.$inferInsert;

export type DamageZone = typeof schema.damageZones.$inferSelect;
export type NewDamageZone = typeof schema.damageZones.$inferInsert;

export type Manufacturer = typeof schema.manufacturers.$inferSelect;
export type PartCategory = typeof schema.partCategories.$inferSelect;

export type Part = typeof schema.parts.$inferSelect;
export type NewPart = typeof schema.parts.$inferInsert;

export type PartZone = typeof schema.partZones.$inferSelect;
export type PartFitment = typeof schema.partFitments.$inferSelect;
export type NewPartFitment = typeof schema.partFitments.$inferInsert;
export type PartCrossReference = typeof schema.partCrossReferences.$inferSelect;

export type PartPrice = typeof schema.partPrices.$inferSelect;
export type NewPartPrice = typeof schema.partPrices.$inferInsert;

export type Estimate = typeof schema.estimates.$inferSelect;
export type NewEstimate = typeof schema.estimates.$inferInsert;
export type EstimateItem = typeof schema.estimateItems.$inferSelect;
export type NewEstimateItem = typeof schema.estimateItems.$inferInsert;
export type EstimateZone = typeof schema.estimateZones.$inferSelect;
export type EstimatePhoto = typeof schema.estimatePhotos.$inferSelect;

export type WaitlistEntry = typeof schema.waitlistEntries.$inferSelect;
export type NewWaitlistEntry = typeof schema.waitlistEntries.$inferInsert;

export type VinLookup = typeof schema.vinLookups.$inferSelect;
export type NewVinLookup = typeof schema.vinLookups.$inferInsert;
