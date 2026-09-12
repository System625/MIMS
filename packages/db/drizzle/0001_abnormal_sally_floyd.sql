CREATE TYPE "public"."cart_status" AS ENUM('active', 'ordered', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."fitment_confidence" AS ENUM('confirmed', 'probable', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."fulfilment_method" AS ENUM('delivery', 'pickup');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('draft', 'active', 'out_of_stock', 'archived');--> statement-breakpoint
CREATE TYPE "public"."order_event_type" AS ENUM('placed', 'payment_initialized', 'payment_succeeded', 'payment_failed', 'supplier_ordered', 'shipped', 'arrived_port', 'customs_started', 'customs_delayed', 'customs_cleared', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled', 'refund_initiated', 'refunded', 'note');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('awaiting_payment', 'paid', 'sourcing', 'in_transit', 'customs', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_channel" AS ENUM('card', 'bank_transfer', 'ussd', 'bank', 'qr', 'mobile_money', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('paystack');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('initialized', 'pending', 'success', 'failed', 'abandoned', 'reversed');--> statement-breakpoint
CREATE TYPE "public"."stock_model" AS ENUM('held_stock', 'pre_order');--> statement-breakpoint
CREATE TYPE "public"."supplier_status" AS ENUM('active', 'paused', 'archived');--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" "supplier_status" DEFAULT 'active' NOT NULL,
	"contact_name" text,
	"phone" text,
	"email" text,
	"country_code" text DEFAULT 'NG' NOT NULL,
	"city" text,
	"default_lead_time_min_days" integer,
	"default_lead_time_max_days" integer,
	"commission_rate" numeric(5, 4),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"alt_text" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_price_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"previous_price" numeric(14, 2),
	"new_price" numeric(14, 2) NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"fx_rate_usd_ngn" numeric(12, 4),
	"reason" text,
	"changed_by" text,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"part_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"title" text,
	"description" text,
	"condition" "part_condition" NOT NULL,
	"stock_model" "stock_model" NOT NULL,
	"status" "listing_status" DEFAULT 'draft' NOT NULL,
	"retail_price" numeric(14, 2) NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"price_valid_until" timestamp with time zone,
	"quantity_available" integer DEFAULT 0 NOT NULL,
	"lead_time_min_days" integer,
	"lead_time_max_days" integer,
	"hs_code" text,
	"unit_cost_usd" numeric(14, 2),
	"freight_cost_ngn" numeric(14, 2),
	"duty_rate" numeric(5, 4),
	"landed_cost_ngn" numeric(14, 2),
	"fx_rate_usd_ngn" numeric(12, 4),
	"cost_recorded_at" timestamp with time zone,
	"fitment_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"label" text,
	"recipient_name" text NOT NULL,
	"phone" text NOT NULL,
	"alt_phone" text,
	"line1" text NOT NULL,
	"line2" text,
	"landmark" text,
	"area" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"country_code" text DEFAULT 'NG' NOT NULL,
	"delivery_notes" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pickup_points" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"partner_name" text,
	"line1" text NOT NULL,
	"landmark" text,
	"area" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"phone" text,
	"opening_hours" text,
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"listing_id" uuid,
	"quantity" integer DEFAULT 1 NOT NULL,
	"part_name" text NOT NULL,
	"mpn" text,
	"condition" "part_condition" NOT NULL,
	"stock_model" "stock_model" NOT NULL,
	"unit_price" numeric(14, 2) NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"lead_time_min_days" integer,
	"lead_time_max_days" integer,
	"fitment_confidence" "fitment_confidence" DEFAULT 'unknown' NOT NULL,
	"fitment_note" text,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"user_id" text,
	"status" "cart_status" DEFAULT 'active' NOT NULL,
	"variant_id" uuid,
	"vehicle_year" integer,
	"vehicle_make_text" text,
	"vehicle_model_text" text,
	"vehicle_chassis_code" text,
	"estimate_id" uuid,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"expires_at" timestamp with time zone,
	"ordered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"type" "order_event_type" NOT NULL,
	"summary" text NOT NULL,
	"detail" text,
	"is_customer_visible" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"recorded_by" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"listing_id" uuid,
	"part_id" uuid,
	"supplier_id" uuid,
	"sku" text,
	"part_name" text NOT NULL,
	"mpn" text,
	"oem_number" text,
	"position" "part_position" DEFAULT 'not_applicable' NOT NULL,
	"condition" "part_condition" NOT NULL,
	"stock_model" "stock_model" NOT NULL,
	"supplier_name" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(14, 2) NOT NULL,
	"line_total" numeric(14, 2) NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"lead_time_min_days" integer,
	"lead_time_max_days" integer,
	"fitment_confidence" "fitment_confidence" DEFAULT 'unknown' NOT NULL,
	"fitment_note" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"status" "order_status" DEFAULT 'awaiting_payment' NOT NULL,
	"user_id" text,
	"cart_id" uuid,
	"estimate_id" uuid,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"customer_alt_phone" text,
	"customer_email" text,
	"fulfilment_method" "fulfilment_method" NOT NULL,
	"delivery_address_id" uuid,
	"delivery_recipient_name" text,
	"delivery_phone" text,
	"delivery_line1" text,
	"delivery_line2" text,
	"delivery_landmark" text,
	"delivery_area" text,
	"delivery_city" text,
	"delivery_state" text,
	"delivery_country_code" text DEFAULT 'NG',
	"delivery_notes" text,
	"pickup_point_id" uuid,
	"pickup_point_code" text,
	"pickup_point_name" text,
	"pickup_point_address" text,
	"variant_id" uuid,
	"vehicle_year" integer,
	"vehicle_make_text" text,
	"vehicle_model_text" text,
	"vehicle_chassis_code" text,
	"items_subtotal" numeric(14, 2) NOT NULL,
	"delivery_fee" numeric(14, 2) DEFAULT '0.00' NOT NULL,
	"total" numeric(14, 2) NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"fx_rate_usd_ngn" numeric(12, 4),
	"lead_time_min_days" integer,
	"lead_time_max_days" integer,
	"customer_note" text,
	"cancellation_reason" text,
	"placed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"provider" "payment_provider" DEFAULT 'paystack' NOT NULL,
	"event_type" text NOT NULL,
	"provider_event_id" text,
	"signature_verified" boolean DEFAULT false NOT NULL,
	"payload" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" "payment_provider" DEFAULT 'paystack' NOT NULL,
	"status" "payment_status" DEFAULT 'initialized' NOT NULL,
	"reference" text NOT NULL,
	"provider_reference" text,
	"provider_transaction_id" text,
	"amount" numeric(14, 2) NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"channel" "payment_channel",
	"channel_detail" text,
	"authorization_url" text,
	"access_code" text,
	"fee_amount" numeric(14, 2),
	"settled_amount" numeric(14, 2),
	"failure_reason" text,
	"paid_at" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vehicle_variants" ADD COLUMN "chassis_code" text;--> statement-breakpoint
ALTER TABLE "part_fitments" ADD COLUMN "confidence" "fitment_confidence" DEFAULT 'confirmed' NOT NULL;--> statement-breakpoint
ALTER TABLE "part_fitments" ADD COLUMN "evidence" text;--> statement-breakpoint
ALTER TABLE "part_fitments" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "estimate_items" ADD COLUMN "detail" text;--> statement-breakpoint
ALTER TABLE "estimate_items" ADD COLUMN "source_label" text;--> statement-breakpoint
ALTER TABLE "listing_photos" ADD CONSTRAINT "listing_photos_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_price_changes" ADD CONSTRAINT "listing_price_changes_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_variant_id_vehicle_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."vehicle_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_estimate_id_estimates_id_fk" FOREIGN KEY ("estimate_id") REFERENCES "public"."estimates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_estimate_id_estimates_id_fk" FOREIGN KEY ("estimate_id") REFERENCES "public"."estimates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_address_id_addresses_id_fk" FOREIGN KEY ("delivery_address_id") REFERENCES "public"."addresses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_pickup_point_id_pickup_points_id_fk" FOREIGN KEY ("pickup_point_id") REFERENCES "public"."pickup_points"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_variant_id_vehicle_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."vehicle_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_slug_key" ON "suppliers" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "suppliers_status_idx" ON "suppliers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "listing_photos_listing_idx" ON "listing_photos" USING btree ("listing_id","display_order");--> statement-breakpoint
CREATE INDEX "listing_price_changes_listing_idx" ON "listing_price_changes" USING btree ("listing_id","effective_from" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "listings_sku_key" ON "listings" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "listings_part_idx" ON "listings" USING btree ("part_id");--> statement-breakpoint
CREATE INDEX "listings_supplier_idx" ON "listings" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "listings_browse_idx" ON "listings" USING btree ("status","part_id","retail_price");--> statement-breakpoint
CREATE INDEX "listings_condition_idx" ON "listings" USING btree ("condition");--> statement-breakpoint
CREATE INDEX "addresses_phone_idx" ON "addresses" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "addresses_user_idx" ON "addresses" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pickup_points_code_key" ON "pickup_points" USING btree ("code");--> statement-breakpoint
CREATE INDEX "pickup_points_state_idx" ON "pickup_points" USING btree ("state","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "cart_items_cart_listing_key" ON "cart_items" USING btree ("cart_id","listing_id");--> statement-breakpoint
CREATE INDEX "cart_items_cart_idx" ON "cart_items" USING btree ("cart_id");--> statement-breakpoint
CREATE UNIQUE INDEX "carts_token_key" ON "carts" USING btree ("token");--> statement-breakpoint
CREATE INDEX "carts_user_idx" ON "carts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "carts_status_idx" ON "carts" USING btree ("status","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "order_events_order_idx" ON "order_events" USING btree ("order_id","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_reference_key" ON "orders" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "orders_phone_idx" ON "orders" USING btree ("customer_phone");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "orders_created_idx" ON "orders" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "payment_events_payment_idx" ON "payment_events" USING btree ("payment_id","received_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "payment_events_provider_event_idx" ON "payment_events" USING btree ("provider_event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_reference_key" ON "payments" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "payments_order_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payments_provider_reference_idx" ON "payments" USING btree ("provider_reference");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");