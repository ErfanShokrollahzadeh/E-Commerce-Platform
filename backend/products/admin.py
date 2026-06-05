"""Products admin configuration — for managing data via Django Admin."""

from django.contrib import admin

from .models import Brand, Category, Product, ProductImage, ProductVariant, Tag


# =============================================================================
# INLINES — Show images and variants inside the Product admin page
# =============================================================================

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ["image", "alt_text", "is_primary", "display_order"]


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1
    fields = ["name", "sku", "price", "stock", "is_active"]


# =============================================================================
# MODEL ADMINS
# =============================================================================

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "parent", "is_active", "created_at"]
    list_filter = ["is_active", "parent"]
    search_fields = ["name"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ["name", "is_active"]
    search_fields = ["name"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ["name", "slug"]
    search_fields = ["name"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["name", "brand", "category", "price", "stock", "is_active", "created_at"]
    list_filter = ["is_active", "brand", "category", "created_at"]
    search_fields = ["name", "sku", "description"]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductImageInline, ProductVariantInline]
    filter_horizontal = ["tags"]

    # Optimize admin list queries too!
    list_select_related = ["category", "brand"]
