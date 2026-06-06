/**
 * API client for Django REST Framework backend.
 * Centralizes all API calls to the backend.
 *
 * Two modes:
 *   1. Client-side (productsApi, cartApi, ordersApi) — used in client components
 *   2. Server-side (fetchProducts, fetchProductBySlug, etc.) — used in ISR/SSR
 *      pages with Next.js extended fetch for caching & revalidation
 */

import type {
  Product,
  ProductListItem,
  PaginatedResponse,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/**
 * Server-side API base URL — used during build/ISR/SSR.
 * Falls back to NEXT_PUBLIC_API_URL → localhost.
 * Set API_INTERNAL_URL in .env.local for production internal service URLs.
 */
const API_INTERNAL_URL =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api";

/**
 * Generic fetch wrapper with error handling.
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
}

// =============================================================================
// PRODUCTS API
// =============================================================================

export const productsApi = {
  /** Fetch paginated product list with optional filters */
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return apiFetch(`/products/${query}`);
  },

  /** Fetch a single product by slug */
  getBySlug: (slug: string) => {
    return apiFetch(`/products/${slug}/`);
  },
};

// =============================================================================
// CART API
// =============================================================================

export const cartApi = {
  /** Get current cart contents */
  get: () => apiFetch("/cart/"),

  /** Add item to cart */
  add: (productId: number, quantity: number = 1) =>
    apiFetch("/cart/add/", {
      method: "POST",
      body: JSON.stringify({ product_id: productId, quantity }),
    }),

  /** Remove item from cart */
  remove: (productId: number) =>
    apiFetch(`/cart/remove/`, {
      method: "DELETE",
      body: JSON.stringify({ product_id: productId }),
    }),

  /** Clear entire cart */
  clear: () =>
    apiFetch("/cart/clear/", {
      method: "DELETE",
    }),
};

// =============================================================================
// ORDERS API
// =============================================================================

export const ordersApi = {
  /** Place a new order */
  create: (orderData: Record<string, unknown>) =>
    apiFetch("/orders/", {
      method: "POST",
      body: JSON.stringify(orderData),
    }),

  /** Get order by ID */
  get: (orderId: number) => apiFetch(`/orders/${orderId}/`),
};

// =============================================================================
// SERVER-SIDE ISR FETCH FUNCTIONS
// Used by Server Components (product pages) with Next.js extended fetch.
// These run on the server during build (SSG), revalidation (ISR), and SSR.
//
// Key ISR behavior:
//   - Pages are pre-rendered at build time as static HTML
//   - Served instantly from cache (< 1 second)
//   - After `revalidate` seconds, background regeneration is triggered
//   - Stale page is served while fresh version generates
// =============================================================================

/**
 * Fetch paginated product list — cached and revalidated every 60 seconds.
 * Used by the /products listing page.
 */
export async function fetchProducts(
  params?: Record<string, string>
): Promise<PaginatedResponse<ProductListItem>> {
  const query = params ? `?${new URLSearchParams(params)}` : "";
  const url = `${API_INTERNAL_URL}/products/${query}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      next: {
        revalidate: 60,
        tags: ["products"],
      },
    });
  } catch {
    // Network error (e.g., ECONNREFUSED during build when backend isn't running).
    // Return empty response so the page renders the empty state.
    console.warn("fetchProducts: backend unavailable, returning empty response");
    return { count: 0, next: null, previous: null, results: [] };
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch a single product by slug — cached and revalidated every 60 seconds.
 * Used by the /products/[slug] detail page.
 *
 * Cache tag is per-product so on-demand invalidation can target a specific product.
 */
export async function fetchProductBySlug(
  slug: string
): Promise<Product> {
  const url = `${API_INTERNAL_URL}/products/${slug}/`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      next: {
        revalidate: 60,
        tags: ["products", `product-${slug}`],
      },
    });
  } catch {
    // Network error (e.g., ECONNREFUSED during build when backend isn't running).
    // Throw a controlled error so the page can call notFound() or handle gracefully.
    throw new Error("PRODUCT_NOT_FOUND");
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("PRODUCT_NOT_FOUND");
    }
    throw new Error(`Failed to fetch product: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch all product slugs for generateStaticParams.
 * Called at build time to pre-render all product pages.
 * Uses a longer revalidation since slug lists change rarely.
 */
export async function fetchProductSlugs(): Promise<string[]> {
  const url = `${API_INTERNAL_URL}/products/`;

  try {
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      next: {
        revalidate: 300, // 5 minutes — slug list changes rarely
        tags: ["product-slugs"],
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch product slugs: ${response.status}`);
      return [];
    }

    const data: PaginatedResponse<ProductListItem> = await response.json();
    return data.results.map((product) => product.slug);
  } catch {
    // Network error (e.g., ECONNREFUSED during build when backend isn't running).
    // Return empty array — pages will be generated on-demand via ISR at runtime.
    console.warn("fetchProductSlugs: backend unavailable, returning empty array");
    return [];
  }
}
