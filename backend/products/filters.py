"""
Product filters — Advanced filtering with django-filter.

Usage examples (query params):
    /api/products/?min_price=50&max_price=200        → Price range
    /api/products/?brand=nike                        → Filter by brand slug
    /api/products/?category=electronics              → Filter by category slug
    /api/products/?in_stock=true                     → Only in-stock products
    /api/products/?has_discount=true                 → Only discounted products
    /api/products/?search=wireless headphones        → Text search in name/description
    /api/products/?ordering=-price                   → Sort by price descending
    /api/products/?tags=bestseller,new-arrival       → Filter by tag slugs

All filters can be combined:
    /api/products/?category=phones&brand=apple&min_price=500&in_stock=true&ordering=price
"""

import django_filters

from .models import Product


class ProductFilter(django_filters.FilterSet):
    """
    Advanced product filter set.
    Each filter maps to a query parameter in the URL.
    """

    # ── Price range filters ──────────────────────────────────────────────
    min_price = django_filters.NumberFilter(
        field_name="price",
        lookup_expr="gte",
        label="Minimum price",
    )
    max_price = django_filters.NumberFilter(
        field_name="price",
        lookup_expr="lte",
        label="Maximum price",
    )

    # ── Relationship filters (by slug for clean URLs) ────────────────────
    category = django_filters.CharFilter(
        field_name="category__slug",
        lookup_expr="exact",
        label="Category slug",
    )
    brand = django_filters.CharFilter(
        field_name="brand__slug",
        lookup_expr="exact",
        label="Brand slug",
    )
    tags = django_filters.CharFilter(
        method="filter_by_tags",
        label="Tag slugs (comma-separated)",
    )

    # ── Boolean / computed filters ───────────────────────────────────────
    in_stock = django_filters.BooleanFilter(
        method="filter_in_stock",
        label="In stock only",
    )
    has_discount = django_filters.BooleanFilter(
        method="filter_has_discount",
        label="Has discount",
    )

    class Meta:
        model = Product
        fields = [
            "min_price",
            "max_price",
            "category",
            "brand",
            "tags",
            "in_stock",
            "has_discount",
        ]

    # ── Custom filter methods ────────────────────────────────────────────

    def filter_in_stock(self, queryset, name, value):
        """Filter products that have stock > 0."""
        if value is True:
            return queryset.filter(stock__gt=0)
        elif value is False:
            return queryset.filter(stock=0)
        return queryset

    def filter_has_discount(self, queryset, name, value):
        """Filter products that have a discount price set."""
        if value is True:
            return queryset.filter(discount_price__isnull=False)
        elif value is False:
            return queryset.filter(discount_price__isnull=True)
        return queryset

    def filter_by_tags(self, queryset, name, value):
        """
        Filter by multiple tag slugs (comma-separated).
        Example: ?tags=bestseller,organic → products with ANY of those tags
        """
        if value:
            tag_slugs = [slug.strip() for slug in value.split(",")]
            return queryset.filter(tags__slug__in=tag_slugs).distinct()
        return queryset
