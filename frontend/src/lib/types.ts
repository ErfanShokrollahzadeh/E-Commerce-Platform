/**
 * TypeScript types for the E-Commerce Platform.
 * Mirrors Django REST Framework serializer output exactly.
 *
 * Serializer mapping:
 *   CategorySerializer      → Category
 *   BrandSerializer         → Brand
 *   TagSerializer           → Tag
 *   ProductImageSerializer  → ProductImage
 *   ProductVariantSerializer→ ProductVariant
 *   ProductListSerializer   → ProductListItem
 *   ProductDetailSerializer → Product
 */

// =============================================================================
// NESTED TYPES (used inside Product types)
// =============================================================================

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent: number | null;
  parent_name: string | null;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface ProductImage {
  id: number;
  image: string;
  alt_text: string;
  is_primary: boolean;
  display_order: number;
}

export interface ProductVariant {
  id: number;
  name: string;
  sku: string;
  price: string; // DecimalField serialized as string
  stock: number;
  in_stock: boolean;
  is_active: boolean;
}

// =============================================================================
// PRODUCT LIST ITEM — Lightweight (from ProductListSerializer)
// Used for product listing pages with grid/card views
// =============================================================================

export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  sku: string;
  category: Category;
  brand: Brand;
  price: string;
  discount_price: string | null;
  current_price: string;
  discount_percentage: number;
  stock: number;
  in_stock: boolean;
  primary_image: ProductImage | null;
  created_at: string;
}

// =============================================================================
// PRODUCT DETAIL — Full data (from ProductDetailSerializer)
// Used for the single product detail page
// =============================================================================

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  description: string;
  category: Category;
  brand: Brand;
  tags: Tag[];
  price: string;
  discount_price: string | null;
  current_price: string;
  discount_percentage: number;
  stock: number;
  in_stock: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// PAGINATED RESPONSE — DRF pagination wrapper
// =============================================================================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// =============================================================================
// CART — Zustand store types
// =============================================================================

export interface CartItem {
  productId: number;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image?: string;
}

// =============================================================================
// CHECKOUT — Multi-step form types
// =============================================================================

export interface CheckoutFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
}

// =============================================================================
// ORDER RESPONSE — from OrderDetailSerializer
// =============================================================================

export interface OrderItemResponse {
  id: number;
  product: number | null;
  product_name: string;
  price: string;
  quantity: number;
  total_cost: string;
}

export interface OrderResponse {
  id: number;
  user: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  total_price: string;
  status: string;
  created_at: string;
  updated_at: string;
  items: OrderItemResponse[];
}

// =============================================================================
// AUTH — User & Token types
// =============================================================================

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  avatar: string | null;
  date_of_birth: string | null;
  address: string;
  city: string;
  postal_code: string;
  date_joined: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  message: string;
}

export interface RegisterFormData {
  email: string;
  username?: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

