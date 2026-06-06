/**
 * Skeleton loading state for the products listing page.
 * Shown while the page generates (first visit for ISR pages).
 */

import styles from "./loading.module.css";

function SkeletonCard() {
  return (
    <div className={styles.card}>
      <div className={styles.imageSkeleton} />
      <div className={styles.cardBody}>
        <div className={styles.brandSkeleton} />
        <div className={styles.nameSkeleton} />
        <div className={styles.categorySkeleton} />
        <div className={styles.priceSkeleton} />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleSkeleton} />
        <div className={styles.subtitleSkeleton} />
      </div>
      <div className={styles.grid}>
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
