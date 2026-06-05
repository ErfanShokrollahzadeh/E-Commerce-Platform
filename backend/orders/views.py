"""
Order Views — Django REST Framework endpoints for placing and retrieving orders.
Uses transaction blocks to guarantee atomic checkout states.
"""

from django.db import transaction
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from cart.services import CartService
from cart.views import get_cart_session_id
from products.models import Product
from .models import Order, OrderItem
from .serializers import OrderCreateSerializer, OrderDetailSerializer


class OrderCreateView(generics.CreateAPIView):
    """
    POST /api/orders/
    Place a new order. Reads cart items from Redis, verifies stock inside
    an atomic transaction block, updates database tables, and clears Redis.
    """

    serializer_class = OrderCreateSerializer

    def create(self, request, *args, **kwargs):
        # Validate billing/shipping information first
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session_id = get_cart_session_id(request)
        cart_service = CartService()
        cart_items = cart_service.get_cart(session_id)

        if not cart_items:
            return Response(
                {"detail": "Your cart is empty. Cannot checkout."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Open atomic database transaction
            with transaction.atomic():
                product_ids = list(cart_items.keys())

                # select_for_update() locks product rows in the database to prevent double-sell race conditions
                products = Product.objects.select_for_update().filter(id__in=product_ids)
                product_map = {p.id: p for p in products}

                total_price = 0
                order_items_data = []

                # Verify each item in the cart
                for pid, qty in cart_items.items():
                    product = product_map.get(pid)

                    if not product or not product.is_active:
                        raise ValidationError(
                            f"Product with ID {pid} is no longer available."
                        )

                    # Verify stock level
                    if qty > product.stock:
                        raise ValidationError(
                            f"Insufficient stock for product '{product.name}'. "
                            f"Available: {product.stock}, Requested: {qty}."
                        )

                    # Deduct stock
                    product.stock -= qty
                    product.save()

                    # Record transaction totals
                    price_at_purchase = product.current_price
                    total_price += price_at_purchase * qty

                    order_items_data.append({
                        "product": product,
                        "product_name": product.name,
                        "price": price_at_purchase,
                        "quantity": qty,
                    })

                # Create Order object
                order = serializer.save(
                    user=request.user if request.user.is_authenticated else None,
                    session_key=request.session.session_key,
                    total_price=total_price,
                )

                # Bulk insert all OrderItems for efficiency
                OrderItem.objects.bulk_create([
                    OrderItem(
                        order=order,
                        product=item["product"],
                        product_name=item["product_name"],
                        price=item["price"],
                        quantity=item["quantity"],
                    )
                    for item in order_items_data
                ])

            # Transaction committed successfully -> Clear Redis cart
            cart_service.clear_cart(session_id)

            # Return full enriched order details
            response_serializer = OrderDetailSerializer(order)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            # Transaction automatically rolls back on DRF ValidationErrors
            raise e
        except Exception as e:
            # Catch other DB or system errors and rollback
            return Response(
                {"detail": f"An error occurred during checkout: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class OrderDetailView(generics.RetrieveAPIView):
    """
    GET /api/orders/<int:pk>/
    Retrieve order details. Authenticated users can retrieve their own orders.
    Anonymous users can retrieve orders matching their active session.
    """

    serializer_class = OrderDetailSerializer

    def get_queryset(self):
        """
        Secure query scoping: ensures users can only view their own orders.
        """
        user = self.request.user
        if user.is_authenticated:
            return Order.objects.filter(user=user).prefetch_related("items__product")

        session_key = self.request.session.session_key
        if session_key:
            return Order.objects.filter(session_key=session_key).prefetch_related(
                "items__product"
            )

        return Order.objects.none()
