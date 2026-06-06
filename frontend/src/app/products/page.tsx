/**
 * Product Listing Page — ISR (Incremental Static Regeneration)
 *
 * How ISR works here:
 *   1. At build time, this page is rendered as static HTML
 *   2. All requests serve the cached static HTML instantly (< 1s)
 *   3. After 60 seconds, the next request triggers background regeneration
 *   4. The stale page is served immediately while a fresh version generates
 *   5. Once regeneration completes, subsequent requests get the updated page
 *
 * Route: /products
 */

import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { fetchProducts } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import type { ProductListItem } from "@/lib/types";
import styles from "./page.module.css";

// ---------------------------------------------------------------------------
// ISR CONFIGURATION — revalidate every 60 seconds
// ---------------------------------------------------------------------------
export const revalidate = 60;

// ---------------------------------------------------------------------------
// SEO METADATA
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: "Shop All Products | E-Commerce Platform",
  description:
    "Browse our curated collection of premium products. Fast delivery, competitive prices, and exceptional quality.",
};

// ---------------------------------------------------------------------------
// HELPER — format price display
// ---------------------------------------------------------------------------
function formatPrice(price: string): string {
  return `$${parseFloat(price).toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// PRODUCT CARD COMPONENT
// ---------------------------------------------------------------------------
function ProductCard({ product }: { product: ProductListItem }) {
  const imageUrl = product.primary_image?.image ? getImageUrl(product.primary_image.image) : null;
  const hasDiscount = product.discount_price !== null && product.discount_percentage > 0;

  return (
    <Link href={`/products/${product.slug}`} className={styles.card} id={`product-${product.id}`}>
      <div className={styles.imageWrapper}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.primary_image?.alt_text || product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={styles.image}
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
        {hasDiscount && (
          <span className={styles.discountBadge}>-{product.discount_percentage}%</span>
        )}
        {!product.in_stock && (
          <span className={styles.outOfStockBadge}>Out of Stock</span>
        )}
      </div>

      <div className={styles.cardBody}>
        <span className={styles.brand}>{product.brand.name}</span>
        <h3 className={styles.productName}>{product.name}</h3>
        <div className={styles.categoryTag}>{product.category.name}</div>
        <div className={styles.pricing}>
          <span className={hasDiscount ? styles.currentPrice : styles.price}>
            {formatPrice(product.current_price)}
          </span>
          {hasDiscount && (
            <span className={styles.originalPrice}>{formatPrice(product.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// PAGE COMPONENT (Server Component)
// ---------------------------------------------------------------------------
export default async function ProductsPage() {
  let products: ProductListItem[] = [];
  let totalCount = 0;

  try {
    const data = await fetchProducts();
    products = data.results;
    totalCount = data.count;
  } catch (error) {
    // During build or when backend is unavailable, render empty state.
    // ISR will regenerate this page on the first request when backend is up.
    console.warn("Failed to fetch products:", error instanceof Error ? error.message : error);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Home
        </Link>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Shop All Products</h1>
          <p className={styles.subtitle}>
            {totalCount} {totalCount === 1 ? "product" : "products"} available
          </p>
        </div>
      </header>

      {products.length > 0 ? (
        <div className={styles.grid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.29 7 12 12 20.71 7" />
            <line x1="12" y1="22" x2="12" y2="12" />
          </svg>
          <h2>No products found</h2>
          <p>Check back soon — we&apos;re adding new products regularly.</p>
        </div>
      )}
    </div>
  );
}
