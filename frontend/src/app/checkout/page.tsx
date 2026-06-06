/**
 * Checkout Page — Multi-Step Form
 *
 * Step 1: Address & Contact Information
 * Step 2: Shipping Method Selection
 * Step 3: Payment (Gateway Emulator)
 *
 * Client component — uses Zustand cart store and local form state.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";
import { createOrder } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import type { CheckoutFormData, ShippingMethod } from "@/lib/types";
import styles from "./page.module.css";

// =============================================================================
// SHIPPING OPTIONS
// =============================================================================

const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: "standard",
    name: "Standard Shipping",
    description: "Delivered in 5-7 business days",
    price: 0,
    estimatedDays: "5-7 days",
  },
  {
    id: "express",
    name: "Express Shipping",
    description: "Delivered in 2-3 business days",
    price: 9.99,
    estimatedDays: "2-3 days",
  },
  {
    id: "nextday",
    name: "Next Day Delivery",
    description: "Delivered by tomorrow",
    price: 19.99,
    estimatedDays: "1 day",
  },
];

// =============================================================================
// HELPERS
// =============================================================================

function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

type FormErrors = Partial<Record<keyof CheckoutFormData, string>>;

function validateForm(data: CheckoutFormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.first_name.trim()) errors.first_name = "First name is required";
  if (!data.last_name.trim()) errors.last_name = "Last name is required";
  if (!data.email.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    errors.email = "Invalid email address";
  if (!data.phone.trim()) errors.phone = "Phone is required";
  else if (data.phone.replace(/\s/g, "").replace("+", "").length < 7)
    errors.phone = "Invalid phone number";
  if (!data.address.trim()) errors.address = "Address is required";
  if (!data.city.trim()) errors.city = "City is required";
  if (!data.postal_code.trim()) errors.postal_code = "Postal code is required";

  return errors;
}

// =============================================================================
// CHECKOUT PAGE COMPONENT
// =============================================================================

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total);
  const itemCount = useCartStore((s) => s.itemCount);
  const clearCart = useCartStore((s) => s.clearCart);

  // Current step: 1 = Address, 2 = Shipping, 3 = Payment
  const [step, setStep] = useState(1);

  // Form data
  const [formData, setFormData] = useState<CheckoutFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [selectedShipping, setSelectedShipping] = useState<ShippingMethod>(
    SHIPPING_METHODS[0]
  );

  // Payment form (emulator)
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Redirect to products if cart is empty
  useEffect(() => {
    if (itemCount === 0 && step === 1) {
      router.push("/products");
    }
  }, [itemCount, step, router]);

  const grandTotal = total + selectedShipping.price;

  // -------------------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------------------

  const handleFieldChange = (
    field: keyof CheckoutFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleNextFromAddress = () => {
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setStep(2);
  };

  const handleNextFromShipping = () => {
    setStep(3);
  };

  const handlePlaceOrder = async () => {
    if (!cardNumber.trim() || !cardName.trim() || !cardExpiry.trim() || !cardCvv.trim()) {
      setSubmitError("Please fill in all payment fields.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const order = await createOrder(formData);
      clearCart();
      // Navigate to confirmation with order data
      router.push(
        `/checkout/confirmation?orderId=${order.id}&total=${order.total_price}`
      );
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "An error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // If cart is empty, show nothing (redirect will happen)
  // -------------------------------------------------------------------------
  if (itemCount === 0 && step === 1) {
    return null;
  }

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Left — Form Steps */}
        <div className={styles.formSide}>
          {/* Step Indicator */}
          <div className={styles.steps}>
            {[
              { num: 1, label: "Address" },
              { num: 2, label: "Shipping" },
              { num: 3, label: "Payment" },
            ].map((s) => (
              <div
                key={s.num}
                className={`${styles.step} ${step >= s.num ? styles.stepActive : ""} ${step === s.num ? styles.stepCurrent : ""}`}
              >
                <div className={styles.stepDot}>
                  {step > s.num ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    s.num
                  )}
                </div>
                <span className={styles.stepLabel}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Step 1: Address */}
          {step === 1 && (
            <div className={styles.formCard}>
              <h2 className={styles.formTitle}>Contact & Shipping Address</h2>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label htmlFor="first_name" className={styles.label}>First Name</label>
                  <input
                    id="first_name"
                    type="text"
                    className={`${styles.input} ${errors.first_name ? styles.inputError : ""}`}
                    value={formData.first_name}
                    onChange={(e) => handleFieldChange("first_name", e.target.value)}
                    placeholder="John"
                  />
                  {errors.first_name && <span className={styles.error}>{errors.first_name}</span>}
                </div>
                <div className={styles.field}>
                  <label htmlFor="last_name" className={styles.label}>Last Name</label>
                  <input
                    id="last_name"
                    type="text"
                    className={`${styles.input} ${errors.last_name ? styles.inputError : ""}`}
                    value={formData.last_name}
                    onChange={(e) => handleFieldChange("last_name", e.target.value)}
                    placeholder="Doe"
                  />
                  {errors.last_name && <span className={styles.error}>{errors.last_name}</span>}
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label htmlFor="email" className={styles.label}>Email</label>
                  <input
                    id="email"
                    type="email"
                    className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                    value={formData.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    placeholder="john@example.com"
                  />
                  {errors.email && <span className={styles.error}>{errors.email}</span>}
                </div>
                <div className={styles.field}>
                  <label htmlFor="phone" className={styles.label}>Phone</label>
                  <input
                    id="phone"
                    type="tel"
                    className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
                    value={formData.phone}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    placeholder="+1 234 567 8900"
                  />
                  {errors.phone && <span className={styles.error}>{errors.phone}</span>}
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="address" className={styles.label}>Street Address</label>
                <input
                  id="address"
                  type="text"
                  className={`${styles.input} ${errors.address ? styles.inputError : ""}`}
                  value={formData.address}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                  placeholder="123 Main St, Apt 4B"
                />
                {errors.address && <span className={styles.error}>{errors.address}</span>}
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label htmlFor="city" className={styles.label}>City</label>
                  <input
                    id="city"
                    type="text"
                    className={`${styles.input} ${errors.city ? styles.inputError : ""}`}
                    value={formData.city}
                    onChange={(e) => handleFieldChange("city", e.target.value)}
                    placeholder="New York"
                  />
                  {errors.city && <span className={styles.error}>{errors.city}</span>}
                </div>
                <div className={styles.field}>
                  <label htmlFor="postal_code" className={styles.label}>Postal Code</label>
                  <input
                    id="postal_code"
                    type="text"
                    className={`${styles.input} ${errors.postal_code ? styles.inputError : ""}`}
                    value={formData.postal_code}
                    onChange={(e) => handleFieldChange("postal_code", e.target.value)}
                    placeholder="10001"
                  />
                  {errors.postal_code && <span className={styles.error}>{errors.postal_code}</span>}
                </div>
              </div>

              <button
                className={styles.primaryBtn}
                onClick={handleNextFromAddress}
                id="checkout-next-address"
              >
                Continue to Shipping
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          )}

          {/* Step 2: Shipping */}
          {step === 2 && (
            <div className={styles.formCard}>
              <h2 className={styles.formTitle}>Shipping Method</h2>

              <div className={styles.shippingOptions}>
                {SHIPPING_METHODS.map((method) => (
                  <label
                    key={method.id}
                    className={`${styles.shippingOption} ${selectedShipping.id === method.id ? styles.shippingSelected : ""}`}
                    htmlFor={`shipping-${method.id}`}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      id={`shipping-${method.id}`}
                      value={method.id}
                      checked={selectedShipping.id === method.id}
                      onChange={() => setSelectedShipping(method)}
                      className={styles.radioInput}
                    />
                    <div className={styles.radioCircle}>
                      <div className={styles.radioInner} />
                    </div>
                    <div className={styles.shippingInfo}>
                      <span className={styles.shippingName}>{method.name}</span>
                      <span className={styles.shippingDesc}>{method.description}</span>
                    </div>
                    <span className={styles.shippingPrice}>
                      {method.price === 0 ? "Free" : formatPrice(method.price)}
                    </span>
                  </label>
                ))}
              </div>

              <div className={styles.btnRow}>
                <button
                  className={styles.secondaryBtn}
                  onClick={() => setStep(1)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  Back
                </button>
                <button
                  className={styles.primaryBtn}
                  onClick={handleNextFromShipping}
                  id="checkout-next-shipping"
                >
                  Continue to Payment
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className={styles.formCard}>
              <h2 className={styles.formTitle}>Payment Details</h2>
              <p className={styles.formSubtitle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                Test Environment — no real charges
              </p>

              <div className={styles.field}>
                <label htmlFor="card_number" className={styles.label}>Card Number</label>
                <input
                  id="card_number"
                  type="text"
                  className={styles.input}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                  placeholder="4242 4242 4242 4242"
                  maxLength={16}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="card_name" className={styles.label}>Name on Card</label>
                <input
                  id="card_name"
                  type="text"
                  className={styles.input}
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label htmlFor="card_expiry" className={styles.label}>Expiry Date</label>
                  <input
                    id="card_expiry"
                    type="text"
                    className={styles.input}
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value.slice(0, 5))}
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="card_cvv" className={styles.label}>CVV</label>
                  <input
                    id="card_cvv"
                    type="text"
                    className={styles.input}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
              </div>

              {submitError && (
                <div className={styles.submitError}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {submitError}
                </div>
              )}

              <div className={styles.btnRow}>
                <button
                  className={styles.secondaryBtn}
                  onClick={() => setStep(2)}
                  disabled={isSubmitting}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  Back
                </button>
                <button
                  className={`${styles.primaryBtn} ${styles.payBtn}`}
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  id="place-order-button"
                >
                  {isSubmitting ? (
                    <>
                      <span className={styles.spinner} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                        <line x1="1" y1="10" x2="23" y2="10" />
                      </svg>
                      Pay {formatPrice(grandTotal)}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right — Order Summary Sidebar */}
        <aside className={styles.summary}>
          <h3 className={styles.summaryTitle}>Order Summary</h3>

          <div className={styles.summaryItems}>
            {items.map((item) => (
              <div key={item.productId} className={styles.summaryItem}>
                <div className={styles.summaryItemImage}>
                  {item.image ? (
                    <Image
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      fill
                      sizes="48px"
                      className={styles.summaryImg}
                    />
                  ) : (
                    <div className={styles.summaryImgPlaceholder} />
                  )}
                  <span className={styles.summaryQty}>{item.quantity}</span>
                </div>
                <div className={styles.summaryItemInfo}>
                  <span className={styles.summaryItemName}>{item.name}</span>
                </div>
                <span className={styles.summaryItemPrice}>
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className={styles.summaryTotals}>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <span>
                {selectedShipping.price === 0
                  ? "Free"
                  : formatPrice(selectedShipping.price)}
              </span>
            </div>
            <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
              <span>Total</span>
              <span>{formatPrice(grandTotal)}</span>
            </div>
          </div>

          <Link href="/products" className={styles.continueShopping}>
            ← Continue Shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
