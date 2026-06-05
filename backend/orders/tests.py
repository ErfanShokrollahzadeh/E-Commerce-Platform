"""
Unit and Integration Tests for Orders App.
"""

from decimal import Decimal
import redis
from django.conf import settings
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from cart.services import CartService
from products.models import Brand, Category, Product
from orders.models import Order, OrderItem

User = get_user_model()


class OrdersTestCase(APITestCase):
    """Test suite for Checkout API transactional integrity, stock changes, and security permissions."""

    def setUp(self):
        # Establish Redis connection
        self.redis_client = redis.Redis(
            host=getattr(settings, "REDIS_HOST", "localhost"),
            port=getattr(settings, "REDIS_PORT", 6379),
            db=getattr(settings, "REDIS_DB", 0),
            decode_responses=True,
        )
        self.cart_service = CartService()

        # Users
        self.user1 = User.objects.create_user(
            username="alice", email="alice@example.com", password="password123"
        )
        self.user2 = User.objects.create_user(
            username="bob", email="bob@example.com", password="password123"
        )

        # Setup catalog dependencies
        self.category = Category.objects.create(
            name="Groceries", slug="groceries"
        )
        self.brand = Brand.objects.create(name="Chiquita", slug="chiquita")

        # Products with known stock
        self.banana = Product.objects.create(
            name="Organic Banana",
            slug="organic-banana",
            sku="BAN-001",
            category=self.category,
            brand=self.brand,
            price=Decimal("1.99"),
            stock=15,
        )

        self.orange = Product.objects.create(
            name="Juicy Orange",
            slug="juicy-orange",
            sku="ORN-002",
            category=self.category,
            brand=self.brand,
            price=Decimal("0.99"),
            stock=5,
        )

        # Base billing info
        self.checkout_data = {
            "first_name": "John",
            "last_name": "Doe",
            "email": "johndoe@example.com",
            "phone": "+1234567890",
            "address": "123 Main St",
            "city": "Metropolis",
            "postal_code": "12345",
        }

    def tearDown(self):
        # Clean up keys for the users/sessions
        session_key = self.client.session.session_key
        if session_key:
            self.redis_client.delete(f"cart:guest_{session_key}")

        self.redis_client.delete(f"cart:user_{self.user1.id}")
        self.redis_client.delete(f"cart:user_{self.user2.id}")

    # =========================================================================
    # CHECKOUT INTEGRATION TESTS
    # =========================================================================

    def test_checkout_success(self):
        """Verifies a successful checkout session creates order, updates stock, and clears Redis."""
        # 1. Establish guest session by hitting detail endpoint
        self.client.get(reverse("cart:detail"))
        session_key = self.client.session.session_key
        self.assertTrue(session_key)

        # 2. Add items to Redis guest cart
        self.cart_service.add_item(f"guest_{session_key}", self.banana.id, 5)
        self.cart_service.add_item(f"guest_{session_key}", self.orange.id, 2)

        # Verify items exist in Redis
        cart_data = self.cart_service.get_cart(f"guest_{session_key}")
        self.assertEqual(len(cart_data), 2)

        # 3. Post Checkout Data
        url = reverse("orders:create")
        response = self.client.post(url, self.checkout_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 4. Verify Order records in database
        order = Order.objects.get(id=response.data["id"])
        self.assertEqual(order.first_name, "John")
        self.assertEqual(order.session_key, session_key)
        self.assertNil = order.user

        # Total cost: 1.99 * 5 + 0.99 * 2 = 9.95 + 1.98 = 11.93
        self.assertEqual(order.total_price, Decimal("11.93"))

        # Verify OrderItems
        order_items = order.items.all()
        self.assertEqual(order_items.count(), 2)

        banana_item = order_items.get(product=self.banana)
        self.assertEqual(banana_item.product_name, self.banana.name)
        self.assertEqual(banana_item.price, Decimal("1.99"))
        self.assertEqual(banana_item.quantity, 5)

        # 5. Verify Stocks are decremented
        self.banana.refresh_from_db()
        self.orange.refresh_from_db()
        self.assertEqual(self.banana.stock, 10)  # 15 - 5
        self.assertEqual(self.orange.stock, 3)  # 5 - 2

        # 6. Verify Redis cart is cleared
        self.assertFalse(
            self.redis_client.exists(f"cart:guest_{session_key}")
        )

    def test_checkout_empty_cart_fails(self):
        """Verifies checkout fails when there are no items in cart."""
        url = reverse("orders:create")
        response = self.client.post(url, self.checkout_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.data)

    def test_checkout_insufficient_stock_rollback(self):
        """Checks transaction rollback when stock is insufficient during checkout."""
        # 1. Setup session
        self.client.get(reverse("cart:detail"))
        session_key = self.client.session.session_key

        # 2. Add item to cart that has more quantity than stock (simulated if stock changes, or we manually add it)
        # We can bypass CartService stock validation during initial add by adding up to stock, then modifying stock in DB
        self.cart_service.add_item(f"guest_{session_key}", self.orange.id, 5)

        # Suddenly change stock in DB to 2 (simulate parallel sales)
        self.orange.stock = 2
        self.orange.save()

        # 3. Post Checkout Data
        url = reverse("orders:create")
        response = self.client.post(url, self.checkout_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        error_msg = str(response.data)
        self.assertIn("Insufficient stock", error_msg)

        # 4. Verify no Order or OrderItem is created
        self.assertEqual(Order.objects.count(), 0)
        self.assertEqual(OrderItem.objects.count(), 0)

        # 5. Verify stock was not decremented further
        self.orange.refresh_from_db()
        self.assertEqual(self.orange.stock, 2)

        # 6. Verify Redis cart is NOT cleared
        self.assertTrue(
            self.redis_client.exists(f"cart:guest_{session_key}")
        )

    # =========================================================================
    # SECURITY & ACCESS SCOPES
    # =========================================================================

    def test_order_detail_authenticated_scopes(self):
        """Verifies user can only retrieve their own orders."""
        # Create order for user1
        order = Order.objects.create(
            user=self.user1,
            total_price=Decimal("10.00"),
            **self.checkout_data,
        )

        # Test authenticated as user1 (Authorized)
        self.client.force_authenticate(user=self.user1)
        url = reverse("orders:detail", kwargs={"pk": order.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Test authenticated as user2 (Unauthorized/Not Found)
        self.client.force_authenticate(user=self.user2)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_order_detail_guest_scopes(self):
        """Verifies anonymous user can view their order using session keys."""
        # Create order for guest session
        session_key = "guest_session_xyz"
        order = Order.objects.create(
            session_key=session_key,
            total_price=Decimal("10.00"),
            **self.checkout_data,
        )

        url = reverse("orders:detail", kwargs={"pk": order.id})

        # Request without matching session key (Not Found)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Set matching session key on the client session
        session = self.client.session
        session.save()  # Make sure session_key exists
        # In Django test clients, session is loaded from database. We can update order to match active test client session key
        active_session_key = self.client.session.session_key
        order.session_key = active_session_key
        order.save()

        # Request again (Success)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], order.id)
