"""
Zero-dependency Multi-threaded Stress Testing Script.
Simulates concurrent user sessions adding items to their cart and checking out.
No external packages needed; runs directly in Python standard library.
"""

import concurrent.futures
import json
import time
import urllib.error
import urllib.request
from http.cookiejar import CookieJar
import statistics

# =============================================================================
# CONFIGURATION
# =============================================================================
BASE_URL = "http://localhost:8000/api"
CONCURRENT_USERS = 50       # Number of simultaneous threads/users
ITEMS_TO_ADD = 3            # Cart adds per user
PRODUCT_ID = 6              # Seed product ID to add to cart
CHECKOUT_SHIPPING = {
    "first_name": "Stress",
    "last_name": "Test",
    "email": "stress@example.com",
    "phone": "+1999999999",
    "address": "123 Performance Way",
    "city": "LoadCity",
    "postal_code": "00000",
}


def run_user_session(user_id: int) -> list[dict]:
    """
    Simulates a complete single user session lifecycle:
    1. Initialize Session & View Cart (GET /cart/)
    2. Add items to cart (POST /cart/add/)
    3. Place Order/Checkout (POST /orders/)
    Returns a list of result metrics for each action.
    """
    results = []

    # Create isolated cookie jar for this user thread to persist guest session
    cj = CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

    def send_request(action: str, method: str, path: str, payload: dict = None):
        url = f"{BASE_URL}{path}"
        headers = {"Content-Type": "application/json"}
        data = None

        if payload:
            data = json.dumps(payload).encode("utf-8")

        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        start_time = time.perf_counter()
        success = False
        status_code = 0
        error_msg = ""

        try:
            with opener.open(req) as resp:
                status_code = resp.status
                # Read response to complete request connection
                resp.read()
                success = True
        except urllib.error.HTTPError as e:
            status_code = e.code
            try:
                error_msg = e.read().decode("utf-8")
            except Exception:
                error_msg = e.reason
        except Exception as e:
            status_code = 500
            error_msg = str(e)

        latency = (time.perf_counter() - start_time) * 1000  # Convert to ms

        results.append({
            "user_id": user_id,
            "action": action,
            "success": success,
            "latency_ms": latency,
            "status_code": status_code,
            "error": error_msg,
        })
        return success

    # --- Phase 1: Browse Cart ---
    send_request("Browse Cart", "GET", "/cart/")

    # --- Phase 2: Add Items to Cart ---
    for _ in range(ITEMS_TO_ADD):
        # Add 1 item
        payload = {"product_id": PRODUCT_ID, "quantity": 1}
        success = send_request("Add to Cart", "POST", "/cart/add/", payload)
        if not success:
            break
        time.sleep(0.1)  # Brief simulated reading delay

    # --- Phase 3: Checkout ---
    send_request("Checkout", "POST", "/orders/", CHECKOUT_SHIPPING)

    return results


def print_report(results: list[dict]):
    """Aggregates and logs metrics in a clean ASCII format."""
    grouped = {}
    for r in results:
        action = r["action"]
        if action not in grouped:
            grouped[action] = []
        grouped[action].append(r)

    print("\n" + "=" * 80)
    print(f" PERFORMANCE LOAD TEST REPORT ({CONCURRENT_USERS} CONCURRENT USERS)")
    print("=" * 80)
    print(
        f"{'Action':<15} | {'Total':<6} | {'Passed':<6} | {'Failed':<6} | {'Rate %':<7} | {'Avg (ms)':<8} | {'p95 (ms)':<8}"
    )
    print("-" * 80)

    for action, items in grouped.items():
        total = len(items)
        passed = sum(1 for x in items if x["success"])
        failed = total - passed
        success_rate = (passed / total) * 100 if total > 0 else 0
        latencies = [x["latency_ms"] for x in items]

        avg_lat = statistics.mean(latencies) if latencies else 0
        p95_lat = (
            statistics.quantiles(latencies, n=20)[18]
            if len(latencies) >= 2
            else (latencies[0] if latencies else 0)
        )

        print(
            f"{action:<15} | {total:<6} | {passed:<6} | {failed:<6} | {success_rate:<7.1f} | {avg_lat:<8.1f} | {p95_lat:<8.1f}"
        )

    print("=" * 80)

    # Print sample errors if any failed
    failures = [x for x in results if not x["success"]]
    if failures:
        print("\nSAMPLE ERRORS:")
        seen_errors = set()
        for f in failures:
            err_key = (f["action"], f["status_code"], f["error"])
            if err_key not in seen_errors:
                seen_errors.add(err_key)
                print(f" - {f['action']} (Status {f['status_code']}): {f['error']}")
        print("=" * 80)


def main():
    print(f"Starting stress test targeting {BASE_URL}...")
    print(f"Simulating {CONCURRENT_USERS} concurrent users...")

    all_results = []
    with concurrent.futures.ThreadPoolExecutor(
        max_workers=CONCURRENT_USERS
    ) as executor:
        # Submit all user sessions
        futures = {
            executor.submit(run_user_session, i): i
            for i in range(CONCURRENT_USERS)
        }

        # Collect results
        for future in concurrent.futures.as_completed(futures):
            try:
                session_results = future.result()
                all_results.extend(session_results)
            except Exception as e:
                print(f"User thread failed: {e}")

    print_report(all_results)


if __name__ == "__main__":
    main()
