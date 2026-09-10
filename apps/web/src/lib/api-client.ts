import type {
  ApiError,
  CreateEstimateRequest,
  DamageZone,
  DecodeVinRequest,
  Estimate,
  Health,
  JoinWaitlistRequest,
  Make,
  VehicleModel,
  VehicleVariant,
  VinDecodeResult,
  WaitlistEntry,
} from '@mims/contracts';

/**
 * Typed API client. Every method's return type comes from `@mims/contracts`,
 * which is inferred from the Zod schemas the API validates against — so a change
 * to a route's shape is a compile error here, not a runtime surprise.
 *
 * Components never call this directly; they go through a hook. No business logic
 * lives in this file — it does transport and nothing else.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly payload: ApiError['error'],
  ) {
    super(payload.message);
    this.name = 'ApiRequestError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (payload as ApiError | null)?.error ?? {
      code: 'INTERNAL_ERROR' as const,
      message: 'The request failed.',
    };
    throw new ApiRequestError(response.status, error);
  }

  return (payload as { data: T }).data;
}

export const api = {
  health: (signal?: AbortSignal) => request<Health>('/health', { signal }),

  vehicles: {
    makes: () => request<Make[]>('/api/v1/vehicles/makes'),
    models: (makeId: string) =>
      request<VehicleModel[]>('/api/v1/vehicles/models', { query: { makeId } }),
    years: (modelId: string) => request<number[]>('/api/v1/vehicles/years', { query: { modelId } }),
    variants: (modelId: string, year: number) =>
      request<VehicleVariant[]>('/api/v1/vehicles/variants', { query: { modelId, year } }),
  },

  vin: {
    /** Never rejects on a failed decode — check `result.outcome`. */
    decode: (body: DecodeVinRequest) =>
      request<VinDecodeResult>('/api/v1/vin/decode', { method: 'POST', body }),
  },

  zones: {
    list: () => request<DamageZone[]>('/api/v1/zones'),
  },

  estimates: {
    create: (body: CreateEstimateRequest) =>
      request<Estimate>('/api/v1/estimates', { method: 'POST', body }),
    byReference: (reference: string) => request<Estimate>(`/api/v1/estimates/${reference}`),
  },

  waitlist: {
    join: (body: JoinWaitlistRequest) =>
      request<WaitlistEntry>('/api/v1/waitlist', { method: 'POST', body }),
  },
};
