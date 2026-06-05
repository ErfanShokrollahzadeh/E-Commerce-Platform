"""
Products app URL configuration.

Endpoints:
    GET /api/products/                        → Product list (filtered, paginated)
    GET /api/products/<slug>/                 → Product detail
    GET /api/products/category/<slug>/        → Products by category
"""

from django.urls import path

from .views import ProductListView, ProductDetailView, CategoryProductListView

app_name = "products"

urlpatterns = [
    path("", ProductListView.as_view(), name="product-list"),
    path("<slug:slug>/", ProductDetailView.as_view(), name="product-detail"),
    path(
        "category/<slug:category_slug>/",
        CategoryProductListView.as_view(),
        name="category-products",
    ),
]
