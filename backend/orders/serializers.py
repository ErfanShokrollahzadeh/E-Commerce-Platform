"""
Order Serializers — Handles conversion of Order models to JSON and validation of checkout inputs.
"""

from rest_framework import serializers

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializes individual items ordered by a client."""

    total_cost = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "price",
            "quantity",
            "total_cost",
        ]


class OrderDetailSerializer(serializers.ModelSerializer):
    """Detailed Order serializer including nested order line items."""

    items = OrderItemSerializer(many=True, read_only=True)
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "user",
            "first_name",
            "last_name",
            "email",
            "phone",
            "address",
            "city",
            "postal_code",
            "total_price",
            "status",
            "created_at",
            "updated_at",
            "items",
        ]


class OrderCreateSerializer(serializers.ModelSerializer):
    """
    Serializer used to validate customer billing/shipping details
    during order placement. Total price and items are computed server-side from Redis.
    """

    class Meta:
        model = Order
        fields = [
            "first_name",
            "last_name",
            "email",
            "phone",
            "address",
            "city",
            "postal_code",
        ]

    def validate_phone(self, value):
        """Basic validation for phone number."""
        # Clean white spaces and verify numeric characters
        cleaned = "".join(value.split())
        if not cleaned.replace("+", "").isdigit() or len(cleaned) < 7:
            raise serializers.ValidationError("Please provide a valid phone number.")
        return value
