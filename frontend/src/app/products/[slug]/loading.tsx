/**
 * Loading skeleton for product detail page.
 * Shown during ISR first-generation for products not yet pre-built.
 */

import styles from "./loading.module.css";

export default function Loading() {
  return (
    <div className={styles.page}>
      <div className={styles.breadcrumbs}>
        <div className={styles.crumb} />
        <div className={styles.crumb} />
        <div className={styles.crumb} />
      </div>

      <div className={styles.content}>
        {/* Image skeleton */}
        <div className={styles.gallery}>
          <div className={styles.mainImageSkeleton} />
          <div className={styles.thumbnailRow}>
            <div className={styles.thumbSkeleton} />
            <div className={styles.thumbSkeleton} />
            <div className={styles.thumbSkeleton} />
            <div className={styles.thumbSkeleton} />
          </div>
        </div>

        {/* Info skeleton */}
        <div className={styles.info}>
          <div className={styles.brandSkeleton} />
          <div className={styles.titleSkeleton} />
          <div className={styles.titleSkeletonShort} />
          <div className={styles.priceSkeleton} />
          <div className={styles.stockSkeleton} />
          <div className={styles.divider} />
          <div className={styles.buttonSkeleton} />
          <div className={styles.divider} />
          <div className={styles.descLine} />
          <div className={styles.descLine} />
          <div className={styles.descLineShort} />
        </div>
      </div>
    </div>
  );
}
