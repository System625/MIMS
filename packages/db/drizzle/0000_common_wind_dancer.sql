CREATE TYPE "public"."cross_reference_type" AS ENUM('oem', 'aftermarket', 'supersedes', 'superseded_by', 'interchange');--> statement-breakpoint
CREATE TYPE "public"."estimate_coverage" AS ENUM('full', 'partial', 'none');--> statement-breakpoint
CREATE TYPE "public"."estimate_status" AS ENUM('draft', 'complete', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."identification_method" AS ENUM('vin', 'manual');--> statement-breakpoint
CREATE TYPE "public"."part_condition" AS ENUM('new_oem', 'new_aftermarket', 'used_tokunbo', 'refurbished');--> statement-breakpoint
CREATE TYPE "public"."part_position" AS ENUM('left', 'right', 'front', 'rear', 'pair', 'not_applicable');--> statement-breakpoint
CREATE TYPE "public"."price_source" AS ENUM('vendor_quote', 'market_survey', 'dealer_list', 'import_landed_cost', 'manual_entry');--> statement-breakpoint
CREATE TYPE "public"."vin_lookup_status" AS ENUM('success', 'not_found', 'invalid_vin', 'upstream_error');--> statement-breakpoint
CREATE TYPE "public"."waitlist_source" AS ENUM('landing', 'facelift_hub', 'accessories_store', 'coverage_gap', 'vehicle_not_found');--> statement-breakpoint
CREATE TABLE "makes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"country_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"make_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"label" text,
	"year_start" integer NOT NULL,
	"year_end" integer,
	"trim" text,
	"engine" text,
	"engine_code" text,
	"body_style" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "damage_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_internal" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manufacturers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"is_oem" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "part_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"parent_id" uuid,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "part_cross_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"part_id" uuid NOT NULL,
	"reference_type" "cross_reference_type" NOT NULL,
	"number" text NOT NULL,
	"manufacturer_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "part_fitments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"part_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"year_start" integer,
	"year_end" integer,
	"qualifier" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "part_zones" (
	"part_id" uuid NOT NULL,
	"zone_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "part_zones_part_id_zone_id_pk" PRIMARY KEY("part_id","zone_id")
);
--> statement-breakpoint
CREATE TABLE "parts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"category_id" uuid,
	"manufacturer_id" uuid,
	"mpn" text,
	"oem_number" text,
	"position" "part_position" DEFAULT 'not_applicable' NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "part_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"part_id" uuid NOT NULL,
	"condition" "part_condition" NOT NULL,
	"amount_min" numeric(14, 2) NOT NULL,
	"amount_max" numeric(14, 2) NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"source" "price_source" NOT NULL,
	"source_note" text,
	"fx_rate_usd_ngn" numeric(12, 4),
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"recorded_by" text
);
--> statement-breakpoint
CREATE TABLE "estimate_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estimate_id" uuid NOT NULL,
	"part_id" uuid,
	"price_id" uuid,
	"zone_code" text NOT NULL,
	"part_name" text NOT NULL,
	"mpn" text,
	"oem_number" text,
	"position" "part_position" DEFAULT 'not_applicable' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"is_priced" boolean DEFAULT false NOT NULL,
	"condition" "part_condition",
	"price_min" numeric(14, 2),
	"price_max" numeric(14, 2),
	"price_recorded_at" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estimate_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estimate_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estimate_zones" (
	"estimate_id" uuid NOT NULL,
	"zone_id" uuid,
	"zone_code" text NOT NULL,
	"zone_name" text NOT NULL,
	CONSTRAINT "estimate_zones_estimate_id_zone_code_pk" PRIMARY KEY("estimate_id","zone_code")
);
--> statement-breakpoint
CREATE TABLE "estimates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"identification_method" "identification_method" NOT NULL,
	"vin" text,
	"variant_id" uuid,
	"vehicle_year" integer,
	"vehicle_make_text" text NOT NULL,
	"vehicle_model_text" text NOT NULL,
	"vehicle_trim_text" text,
	"vehicle_engine_text" text,
	"status" "estimate_status" DEFAULT 'draft' NOT NULL,
	"coverage" "estimate_coverage" DEFAULT 'none' NOT NULL,
	"subtotal_min" numeric(14, 2),
	"subtotal_max" numeric(14, 2),
	"currency" text DEFAULT 'NGN' NOT NULL,
	"unpriced_item_count" integer DEFAULT 0 NOT NULL,
	"contact_email" text,
	"user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"source" "waitlist_source" NOT NULL,
	"vehicle_note" text,
	"metadata" jsonb,
	"estimate_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vin_lookups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vin" text NOT NULL,
	"wmi" text,
	"status" "vin_lookup_status" NOT NULL,
	"raw_response" jsonb,
	"decoded_make" text,
	"decoded_model" text,
	"decoded_year" integer,
	"decoded_trim" text,
	"decoded_engine" text,
	"matched_variant_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vehicle_models" ADD CONSTRAINT "vehicle_models_make_id_makes_id_fk" FOREIGN KEY ("make_id") REFERENCES "public"."makes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_variants" ADD CONSTRAINT "vehicle_variants_model_id_vehicle_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."vehicle_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "part_categories" ADD CONSTRAINT "part_categories_parent_id_part_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."part_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "part_cross_references" ADD CONSTRAINT "part_cross_references_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "part_cross_references" ADD CONSTRAINT "part_cross_references_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "part_fitments" ADD CONSTRAINT "part_fitments_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "part_fitments" ADD CONSTRAINT "part_fitments_variant_id_vehicle_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."vehicle_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "part_zones" ADD CONSTRAINT "part_zones_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "part_zones" ADD CONSTRAINT "part_zones_zone_id_damage_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."damage_zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_category_id_part_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."part_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_manufacturer_id_manufacturers_id_fk" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "part_prices" ADD CONSTRAINT "part_prices_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimate_items" ADD CONSTRAINT "estimate_items_estimate_id_estimates_id_fk" FOREIGN KEY ("estimate_id") REFERENCES "public"."estimates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimate_items" ADD CONSTRAINT "estimate_items_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimate_items" ADD CONSTRAINT "estimate_items_price_id_part_prices_id_fk" FOREIGN KEY ("price_id") REFERENCES "public"."part_prices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimate_photos" ADD CONSTRAINT "estimate_photos_estimate_id_estimates_id_fk" FOREIGN KEY ("estimate_id") REFERENCES "public"."estimates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimate_zones" ADD CONSTRAINT "estimate_zones_estimate_id_estimates_id_fk" FOREIGN KEY ("estimate_id") REFERENCES "public"."estimates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimate_zones" ADD CONSTRAINT "estimate_zones_zone_id_damage_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."damage_zones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_variant_id_vehicle_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."vehicle_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_estimate_id_estimates_id_fk" FOREIGN KEY ("estimate_id") REFERENCES "public"."estimates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vin_lookups" ADD CONSTRAINT "vin_lookups_matched_variant_id_vehicle_variants_id_fk" FOREIGN KEY ("matched_variant_id") REFERENCES "public"."vehicle_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "makes_slug_key" ON "makes" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_models_make_slug_key" ON "vehicle_models" USING btree ("make_id","slug");--> statement-breakpoint
CREATE INDEX "vehicle_models_make_idx" ON "vehicle_models" USING btree ("make_id");--> statement-breakpoint
CREATE INDEX "vehicle_variants_model_idx" ON "vehicle_variants" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "vehicle_variants_year_idx" ON "vehicle_variants" USING btree ("year_start","year_end");--> statement-breakpoint
CREATE UNIQUE INDEX "damage_zones_code_key" ON "damage_zones" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "manufacturers_slug_key" ON "manufacturers" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "part_categories_code_key" ON "part_categories" USING btree ("code");--> statement-breakpoint
CREATE INDEX "part_cross_references_number_idx" ON "part_cross_references" USING btree ("number");--> statement-breakpoint
CREATE UNIQUE INDEX "part_cross_references_unique" ON "part_cross_references" USING btree ("part_id","reference_type","number");--> statement-breakpoint
CREATE UNIQUE INDEX "part_fitments_unique" ON "part_fitments" USING btree ("part_id","variant_id","year_start","year_end");--> statement-breakpoint
CREATE INDEX "part_fitments_variant_idx" ON "part_fitments" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "part_fitments_part_idx" ON "part_fitments" USING btree ("part_id");--> statement-breakpoint
CREATE INDEX "part_zones_zone_idx" ON "part_zones" USING btree ("zone_id");--> statement-breakpoint
CREATE UNIQUE INDEX "parts_slug_key" ON "parts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "parts_mpn_idx" ON "parts" USING btree ("mpn");--> statement-breakpoint
CREATE INDEX "parts_oem_number_idx" ON "parts" USING btree ("oem_number");--> statement-breakpoint
CREATE INDEX "parts_category_idx" ON "parts" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "part_prices_lookup_idx" ON "part_prices" USING btree ("part_id","condition","effective_from" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "part_prices_part_idx" ON "part_prices" USING btree ("part_id");--> statement-breakpoint
CREATE INDEX "estimate_items_estimate_idx" ON "estimate_items" USING btree ("estimate_id");--> statement-breakpoint
CREATE INDEX "estimate_photos_estimate_idx" ON "estimate_photos" USING btree ("estimate_id");--> statement-breakpoint
CREATE UNIQUE INDEX "estimates_reference_key" ON "estimates" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "estimates_created_idx" ON "estimates" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "estimates_variant_idx" ON "estimates" USING btree ("variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "waitlist_entries_email_source_key" ON "waitlist_entries" USING btree ("email","source");--> statement-breakpoint
CREATE INDEX "waitlist_entries_created_idx" ON "waitlist_entries" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "vin_lookups_vin_idx" ON "vin_lookups" USING btree ("vin");--> statement-breakpoint
CREATE INDEX "vin_lookups_created_idx" ON "vin_lookups" USING btree ("created_at" DESC NULLS LAST);