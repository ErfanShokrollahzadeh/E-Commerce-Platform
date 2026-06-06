/**
 * Order Confirmation Page
 *
 * Shown after a successful checkout. Displays order ID, total,
 * and a "Continue Shopping" CTA.
 */

"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import styles from "./page.module.css";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const total = searchParams.get("total");

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Success Icon */}
        <div className={styles.iconWrapper}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={styles.checkIcon}
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>

        <h1 className={styles.title}>Order Confirmed!</h1>
        <p className={styles.subtitle}>
          Thank you for your purchase. Your order has been placed successfully.
        </p>

        {/* Order Details */}
        <div className={styles.details}>
          {orderId && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Order ID</span>
              <span className={styles.detailValue}>#{orderId}</span>
            </div>
          )}
          {total && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Total Paid</span>
              <span className={styles.detailValue}>${parseFloat(total).toFixed(2)}</span>
            </div>
          )}
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Status</span>
            <span className={styles.statusBadge}>Pending</span>
          </div>
        </div>

        <p className={styles.info}>
          A confirmation email will be sent to your email address. You can track
          your order status from your account.
        </p>

        {/* CTAs */}
        <div className={styles.actions}>
          <Link href="/products" className={styles.primaryBtn} id="continue-shopping">
            Continue Shopping
          </Link>
          <Link href="/" className={styles.secondaryBtn}>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <div className={styles.card}>
            <p style={{ color: "#8b8fa3", textAlign: "center" }}>Loading...</p>
          </div>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
