"""Orders app URL configuration."""

from django.urls import path

from .views import OrderCreateView, OrderDetailView

app_name = "orders"

urlpatterns = [
    path("", OrderCreateView.as_view(), name="create"),
    path("<int:pk>/", OrderDetailView.as_view(), name="detail"),
]
