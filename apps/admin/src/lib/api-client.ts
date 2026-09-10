import type {
  ApiError,
  DamageZone,
  Estimate,
  Health,
  Make,
  PaginatedResponse,
  PartWithPrice,
  VehicleModel,
  VehicleVariant,
} from '@mims/contracts';

/**
 * Typed API client for the admin dashboard. Same contract types as the web app,
 * different transport config — deliberately duplicated rather than shared, for
 * the same reason there is no `packages/ui`: these two clients will diverge
 * (admin gets auth headers and write routes, web does not).
 *
 * Components never call this directly; they go through a hook. No business logic
 * lives in this file — it does transport and nothing else.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';

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

async function requestRaw<T>(path: string, options: RequestOptions = {}): Promise<T> {
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

  return payload as T;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const payload = await requestRaw<{ data: T }>(path, options);
  return payload.data;
}

/** Paginated routes return meta alongside data, so they bypass the unwrapping helper. */
async function requestPaginated<T>(
  path: string,
  options: RequestOptions = {},
): Promise<PaginatedResponse<T>> {
  return requestRaw<PaginatedResponse<T>>(path, options);
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

  zones: {
    list: () => request<DamageZone[]>('/api/v1/zones'),
  },

  parts: {
    list: (query: { search?: string; page?: number; perPage?: number } = {}) =>
      requestPaginated<PartWithPrice>('/api/v1/parts', { query }),
    byId: (id: string) => request<PartWithPrice>(`/api/v1/parts/${id}`),
  },

  estimates: {
    byReference: (reference: string) => request<Estimate>(`/api/v1/estimates/${reference}`),
  },
};
