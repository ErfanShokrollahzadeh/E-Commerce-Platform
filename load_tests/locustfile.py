import random
# pyrefly: ignore [missing-import]
from locust import HttpUser, task, between


class ShopperUser(HttpUser):
    """
    Simulates a typical shopper visiting the E-Commerce Platform.
    Behavior:
    - Browses the product list.
    - Views individual product details.
    - Adds products to their shopping cart (Redis-backed).
    """

    # Wait between 1 and 3 seconds between tasks to simulate reading time
    wait_time = between(1, 3)

    def on_start(self):
        """
        Called when a Locust user starts.
        We initialize an empty list to store known product slugs/ids.
        """
        self.known_products = []
        self.browse_products()  # Fetch products immediately on start

    @task(3)
    def browse_products(self):
        """
        Simulate browsing the main product list.
        Weight = 3 (happens more frequently than viewing details or adding to cart).
        """
        with self.client.get("/api/products/", name="/api/products/", catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                
                # Store product information for subsequent tasks
                for product in results:
                    self.known_products.append({
                        "id": product["id"],
                        "slug": product["slug"],
                    })
                response.success()
            else:
                response.failure(f"Failed to load products: {response.status_code}")

    @task(2)
    def view_product_detail(self):
        """
        Simulate clicking into a product's detail page.
        """
        if not self.known_products:
            return

        # Pick a random product
        product = random.choice(self.known_products)
        slug = product["slug"]

        self.client.get(f"/api/products/{slug}/", name="/api/products/[slug]/")

    @task(1)
    def add_to_cart(self):
        """
        Simulate adding a product to the cart.
        Locust's HttpUser automatically handles the session cookies, 
        so each simulated user gets a unique Redis cart.
        """
        if not self.known_products:
            return

        product = random.choice(self.known_products)
        product_id = product["id"]

        # Randomly choose quantity between 1 and 3
        quantity = random.randint(1, 3)

        payload = {
            "product_id": product_id,
            "quantity": quantity
        }

        self.client.post("/api/cart/add/", json=payload, name="/api/cart/add/")

    @task(1)
    def view_cart(self):
        """
        Simulate opening the cart drawer.
        """
        self.client.get("/api/cart/", name="/api/cart/")
