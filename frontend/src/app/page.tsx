import Link from "next/link";
import Image from "next/image";
import { fetchProducts } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import styles from "./page.module.css";

export default async function Home() {
  // Fetch products from the Django backend
  // Revalidate every 60 seconds (ISR)
  const response = await fetchProducts({ limit: "4" });
  const products = response.results || [];

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <span className={styles.pulse} />
            New Collection 2026
          </div>
          <h1 className={styles.heroTitle}>
            Elevate Your Everyday <br />
            <span className={styles.gradientText}>Lifestyle.</span>
          </h1>
          <p className={styles.heroDesc}>
            Discover our curated selection of premium products designed to enhance
            your daily routine. Fast shipping, exceptional quality.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/products" className={styles.primaryBtn}>
              Shop the Collection
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
            <Link href="/about" className={styles.secondaryBtn}>
              Our Story
            </Link>
          </div>
        </div>
        <div className={styles.heroImageWrapper}>
          <div className={styles.glow} />
          <div className={styles.heroImagePlaceholder}>
             {/* This acts as an abstract shape/image since we don't have a specific hero asset */}
             <div className={styles.abstractShape1} />
             <div className={styles.abstractShape2} />
             <div className={styles.abstractShape3} />
          </div>
        </div>
      </section>

      {/* Featured Products Section (Connected to Django API) */}
      <section className={styles.featured}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Featured Products</h2>
          <Link href="/products" className={styles.viewAll}>
            View All <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        {products.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No featured products available at the moment.</p>
          </div>
        ) : (
          <div className={styles.productGrid}>
            {products.map((product) => {
              const primaryImage = product.primary_image?.image ? getImageUrl(product.primary_image.image) : null;
              
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className={styles.productCard}
                >
                  <div className={styles.imageContainer}>
                    {primaryImage ? (
                      <Image
                        src={primaryImage}
                        alt={product.name}
                        fill
                        className={styles.image}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className={styles.imagePlaceholder}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                      </div>
                    )}
                    {product.brand && (
                      <span className={styles.brandBadge}>{product.brand.name}</span>
                    )}
                  </div>
                  
                  <div className={styles.productInfo}>
                    <h3 className={styles.productName}>{product.name}</h3>
                    <div className={styles.productFooter}>
                      <span className={styles.price}>
                        ${parseFloat(product.current_price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Features Banner */}
      <section className={styles.featuresBanner}>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="3" width="15" height="13"/>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <h3>Free Shipping</h3>
          <p>On all orders over $150</p>
        </div>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <h3>Premium Quality</h3>
          <p>Crafted with excellence</p>
        </div>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h3>Secure Payments</h3>
          <p>100% safe checkout</p>
        </div>
      </section>
    </div>
  );
}
