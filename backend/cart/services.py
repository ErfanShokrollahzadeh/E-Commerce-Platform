"""
Cart Service — Handles Redis-backed shopping cart actions.
Uses Redis Hash maps to store items for both guest and authenticated users.
"""

import logging
from django.conf import settings
from django.core.exceptions import ValidationError
import redis

from products.models import Product

logger = logging.getLogger(__name__)


class CartService:
    """
    Manages cart data in Redis.
    Structure:
        Key: cart:<session_id>
        Type: Redis Hash (HSET)
        Field: product_id
        Value: quantity
    """

    def __init__(self):
        # Retrieve Redis configuration from settings with fallbacks
        host = getattr(settings, "REDIS_HOST", "localhost")
        port = getattr(settings, "REDIS_PORT", 6379)
        db = getattr(settings, "REDIS_DB", 0)
        self.ttl = getattr(settings, "CART_TTL", 60 * 60 * 24 * 7)  # Default: 7 days

        # We set decode_responses=True to automatically get strings instead of bytes
        self.redis = redis.Redis(
            host=host,
            port=port,
            db=db,
            decode_responses=True,
        )
        self.prefix = "cart:"

    def _get_key(self, session_id: str) -> str:
        """Generate Redis key for the session."""
        return f"{self.prefix}{session_id}"

    def add_item(self, session_id: str, product_id: int, quantity: int = 1) -> int:
        """
        Adds (increments) a product quantity in the Redis cart.
        Validates product existence and stock availability.
        """
        if quantity <= 0:
            raise ValueError("Quantity must be greater than zero.")

        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            raise ValidationError("Product does not exist or is inactive.")

        if product.stock <= 0:
            raise ValidationError("Product is currently out of stock.")

        key = self._get_key(session_id)
        current_qty = self.redis.hget(key, str(product_id))
        new_qty = int(current_qty or 0) + quantity

        # Enforce stock limits
        if new_qty > product.stock:
            raise ValidationError(
                f"Cannot add {quantity} more. Stock limit reached (Max: {product.stock})."
            )

        self.redis.hset(key, str(product_id), new_qty)
        self.redis.expire(key, self.ttl)
        return new_qty

    def update_quantity(self, session_id: str, product_id: int, quantity: int) -> int:
        """
        Sets the exact quantity of a product in the Redis cart.
        If quantity is 0 or less, the product is removed.
        """
        if quantity <= 0:
            self.remove_item(session_id, product_id)
            return 0

        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            raise ValidationError("Product does not exist or is inactive.")

        # Enforce stock limits
        if quantity > product.stock:
            raise ValidationError(
                f"Cannot set quantity to {quantity}. Stock limit reached (Max: {product.stock})."
            )

        key = self._get_key(session_id)
        self.redis.hset(key, str(product_id), quantity)
        self.redis.expire(key, self.ttl)
        return quantity

    def remove_item(self, session_id: str, product_id: int) -> bool:
        """Removes a product from the Redis cart."""
        key = self._get_key(session_id)
        result = self.redis.hdel(key, str(product_id))
        return bool(result)

    def clear_cart(self, session_id: str) -> bool:
        """Deletes the cart key in Redis."""
        key = self._get_key(session_id)
        result = self.redis.delete(key)
        return bool(result)

    def get_cart(self, session_id: str) -> dict[int, int]:
        """Returns the raw cart data mapping product_id -> quantity."""
        key = self._get_key(session_id)
        cart_data = self.redis.hgetall(key)
        # Convert keys and values back to integers
        return {int(k): int(v) for k, v in cart_data.items()}

    def get_cart_details(self, session_id: str) -> dict:
        """
        Fetches the products in the cart from the DB in a query-optimized manner,
        validates stock, and returns a detailed serialized cart representation.
        """
        raw_cart = self.get_cart(session_id)
        if not raw_cart:
            return {
                "items": [],
                "total": "0.00",
                "itemCount": 0,
            }

        product_ids = list(raw_cart.keys())

        # Optimize DB access: fetch products with category, brand and prefetch images in 2 queries
        products = (
            Product.objects.filter(id__in=product_ids, is_active=True)
            .select_related("category", "brand")
            .prefetch_related("images")
        )

        items = []
        total_price = 0.00
        total_count = 0

        # Create lookup dict for products
        product_map = {p.id: p for p in products}

        # Scan raw_cart to maintain order or handle invalid products
        for pid, qty in raw_cart.items():
            product = product_map.get(pid)
            if not product:
                # Cleanup orphaned or deactivated products from the Redis cart
                self.remove_item(session_id, pid)
                continue

            # Verify if current cart quantity exceeds available stock and auto-adjust if necessary
            if qty > product.stock:
                qty = product.stock
                if qty > 0:
                    self.update_quantity(session_id, pid, qty)
                else:
                    self.remove_item(session_id, pid)
                    continue

            # Locate the primary image or first available image
            image_url = None
            product_images = list(product.images.all())
            for img in product_images:
                if img.is_primary:
                    image_url = img.image.url
                    break
            if not image_url and product_images:
                image_url = product_images[0].image.url

            subtotal = product.current_price * qty
            total_price += float(subtotal)
            total_count += qty

            items.append({
                "productId": product.id,
                "name": product.name,
                "price": str(product.current_price),
                "quantity": qty,
                "image": image_url,
                "subtotal": str(subtotal),
                "stock": product.stock,
                "inStock": product.in_stock,
            })

        return {
            "items": items,
            "total": f"{total_price:.2f}",
            "itemCount": total_count,
        }

    def merge_carts(self, guest_session_key: str, user_id: int) -> None:
        """
        Merges guest cart contents into the authenticated user's cart.
        Then removes the guest cart key from Redis.
        """
        guest_session_id = f"guest_{guest_session_key}"
        user_session_id = f"user_{user_id}"

        guest_cart = self.get_cart(guest_session_id)
        if not guest_cart:
            return

        for pid, qty in guest_cart.items():
            try:
                # Enforce stock limits during merge
                self.add_item(user_session_id, pid, qty)
            except (ValidationError, ValueError) as e:
                # Log warning and set cart to maximum possible stock if there was an issue
                logger.warning(
                    "Stock verification failed during merging cart item %s: %s",
                    pid,
                    str(e),
                )
                try:
                    product = Product.objects.get(id=pid, is_active=True)
                    if product.stock > 0:
                        self.update_quantity(user_session_id, pid, product.stock)
                except Product.DoesNotExist:
                    pass

        # Cleanup guest cart
        self.clear_cart(guest_session_id)
