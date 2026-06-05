"""
Product views — Phase 1: Query Optimization

N+1 PROBLEM EXPLAINED:
    Without optimization, loading 50 products does:
        1 query  → fetch 50 products
        50 queries → fetch category for each product     (N+1!)
        50 queries → fetch brand for each product        (N+1!)
        50 queries → fetch images for each product       (N+1!)
        = 151 queries total  💀

    WITH select_related + prefetch_related:
        1 query → fetch 50 products WITH category and brand (JOIN)
        1 query → fetch ALL images for those 50 products (batched)
        1 query → fetch ALL variants for those 50 products (batched)
        = 3 queries total  🚀

    That's a 50x reduction in database queries.

HOW IT WORKS:
    select_related("category", "brand")
        → Performs a SQL JOIN, fetching related objects in the SAME query
        → Use for ForeignKey and OneToOneField
        → Product.category and Product.brand are loaded instantly

    prefetch_related("images", "variants", "tags")
        → Performs a SEPARATE query for each relation, then Python joins them
        → Use for ManyToManyField and reverse ForeignKey
        → Product.images.all() returns cached data, no DB hit
"""

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, filters

from .models import Product
from .serializers import ProductListSerializer, ProductDetailSerializer
from .filters import ProductFilter


# =============================================================================
# PRODUCT LIST VIEW — Optimized for listing 20-50 products per page
# =============================================================================

class ProductListView(generics.ListAPIView):
    """
    GET /api/products/

    Returns a paginated list of active products with filters.

    Query optimization:
        - select_related("category", "brand")  → 1 query with JOINs
        - prefetch_related("images")           → 1 batched query for images

    Filter examples:
        /api/products/?min_price=50&max_price=200
        /api/products/?brand=nike&in_stock=true
        /api/products/?category=electronics&ordering=-price
        /api/products/?search=wireless headphones
    """
    serializer_class = ProductListSerializer
    filterset_class = ProductFilter

    # DjangoFilterBackend MUST be included for filterset_class to work
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    search_fields = ["name", "description", "sku", "brand__name"]
    ordering_fields = ["price", "created_at", "name"]
    ordering = ["-created_at"]  # Default ordering

    def get_queryset(self):
        """
        Optimized queryset that solves the N+1 problem.

        Without this: 50 products = 151 queries
        With this:    50 products = 3 queries
        """
        return (
            Product.objects
            .filter(is_active=True)
            # ── select_related: JOIN in single query ──
            # Loads category and brand data alongside each product
            .select_related("category", "brand")
            # ── prefetch_related: batched separate query ──
            # Loads ALL images for ALL products in one query
            .prefetch_related("images")
        )


# =============================================================================
# PRODUCT DETAIL VIEW — Full product data for a single product page
# =============================================================================

class ProductDetailView(generics.RetrieveAPIView):
    """
    GET /api/products/<slug>/

    Returns full product detail including all images, variants, and tags.

    Query optimization:
        - select_related("category", "brand")                    → 1 JOIN query
        - prefetch_related("images", "variants", "tags")         → 3 batched queries
        Total: 4 queries regardless of how many images/variants exist
    """
    serializer_class = ProductDetailSerializer
    lookup_field = "slug"

    def get_queryset(self):
        """
        Optimized queryset for detail view.
        Loads everything needed in exactly 4 queries.
        """
        return (
            Product.objects
            .filter(is_active=True)
            # ── select_related: ForeignKey fields ──
            .select_related("category", "brand")
            # ── prefetch_related: reverse FK + M2M ──
            .prefetch_related("images", "variants", "tags")
        )


# =============================================================================
# CATEGORY-BASED PRODUCT LIST — Products filtered by category
# =============================================================================

class CategoryProductListView(generics.ListAPIView):
    """
    GET /api/products/category/<slug>/

    Returns all products in a specific category.
    Uses the same optimizations as the main product list.
    """
    serializer_class = ProductListSerializer
    filterset_class = ProductFilter
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    search_fields = ["name", "description", "sku"]
    ordering_fields = ["price", "created_at", "name"]
    ordering = ["-created_at"]

    def get_queryset(self):
        category_slug = self.kwargs["category_slug"]
        return (
            Product.objects
            .filter(is_active=True, category__slug=category_slug)
            .select_related("category", "brand")
            .prefetch_related("images")
        )
