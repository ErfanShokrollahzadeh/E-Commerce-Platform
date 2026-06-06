import styles from "./page.module.css";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className={styles.page}>
      {/* Header Section */}
      <section className={styles.header}>
        <h1 className={styles.title}>
          Redefining Your <span className={styles.gradientText}>Shopping</span> Experience
        </h1>
        <p className={styles.subtitle}>
          We believe that premium quality shouldn't be complicated. Our mission is to
          curate the best products and deliver them to your door with unparalleled speed.
        </p>
      </section>

      {/* Content Grid */}
      <section className={styles.content}>
        <div className={styles.imageGrid}>
          <div className={`${styles.imageWrapper} ${styles.img1}`}>
            <div className={styles.placeholder}>Quality</div>
          </div>
          <div className={`${styles.imageWrapper} ${styles.img2}`}>
            <div className={styles.placeholder}>Speed</div>
          </div>
          <div className={`${styles.imageWrapper} ${styles.img3}`}>
            <div className={styles.placeholder}>Design</div>
          </div>
        </div>

        <div className={styles.textContent}>
          <h2>Our Story</h2>
          <p>
            Founded in 2026, ShopPlatform began with a simple idea: the online shopping
            experience was broken. Endless scrolling, slow page loads, and questionable
            quality had become the norm.
          </p>
          <p>
            We set out to fix that by building a platform from the ground up using
            cutting-edge technology. By connecting our blazing-fast Next.js frontend
            directly to a highly optimized backend, we eliminated loading screens and
            frustration.
          </p>
          <p>
            Today, we partner with the world's most innovative brands to bring you a
            curated selection of products that elevate your everyday life.
          </p>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNumber}>50k+</span>
              <span className={styles.statLabel}>Happy Customers</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>99%</span>
              <span className={styles.statLabel}>Same Day Shipping</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>24/7</span>
              <span className={styles.statLabel}>Support Team</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
