/**
 * Product Detail Page — ISR (Incremental Static Regeneration)
 *
 * This is the CORE ISR implementation:
 *
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │  BUILD TIME                                                        │
 *   │  generateStaticParams() fetches all product slugs from Django API  │
 *   │  → Each slug gets a pre-rendered static HTML page                  │
 *   └─────────────────────────────────────────────────────────────────────┘
 *                              ↓
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │  REQUEST TIME (within 60s)                                         │
 *   │  Static HTML served from cache → loads in < 1 second               │
 *   └─────────────────────────────────────────────────────────────────────┘
 *                              ↓
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │  AFTER 60 SECONDS                                                  │
 *   │  Next request triggers BACKGROUND regeneration:                    │
 *   │    1. User gets stale (cached) page instantly                      │
 *   │    2. Next.js calls Django API for fresh data                      │
 *   │    3. New static HTML replaces the old cached version              │
 *   │    4. Next request gets the updated page                           │
 *   └─────────────────────────────────────────────────────────────────────┘
 *
 * Route: /products/[slug]
 */

import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { fetchProductBySlug, fetchProductSlugs } from "@/lib/api";
import type { Product, ProductImage as ProductImageType } from "@/lib/types";
import AddToCart from "@/components/AddToCart";
import styles from "./page.module.css";

// ---------------------------------------------------------------------------
// ISR CONFIGURATION — revalidate every 60 seconds
// This means:
//   - Page opens in < 1 second (like a static HTML file)
//   - Every 60 seconds, Next.js checks if the page needs updating
//   - If price/stock changed on backend, next visitor gets the updated page
// ---------------------------------------------------------------------------
export const revalidate = 60;

// ---------------------------------------------------------------------------
// STATIC GENERATION — pre-render all product pages at build time
// This is what makes it ISR instead of SSR:
//   - At build time: all pages are generated as static HTML
//   - At runtime: new products (not in this list) are generated on first visit
// ---------------------------------------------------------------------------
export async function generateStaticParams() {
  const slugs = await fetchProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

// ---------------------------------------------------------------------------
// DYNAMIC SEO METADATA — each product page has unique title/description
// ---------------------------------------------------------------------------
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const product = await fetchProductBySlug(slug);
    const price = parseFloat(product.current_price).toFixed(2);

    return {
      title: `${product.name} | $${price} | E-Commerce Platform`,
      description:
        product.description.slice(0, 160) ||
        `Shop ${product.name} by ${product.brand.name}. ${product.in_stock ? "In stock" : "Out of stock"} — $${price}`,
      openGraph: {
        title: product.name,
        description: product.description.slice(0, 200),
        images: product.images
          .filter((img) => img.image)
          .map((img) => ({ url: img.image })),
      },
    };
  } catch {
    return {
      title: "Product Not Found | E-Commerce Platform",
    };
  }
}

// ---------------------------------------------------------------------------
// HELPER — format price display
// ---------------------------------------------------------------------------
function formatPrice(price: string): string {
  return `$${parseFloat(price).toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// IMAGE GALLERY COMPONENT
// ---------------------------------------------------------------------------
function ImageGallery({ images, productName }: { images: ProductImageType[]; productName: string }) {
  const primaryImage = images.find((img) => img.is_primary) || images[0];
  const otherImages = images.filter((img) => img.id !== primaryImage?.id);

  return (
    <div className={styles.gallery}>
      <div className={styles.mainImage}>
        {primaryImage ? (
          <Image
            src={primaryImage.image}
            alt={primaryImage.alt_text || productName}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className={styles.heroImage}
            priority
          />
        ) : (
          <div className={styles.noImage}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            <span>No image available</span>
          </div>
        )}
      </div>
      {otherImages.length > 0 && (
        <div className={styles.thumbnails}>
          {otherImages.slice(0, 4).map((img) => (
            <div key={img.id} className={styles.thumbnail}>
              <Image
                src={img.image}
                alt={img.alt_text || productName}
                fill
                sizes="100px"
                className={styles.thumbnailImage}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PAGE COMPONENT (Server Component)
// ---------------------------------------------------------------------------
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let product: Product;
  try {
    product = await fetchProductBySlug(slug);
  } catch {
    // If the product is not found or the backend is unavailable,
    // show the not-found page. ISR will retry on the next request.
    notFound();
  }

  const hasDiscount =
    product.discount_price !== null && product.discount_percentage > 0;
  const activeVariants = product.variants.filter((v) => v.is_active);

  return (
    <div className={styles.page}>
      {/* Breadcrumbs */}
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/" className={styles.breadcrumbLink}>Home</Link>
        <span className={styles.breadcrumbSep} aria-hidden="true">/</span>
        <Link href="/products" className={styles.breadcrumbLink}>Products</Link>
        <span className={styles.breadcrumbSep} aria-hidden="true">/</span>
        <Link
          href={`/products?category=${product.category.slug}`}
          className={styles.breadcrumbLink}
        >
          {product.category.name}
        </Link>
        <span className={styles.breadcrumbSep} aria-hidden="true">/</span>
        <span className={styles.breadcrumbCurrent} aria-current="page">
          {product.name}
        </span>
      </nav>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Left — Image Gallery */}
        <ImageGallery images={product.images} productName={product.name} />

        {/* Right — Product Info */}
        <div className={styles.info}>
          <div className={styles.brandLine}>
            <span className={styles.brandLabel}>{product.brand.name}</span>
            <span className={styles.sku}>SKU: {product.sku}</span>
          </div>

          <h1 className={styles.productTitle}>{product.name}</h1>

          {/* Pricing */}
          <div className={styles.priceBlock}>
            <span className={hasDiscount ? styles.salePrice : styles.regularPrice}>
              {formatPrice(product.current_price)}
            </span>
            {hasDiscount && (
              <>
                <span className={styles.strikePrice}>
                  {formatPrice(product.price)}
                </span>
                <span className={styles.saveBadge}>
                  Save {product.discount_percentage}%
                </span>
              </>
            )}
          </div>

          {/* Stock Status */}
          <div className={styles.stockStatus}>
            <span
              className={
                product.in_stock ? styles.inStock : styles.outOfStock
              }
            >
              <span
                className={styles.stockDot}
                style={{
                  backgroundColor: product.in_stock ? "#34d399" : "#ef4444",
                }}
              />
              {product.in_stock
                ? `In Stock (${product.stock} available)`
                : "Out of Stock"}
            </span>
          </div>

          {/* Variants */}
          {activeVariants.length > 0 && (
            <div className={styles.variants}>
              <h3 className={styles.sectionTitle}>Variants</h3>
              <div className={styles.variantList}>
                {activeVariants.map((variant) => (
                  <div key={variant.id} className={styles.variantChip}>
                    <span className={styles.variantName}>{variant.name}</span>
                    <span className={styles.variantPrice}>
                      {formatPrice(variant.price)}
                    </span>
                    {!variant.in_stock && (
                      <span className={styles.variantOos}>Sold out</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className={styles.tags}>
              {product.tags.map((tag) => (
                <span key={tag.id} className={styles.tag}>
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Add to Cart — Client Component */}
          <AddToCart
            productId={product.id}
            productName={product.name}
            price={parseFloat(product.current_price)}
            inStock={product.in_stock}
            image={product.images.find((img) => img.is_primary)?.image}
          />

          {/* Description */}
          <div className={styles.description}>
            <h3 className={styles.sectionTitle}>Description</h3>
            <p className={styles.descriptionText}>{product.description}</p>
          </div>

          {/* Category */}
          <div className={styles.metaInfo}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Category</span>
              <Link
                href={`/products?category=${product.category.slug}`}
                className={styles.metaValue}
              >
                {product.category.parent_name
                  ? `${product.category.parent_name} › `
                  : ""}
                {product.category.name}
              </Link>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Brand</span>
              <span className={styles.metaValue}>{product.brand.name}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
