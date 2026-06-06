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
