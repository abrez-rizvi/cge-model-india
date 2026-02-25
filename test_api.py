"""Quick API verification test."""
import urllib.request
import json

print("=" * 50)
print("CGE Model — API Verification")
print("=" * 50)

# Test 1: Baseline
print("\n--- Test 1: GET /api/baseline ---")
try:
    r = urllib.request.urlopen("http://127.0.0.1:5000/api/baseline")
    d = json.loads(r.read())
    eq = d["equilibrium"]
    sam = d["sam"]

    print(f"  Converged: {eq['converged']}")
    print(f"  Max residual: {eq['max_residual']:.2e}")
    print(f"  GDP: {eq['gdp']:.4f}")
    print(f"  Rental rate (r): {eq['rental_rate']:.6f}")
    print(f"  SAM Balanced: {sam['verification']['balanced']}")
    print(f"  Prices: { {k: round(v, 4) for k, v in eq['prices'].items()} }")
    print(f"  GDP shares: { {k: round(v, 4) for k, v in eq['gdp_shares'].items()} }")
    print(f"  Labor shares: { {k: round(v, 4) for k, v in eq['labor_shares'].items()} }")
    print("  ✓ PASS")
except Exception as e:
    print(f"  ✗ FAIL: {e}")

# Test 2: Simulation
print("\n--- Test 2: POST /api/simulate (MFG tax +13pp, AGR subsidy 3%, labor +5%) ---")
try:
    shocks = {
        "shocks": {
            "tax_rates": {"MFG": 0.25},
            "subsidies": {"AGR": 0.03},
            "labor_supply": 1.05,
        }
    }
    req = urllib.request.Request(
        "http://127.0.0.1:5000/api/simulate",
        data=json.dumps(shocks).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    r = urllib.request.urlopen(req)
    d = json.loads(r.read())

    print(f"  Baseline GDP: {d['baseline']['gdp']:.4f}")
    print(f"  Scenario GDP: {d['scenario']['gdp']:.4f}")
    print(f"  GDP change: {d['deltas']['gdp']['percent']:+.4f}%")
    print(f"  r change: {d['deltas']['rental_rate']['percent']:+.4f}%")
    print("  Output changes:")
    for s, v in d["deltas"]["output"].items():
        print(f"    {s}: {v['percent']:+.4f}%")
    print("  Labor shifts:")
    for s, v in d["deltas"]["labor"].items():
        print(f"    {s}: {v['percent']:+.4f}%")
    print("  ✓ PASS")
except Exception as e:
    print(f"  ✗ FAIL: {e}")

# Test 3: Homepage serves HTML
print("\n--- Test 3: GET / (dashboard HTML) ---")
try:
    r = urllib.request.urlopen("http://127.0.0.1:5000/")
    html = r.read().decode("utf-8")
    has_title = "India CGE Model" in html
    has_chartjs = "chart.js" in html.lower() or "Chart" in html
    has_tabs = "tab-overview" in html
    print(f"  Contains title: {has_title}")
    print(f"  Contains Chart.js: {has_chartjs}")
    print(f"  Contains tabs: {has_tabs}")
    print(f"  HTML length: {len(html)} chars")
    if has_title and has_tabs:
        print("  ✓ PASS")
    else:
        print("  ✗ FAIL: Missing expected elements")
except Exception as e:
    print(f"  ✗ FAIL: {e}")

print("\n" + "=" * 50)
print("Verification complete.")
