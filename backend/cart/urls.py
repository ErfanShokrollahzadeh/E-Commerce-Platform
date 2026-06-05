"""Cart app URL configuration."""

from django.urls import path

from .views import (
    CartAddItemView,
    CartClearView,
    CartDetailView,
    CartRemoveItemView,
    CartUpdateItemView,
)

app_name = "cart"

urlpatterns = [
    path("", CartDetailView.as_view(), name="detail"),
    path("add/", CartAddItemView.as_view(), name="add"),
    path("update/", CartUpdateItemView.as_view(), name="update"),
    path("remove/", CartRemoveItemView.as_view(), name="remove"),
    path("clear/", CartClearView.as_view(), name="clear"),
]
