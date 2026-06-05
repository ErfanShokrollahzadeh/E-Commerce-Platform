/**
 * API client for Django REST Framework backend.
 * Centralizes all API calls to the backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

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
