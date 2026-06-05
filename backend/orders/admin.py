"""
Admin registration for Orders app.
Includes a TabularInline editor for OrderItems directly within the Order page.
"""

from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    """Allows editing order items inside the Order edit page."""

    model = OrderItem
    raw_id_fields = ["product"]
    extra = 0
    readonly_fields = ["product_name", "price", "total_cost"]

    def total_cost(self, obj):
        return obj.total_cost

    total_cost.short_description = "Total Cost"


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """Custom admin dashboard settings for Orders."""

    list_display = [
        "id",
        "first_name",
        "last_name",
        "email",
        "total_price",
        "status",
        "created_at",
    ]
    list_filter = ["status", "created_at"]
    search_fields = ["id", "first_name", "last_name", "email", "phone"]
    readonly_fields = ["created_at", "updated_at", "total_price"]
    inlines = [OrderItemInline]
    date_hierarchy = "created_at"

    # Action to mark orders as Paid/Shipped in bulk
    actions = ["mark_as_paid", "mark_as_shipped"]

    def mark_as_paid(self, request, queryset):
        queryset.update(status="PAID")

    mark_as_paid.short_description = "Mark selected orders as Paid"

    def mark_as_shipped(self, request, queryset):
        queryset.update(status="SHIPPED")

    mark_as_shipped.short_description = "Mark selected orders as Shipped"
