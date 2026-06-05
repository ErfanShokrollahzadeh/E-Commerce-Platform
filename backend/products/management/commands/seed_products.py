"""
Seed script — populates the database with sample products for testing.
Run with: python manage.py seed_products
"""

from django.core.management.base import BaseCommand

from products.models import Brand, Category, Product, ProductImage, ProductVariant, Tag


class Command(BaseCommand):
    help = "Seed the database with sample product data for development"

    def handle(self, *args, **options):
        self.stdout.write("Seeding database...")

        # ── Categories ───────────────────────────────────────────────────
        electronics = Category.objects.create(name="Electronics", slug="electronics")
        phones = Category.objects.create(name="Phones", slug="phones", parent=electronics)
        laptops = Category.objects.create(name="Laptops", slug="laptops", parent=electronics)
        clothing = Category.objects.create(name="Clothing", slug="clothing")
        shoes = Category.objects.create(name="Shoes", slug="shoes", parent=clothing)
        food = Category.objects.create(name="Food & Grocery", slug="food-grocery")
        fruits = Category.objects.create(name="Fruits", slug="fruits", parent=food)

        self.stdout.write(f"  ✓ Created {Category.objects.count()} categories")

        # ── Brands ───────────────────────────────────────────────────────
        apple = Brand.objects.create(name="Apple", slug="apple", website="https://apple.com")
        samsung = Brand.objects.create(name="Samsung", slug="samsung", website="https://samsung.com")
        nike = Brand.objects.create(name="Nike", slug="nike", website="https://nike.com")
        fresh_farm = Brand.objects.create(name="Fresh Farm", slug="fresh-farm")
        lenovo = Brand.objects.create(name="Lenovo", slug="lenovo", website="https://lenovo.com")

        self.stdout.write(f"  ✓ Created {Brand.objects.count()} brands")

        # ── Tags ─────────────────────────────────────────────────────────
        bestseller = Tag.objects.create(name="Bestseller", slug="bestseller")
        new_arrival = Tag.objects.create(name="New Arrival", slug="new-arrival")
        organic = Tag.objects.create(name="Organic", slug="organic")
        sale = Tag.objects.create(name="On Sale", slug="on-sale")
        premium = Tag.objects.create(name="Premium", slug="premium")

        self.stdout.write(f"  ✓ Created {Tag.objects.count()} tags")

        # ── Products ─────────────────────────────────────────────────────

        # Product 1: iPhone
        iphone = Product.objects.create(
            name="iPhone 16 Pro Max",
            slug="iphone-16-pro-max",
            description="The most advanced iPhone ever with A18 Pro chip, 48MP camera system, and titanium design.",
            sku="APPL-IPH16PM",
            category=phones,
            brand=apple,
            price=1199.99,
            discount_price=1099.99,
            stock=25,
        )
        iphone.tags.add(bestseller, premium)

        # Product 2: Samsung Galaxy
        galaxy = Product.objects.create(
            name="Samsung Galaxy S25 Ultra",
            slug="samsung-galaxy-s25-ultra",
            description="Powered by Snapdragon 8 Elite, featuring a 200MP camera and S Pen integration.",
            sku="SAM-GS25U",
            category=phones,
            brand=samsung,
            price=1299.99,
            stock=18,
        )
        galaxy.tags.add(new_arrival, premium)

        # Product 3: MacBook
        macbook = Product.objects.create(
            name="MacBook Pro 16-inch M4 Max",
            slug="macbook-pro-16-m4-max",
            description="Supercharged by M4 Max with up to 128GB unified memory. The most powerful MacBook Pro ever.",
            sku="APPL-MBP16M4",
            category=laptops,
            brand=apple,
            price=3499.99,
            discount_price=3199.99,
            stock=8,
        )
        macbook.tags.add(premium)

        # Product 4: Lenovo ThinkPad
        thinkpad = Product.objects.create(
            name="Lenovo ThinkPad X1 Carbon Gen 12",
            slug="lenovo-thinkpad-x1-carbon-gen12",
            description="Ultra-lightweight business laptop with Intel Core Ultra 7, 14-inch 2.8K OLED display.",
            sku="LEN-X1C12",
            category=laptops,
            brand=lenovo,
            price=1849.99,
            discount_price=1649.99,
            stock=12,
        )
        thinkpad.tags.add(bestseller, sale)

        # Product 5: Nike Air Max (with variants)
        airmax = Product.objects.create(
            name="Nike Air Max 90",
            slug="nike-air-max-90",
            description="Iconic running shoe with visible Air cushioning and classic design that never goes out of style.",
            sku="NIKE-AM90",
            category=shoes,
            brand=nike,
            price=129.99,
            discount_price=99.99,
            stock=50,
        )
        airmax.tags.add(bestseller, sale)

        # Product 6: Organic Apples (with weight variants)
        apples = Product.objects.create(
            name="Organic Red Apples",
            slug="organic-red-apples",
            description="Fresh, crisp organic red apples from local farms. Perfect for snacking or baking.",
            sku="FF-APPLE-ORG",
            category=fruits,
            brand=fresh_farm,
            price=4.99,
            stock=200,
        )
        apples.tags.add(organic, bestseller)

        # Product 7: Out of stock product (for testing in_stock filter)
        sold_out = Product.objects.create(
            name="Samsung Galaxy Fold 7",
            slug="samsung-galaxy-fold-7",
            description="Next-generation foldable phone with seamless hinge technology.",
            sku="SAM-GF7",
            category=phones,
            brand=samsung,
            price=1799.99,
            stock=0,  # Out of stock!
        )
        sold_out.tags.add(new_arrival)

        self.stdout.write(f"  ✓ Created {Product.objects.count()} products")

        # ── Product Variants ─────────────────────────────────────────────

        # Nike Air Max variants (sizes)
        for size in ["US 7", "US 8", "US 9", "US 10", "US 11", "US 12"]:
            stock = 10 if size != "US 12" else 2  # Size 12 almost sold out
            ProductVariant.objects.create(
                product=airmax,
                name=size,
                sku=f"NIKE-AM90-{size.replace(' ', '')}",
                price=airmax.price,
                stock=stock,
            )

        # Organic Apples variants (weight)
        for weight, price, stock in [("500g", 4.99, 100), ("1kg", 8.99, 80), ("2kg", 15.99, 40)]:
            ProductVariant.objects.create(
                product=apples,
                name=weight,
                sku=f"FF-APPLE-{weight}",
                price=price,
                stock=stock,
            )

        # iPhone storage variants
        for storage, price in [("256GB", 1199.99), ("512GB", 1399.99), ("1TB", 1599.99)]:
            ProductVariant.objects.create(
                product=iphone,
                name=storage,
                sku=f"APPL-IPH16PM-{storage}",
                price=price,
                stock=10,
            )

        self.stdout.write(f"  ✓ Created {ProductVariant.objects.count()} variants")

        # ── Summary ──────────────────────────────────────────────────────
        self.stdout.write(self.style.SUCCESS(
            f"\n✅ Seeding complete!\n"
            f"   {Category.objects.count()} categories\n"
            f"   {Brand.objects.count()} brands\n"
            f"   {Tag.objects.count()} tags\n"
            f"   {Product.objects.count()} products\n"
            f"   {ProductVariant.objects.count()} variants\n"
        ))
