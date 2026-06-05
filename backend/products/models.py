"""
Product models — Phase 1: Database Architecture

Model relationships:
    Category (self-referencing tree) ──┐
    Brand ─────────────────────────────┤
                                       ▼
                                    Product ◄── ProductImage (gallery)
                                       │    ◄── Tag (M2M)
                                       ▼
                                  ProductVariant (size, color, weight, etc.)

Query optimization strategy:
    - select_related  → ForeignKey (Category, Brand on Product)
    - prefetch_related → Reverse FK (images, variants) and M2M (tags)
"""

from django.db import models
from django.utils.text import slugify


# =============================================================================
# CATEGORY — Self-referencing tree for nested categories
# Example: Electronics > Phones > Smartphones
# =============================================================================

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
    )
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["parent"]),
        ]

    def __str__(self):
        if self.parent:
            return f"{self.parent.name} > {self.name}"
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


# =============================================================================
# BRAND
# =============================================================================

class Brand(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True)
    logo = models.ImageField(upload_to="brands/", blank=True, null=True)
    website = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


# =============================================================================
# TAG — Many-to-Many with Product (e.g. "organic", "bestseller", "new arrival")
# =============================================================================

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=60, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


# =============================================================================
# PRODUCT — Main product table
# ForeignKey fields (category, brand) → use select_related
# Reverse relations (images, variants) and M2M (tags) → use prefetch_related
# =============================================================================

class Product(models.Model):
    # Core fields
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True)
    description = models.TextField()
    sku = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="SKU",
        help_text="Stock Keeping Unit — unique product identifier",
    )

    # Relationships — select_related targets
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="products",
    )
    brand = models.ForeignKey(
        Brand,
        on_delete=models.CASCADE,
        related_name="products",
    )

    # Relationships — prefetch_related target (M2M)
    tags = models.ManyToManyField(Tag, blank=True, related_name="products")

    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Sale price. Leave blank if no discount.",
    )

    # Inventory
    stock = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["sku"]),
            models.Index(fields=["price"]),
            models.Index(fields=["-created_at"]),
            # Composite index for common filter combinations
            models.Index(fields=["category", "is_active", "price"]),
            models.Index(fields=["brand", "is_active"]),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    @property
    def in_stock(self):
        """Check if product is available for purchase."""
        return self.stock > 0

    @property
    def current_price(self):
        """Return discount price if available, otherwise regular price."""
        return self.discount_price if self.discount_price else self.price

    @property
    def discount_percentage(self):
        """Calculate discount percentage for display."""
        if self.discount_price and self.price > 0:
            return round((1 - self.discount_price / self.price) * 100)
        return 0


# =============================================================================
# PRODUCT IMAGE — Image gallery for each product
# Reverse FK → use prefetch_related when loading with Product
# =============================================================================

class ProductImage(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images",  # prefetch_related target
    )
    image = models.ImageField(upload_to="products/")
    alt_text = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(
        default=False,
        help_text="Primary image shown in product listings",
    )
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["display_order"]

    def __str__(self):
        return f"{self.product.name} — Image {self.display_order}"


# =============================================================================
# PRODUCT VARIANT — Different versions of the same product
# Examples: Apple (500g, 1kg, 2kg) or T-Shirt (Red/S, Red/M, Blue/S)
# Reverse FK → use prefetch_related when loading with Product
# =============================================================================

class ProductVariant(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="variants",  # prefetch_related target
    )
    name = models.CharField(
        max_length=100,
        help_text="Variant label, e.g. '500g', 'Red - Large', 'Pack of 6'",
    )
    sku = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Variant SKU",
    )
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["sku"]),
        ]

    def __str__(self):
        return f"{self.product.name} — {self.name}"

    @property
    def in_stock(self):
        return self.stock > 0
