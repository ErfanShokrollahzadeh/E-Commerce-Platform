"""
Product serializers — converts Django models to JSON for the API.

Serializer hierarchy:
    ProductListSerializer  → lightweight, used for product listing pages
    ProductDetailSerializer → full data, used for single product detail page
"""

from rest_framework import serializers

from .models import Brand, Category, Product, ProductImage, ProductVariant, Tag


# =============================================================================
# NESTED SERIALIZERS (used inside Product serializers)
# =============================================================================

class CategorySerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source="parent.name", read_only=True, default=None)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "parent", "parent_name"]


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ["id", "name", "slug", "logo"]


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "slug"]


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text", "is_primary", "display_order"]


class ProductVariantSerializer(serializers.ModelSerializer):
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProductVariant
        fields = ["id", "name", "sku", "price", "stock", "in_stock", "is_active"]


# =============================================================================
# PRODUCT LIST SERIALIZER — Lightweight for listing pages
# Used when loading 20-50 products at once (e.g. homepage, search results)
# Only includes primary image + essential fields to keep response small
# =============================================================================

class ProductListSerializer(serializers.ModelSerializer):
    # select_related fields — no extra queries
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)

    # Computed properties
    in_stock = serializers.BooleanField(read_only=True)
    current_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    discount_percentage = serializers.IntegerField(read_only=True)

    # Primary image only (not the whole gallery)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "sku",
            "category",
            "brand",
            "price",
            "discount_price",
            "current_price",
            "discount_percentage",
            "stock",
            "in_stock",
            "primary_image",
            "created_at",
        ]

    def get_primary_image(self, obj):
        """Get the primary image URL, or the first image if none is marked primary."""
        # images are already prefetched — no extra query
        images = obj.images.all()
        for img in images:
            if img.is_primary:
                return ProductImageSerializer(img).data
        # Fallback to first image
        if images:
            return ProductImageSerializer(images[0]).data
        return None


# =============================================================================
# PRODUCT DETAIL SERIALIZER — Full data for single product page
# Includes all images, all variants, and tags
# =============================================================================

class ProductDetailSerializer(serializers.ModelSerializer):
    # select_related fields
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)

    # prefetch_related fields
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)

    # Computed properties
    in_stock = serializers.BooleanField(read_only=True)
    current_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    discount_percentage = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "sku",
            "description",
            "category",
            "brand",
            "tags",
            "price",
            "discount_price",
            "current_price",
            "discount_percentage",
            "stock",
            "in_stock",
            "images",
            "variants",
            "is_active",
            "created_at",
            "updated_at",
        ]
