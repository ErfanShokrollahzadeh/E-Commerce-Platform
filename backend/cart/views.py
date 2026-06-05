"""
Cart API Views — Django REST Framework endpoints for the Redis cart.
"""

from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import CartService


def get_cart_session_id(request) -> str:
    """
    Generate or retrieve a unique session-based key for the cart.
    Returns:
        'user_{id}' for authenticated users.
        'guest_{session_key}' for guest users.
    """
    if request.user.is_authenticated:
        return f"user_{request.user.id}"

    # Ensure a session exists in the database/cookies
    if not request.session.session_key:
        request.session.create()

    return f"guest_{request.session.session_key}"


class CartDetailView(APIView):
    """
    GET /api/cart/
    Retrieve the detailed cart contents for the current session.
    """

    def get(self, request, *args, **kwargs):
        session_id = get_cart_session_id(request)
        cart_details = CartService().get_cart_details(session_id)
        return Response(cart_details, status=status.HTTP_200_OK)


class CartAddItemView(APIView):
    """
    POST /api/cart/add/
    Add a product to the cart.
    Expected Body:
        {
            "product_id": int,
            "quantity": int (optional, default 1)
        }
    """

    def post(self, request, *args, **kwargs):
        product_id = request.data.get("product_id")
        quantity = request.data.get("quantity", 1)

        if not product_id:
            return Response(
                {"detail": "product_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            product_id = int(product_id)
            quantity = int(quantity)
        except ValueError:
            return Response(
                {"detail": "product_id and quantity must be integers."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session_id = get_cart_session_id(request)
        cart_service = CartService()

        try:
            cart_service.add_item(session_id, product_id, quantity)
        except (ValidationError, ValueError) as e:
            message = e.messages[0] if hasattr(e, "messages") else str(e)
            return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)

        # Return the updated cart details so the frontend can sync in 1 request
        cart_details = cart_service.get_cart_details(session_id)
        return Response(cart_details, status=status.HTTP_200_OK)


class CartUpdateItemView(APIView):
    """
    PUT /api/cart/update/
    Update the exact quantity of a product in the cart.
    Expected Body:
        {
            "product_id": int,
            "quantity": int
        }
    """

    def put(self, request, *args, **kwargs):
        product_id = request.data.get("product_id")
        quantity = request.data.get("quantity")

        if product_id is None or quantity is None:
            return Response(
                {"detail": "Both product_id and quantity are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            product_id = int(product_id)
            quantity = int(quantity)
        except ValueError:
            return Response(
                {"detail": "product_id and quantity must be integers."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session_id = get_cart_session_id(request)
        cart_service = CartService()

        try:
            cart_service.update_quantity(session_id, product_id, quantity)
        except (ValidationError, ValueError) as e:
            message = e.messages[0] if hasattr(e, "messages") else str(e)
            return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)

        cart_details = cart_service.get_cart_details(session_id)
        return Response(cart_details, status=status.HTTP_200_OK)


class CartRemoveItemView(APIView):
    """
    DELETE /api/cart/remove/
    Remove a product entirely from the cart.
    Expected Body:
        {
            "product_id": int
        }
    """

    def delete(self, request, *args, **kwargs):
        product_id = request.data.get("product_id")

        if not product_id:
            return Response(
                {"detail": "product_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            product_id = int(product_id)
        except ValueError:
            return Response(
                {"detail": "product_id must be an integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session_id = get_cart_session_id(request)
        cart_service = CartService()
        cart_service.remove_item(session_id, product_id)

        cart_details = cart_service.get_cart_details(session_id)
        return Response(cart_details, status=status.HTTP_200_OK)


class CartClearView(APIView):
    """
    DELETE /api/cart/clear/
    Clear all items in the cart.
    """

    def delete(self, request, *args, **kwargs):
        session_id = get_cart_session_id(request)
        cart_service = CartService()
        cart_service.clear_cart(session_id)

        cart_details = cart_service.get_cart_details(session_id)
        return Response(cart_details, status=status.HTTP_200_OK)
