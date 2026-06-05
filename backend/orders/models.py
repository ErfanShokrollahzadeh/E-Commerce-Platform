"""
Order and OrderItem models — Phase 2: Database Schema
"""

from django.conf import settings
from django.db import models

from products.models import Product


class Order(models.Model):
    """
    Model representing a customer order.
    Stores customer info, shipping addresses, total costs, and current progress status.
    """

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("PAID", "Paid"),
        ("SHIPPED", "Shipped"),
        ("DELIVERED", "Delivered"),
        ("CANCELLED", "Cancelled"),
    ]

    # Associate order with user if authenticated. If anonymous, we fallback to session_key.
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    session_key = models.CharField(
        max_length=40,
        blank=True,
        null=True,
        db_index=True,
        help_text="Anonymous guest checkout identifier",
    )

    # Customer Information
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField()
    phone = models.CharField(max_length=20)

    # Shipping Details
    address = models.TextField()
    city = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)

    # Totals & Status
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING",
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.id} — {self.first_name} {self.last_name}"


class OrderItem(models.Model):
    """
    Model representing an individual item within an order.
    Includes snapshots of name and price at the purchase time to protect against changes.
    """

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        related_name="order_items",
    )

    # Snapshot fields for security & history integrity
    product_name = models.CharField(
        max_length=255,
        help_text="Snapshot of the product name at the time of purchase.",
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Price of the product at the time of purchase.",
    )
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"OrderItem #{self.id} — {self.product_name} x {self.quantity}"

    @property
    def total_cost(self):
        """Calculates total cost for this order line item."""
        return self.price * self.quantity
