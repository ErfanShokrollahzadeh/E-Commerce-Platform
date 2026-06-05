"""
Unit and Integration Tests for Cart Service and Cart Views.
"""

from decimal import Decimal
import redis
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from products.models import Brand, Category, Product
from .services import CartService

User = get_user_model()


class CartTestCase(APITestCase):
    """Test suite for Redis cart service operations and endpoints."""

    def setUp(self):
        # Establish connection to test-wipe Redis keys
        self.redis_client = redis.Redis(
            host=getattr(settings, "REDIS_HOST", "localhost"),
            port=getattr(settings, "REDIS_PORT", 6379),
            db=getattr(settings, "REDIS_DB", 0),
            decode_responses=True,
        )
        self.test_session_id = "test_guest_session_123"
        self.test_user_session_id = "test_user_session_456"

        # Wipe keys before starting test
        self.redis_client.delete(f"cart:{self.test_session_id}")
        self.redis_client.delete(f"cart:{self.test_user_session_id}")

        # Setup test catalog dependencies
        self.category = Category.objects.create(
            name="Electronics",
            slug="electronics",
        )
        self.brand = Brand.objects.create(name="Sony", slug="sony")

        # Create Products with different stock configurations
        self.product_in_stock = Product.objects.create(
            name="PlayStation 5",
            slug="playstation-5",
            sku="PS5-001",
            category=self.category,
            brand=self.brand,
            price=Decimal("499.99"),
            stock=10,
        )

        self.product_low_stock = Product.objects.create(
            name="DualSense Controller",
            slug="dualsense-controller",
            sku="DSC-002",
            category=self.category,
            brand=self.brand,
            price=Decimal("69.99"),
            stock=2,
        )

        self.product_out_of_stock = Product.objects.create(
            name="PSVR2 Headset",
            slug="psvr2-headset",
            sku="PSV-003",
            category=self.category,
            brand=self.brand,
            price=Decimal("549.99"),
            stock=0,
        )

        self.cart_service = CartService()

    def tearDown(self):
        # Wipe keys to keep local Redis instance clean
        self.redis_client.delete(f"cart:{self.test_session_id}")
        self.redis_client.delete(f"cart:{self.test_user_session_id}")

    # =========================================================================
    # SERVICE LAYER TESTS
    # =========================================================================

    def test_service_add_item_success(self):
        """Verifies adding a valid product to cart increases Redis quantity."""
        qty = self.cart_service.add_item(
            self.test_session_id, self.product_in_stock.id, 2
        )
        self.assertEqual(qty, 2)

        # Check raw Redis contents
        raw_cart = self.cart_service.get_cart(self.test_session_id)
        self.assertEqual(raw_cart[self.product_in_stock.id], 2)

    def test_service_add_item_stock_limit(self):
        """Checks adding product exceeding stock limits raises validation errors."""
        # Add exact maximum stock
        self.cart_service.add_item(self.test_session_id, self.product_low_stock.id, 2)

        # Exceed stock limit
        with self.assertRaises(ValidationError):
            self.cart_service.add_item(
                self.test_session_id, self.product_low_stock.id, 1
            )

    def test_service_add_out_of_stock(self):
        """Verifies adding an out-of-stock item raises validation errors."""
        with self.assertRaises(ValidationError):
            self.cart_service.add_item(
                self.test_session_id, self.product_out_of_stock.id, 1
            )

    def test_service_update_quantity(self):
        """Verifies updating quantity sets exact value, and 0 deletes the key."""
        self.cart_service.add_item(self.test_session_id, self.product_in_stock.id, 2)

        # Update to 5
        self.cart_service.update_quantity(
            self.test_session_id, self.product_in_stock.id, 5
        )
        raw_cart = self.cart_service.get_cart(self.test_session_id)
        self.assertEqual(raw_cart[self.product_in_stock.id], 5)

        # Update to 0
        self.cart_service.update_quantity(
            self.test_session_id, self.product_in_stock.id, 0
        )
        raw_cart = self.cart_service.get_cart(self.test_session_id)
        self.assertNotIn(self.product_in_stock.id, raw_cart)

    def test_service_get_cart_details(self):
        """Confirms service correctly aggregates products and computes subtotals."""
        self.cart_service.add_item(self.test_session_id, self.product_in_stock.id, 1)
        self.cart_service.add_item(self.test_session_id, self.product_low_stock.id, 2)

        details = self.cart_service.get_cart_details(self.test_session_id)

        self.assertEqual(details["itemCount"], 3)
        self.assertEqual(
            Decimal(details["total"]),
            self.product_in_stock.price * 1 + self.product_low_stock.price * 2,
        )
        self.assertEqual(len(details["items"]), 2)

    def test_service_merge_carts(self):
        """Ensures guest cart merges successfully into authenticated user cart."""
        guest_key = "test_guest_key"
        user_id = 999
        self.redis_client.delete(f"cart:guest_{guest_key}")
        self.redis_client.delete(f"cart:user_{user_id}")

        self.cart_service.add_item(
            f"guest_{guest_key}", self.product_in_stock.id, 1
        )
        self.cart_service.add_item(
            f"user_{user_id}", self.product_low_stock.id, 1
        )

        # Merge
        self.cart_service.merge_carts(guest_key, user_id)

        # User cart should contain both
        merged_cart = self.cart_service.get_cart(f"user_{user_id}")
        self.assertEqual(merged_cart[self.product_in_stock.id], 1)
        self.assertEqual(merged_cart[self.product_low_stock.id], 1)

        # Guest key should be deleted
        self.assertFalse(self.redis_client.exists(f"cart:guest_{guest_key}"))

        self.redis_client.delete(f"cart:user_{user_id}")

    # =========================================================================
    # API ENDPOINT TESTS
    # =========================================================================

    def test_api_cart_detail_empty(self):
        """GET /api/cart/ on empty session returns initial state."""
        url = reverse("cart:detail")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["items"], [])
        self.assertEqual(response.data["itemCount"], 0)

    def test_api_cart_add_item(self):
        """POST /api/cart/add/ correctly registers item and returns updated cart."""
        url = reverse("cart:add")
        data = {"product_id": self.product_in_stock.id, "quantity": 3}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["itemCount"], 3)
        self.assertEqual(len(response.data["items"]), 1)
        self.assertEqual(
            response.data["items"][0]["productId"], self.product_in_stock.id
        )

    def test_api_cart_update_item(self):
        """PUT /api/cart/update/ sets exact item counts."""
        # First add
        url_add = reverse("cart:add")
        self.client.post(
            url_add,
            {"product_id": self.product_in_stock.id, "quantity": 1},
            format="json",
        )

        # Then update
        url_update = reverse("cart:update")
        data = {"product_id": self.product_in_stock.id, "quantity": 4}
        response = self.client.put(url_update, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["itemCount"], 4)

    def test_api_cart_remove_item(self):
        """DELETE /api/cart/remove/ removes the selected product."""
        # Add item
        url_add = reverse("cart:add")
        self.client.post(
            url_add,
            {"product_id": self.product_in_stock.id, "quantity": 1},
            format="json",
        )

        # Remove
        url_remove = reverse("cart:remove")
        response = self.client.delete(
            url_remove,
            {"product_id": self.product_in_stock.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["itemCount"], 0)

    def test_api_cart_clear(self):
        """DELETE /api/cart/clear/ resets entire cart session."""
        # Add items
        url_add = reverse("cart:add")
        self.client.post(
            url_add,
            {"product_id": self.product_in_stock.id, "quantity": 1},
            format="json",
        )
        self.client.post(
            url_add,
            {"product_id": self.product_low_stock.id, "quantity": 2},
            format="json",
        )

        # Clear
        url_clear = reverse("cart:clear")
        response = self.client.delete(url_clear)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["items"], [])
        self.assertEqual(response.data["itemCount"], 0)
