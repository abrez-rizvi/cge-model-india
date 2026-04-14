"""
Policy Simulation Engine

Applies policy shocks to baseline parameters and computes
the new equilibrium, then calculates the deltas (changes)
relative to the baseline.

Supported policy shocks:
  - tax_rates: dict of sector -> new tax rate
  - subsidies: dict of sector -> subsidy rate (reduces effective tax)
  - labor_supply: float multiplier on total labor supply
  - capital_supply: float multiplier on total capital supply
"""

import copy
import numpy as np
from .sam_data import get_baseline_params, SECTORS
from .cge_solver import solve


def apply_policy(baseline_params, shocks):
    """
    Apply policy shocks to baseline parameters.

    Args:
        baseline_params: dict from get_baseline_params()
        shocks: dict with optional keys:
            - tax_rates: {sector_code: new_rate} e.g. {"MFG": 0.20}
            - subsidies: {sector_code: subsidy_rate} e.g. {"AGR": 0.05}
            - labor_supply: multiplier (e.g. 1.10 for 10% increase)
            - capital_supply: multiplier (e.g. 1.05 for 5% increase)

    Returns:
        Modified parameter dict ready for the solver.
    """
    params = copy.deepcopy(baseline_params)
    sectors = params["sectors"]

    # Apply tax rate changes
    if "tax_rates" in shocks:
        for sector, rate in shocks["tax_rates"].items():
            if sector in sectors:
                idx = sectors.index(sector)
                params["tax_rates"][idx] = rate

    # Apply subsidies (reduce effective tax rate)
    if "subsidies" in shocks:
        for sector, subsidy in shocks["subsidies"].items():
            if sector in sectors:
                idx = sectors.index(sector)
                params["tax_rates"][idx] = max(
                    params["tax_rates"][idx] - subsidy, -0.50
                )

    # Apply labor supply shock
    if "labor_supply" in shocks:
        multiplier = shocks["labor_supply"]
        params["total_labor"] *= multiplier
        params["labor_by_sector"] *= multiplier

    # Apply capital supply shock
    if "capital_supply" in shocks:
        multiplier = shocks["capital_supply"]
        params["total_capital"] *= multiplier
        params["capital_by_sector"] *= multiplier

    return params


def simulate(shocks):
    """
    Run a full simulation: baseline → apply shocks → solve → compute deltas.

    Args:
        shocks: dict of policy shocks (see apply_policy)

    Returns:
        dict with baseline, scenario, and delta results.
    """
    baseline_params = get_baseline_params()

    # Solve baseline
    baseline_result = solve(baseline_params)
    if not baseline_result["converged"]:
        return {
            "error": "Baseline solver did not converge",
            "details": baseline_result["message"],
        }

    # Apply shocks and solve scenario
    scenario_params = apply_policy(baseline_params, shocks)
    scenario_result = solve(scenario_params)
    if not scenario_result["converged"]:
        return {
            "error": "Scenario solver did not converge",
            "details": scenario_result["message"],
        }

    # Compute deltas
    deltas = compute_deltas(baseline_result, scenario_result)

    return {
        "baseline": baseline_result,
        "scenario": scenario_result,
        "deltas": deltas,
        "shocks_applied": shocks,
    }


def compute_deltas(baseline, scenario):
    """
    Compute percentage and absolute changes between baseline and scenario.
    """
    sectors = list(baseline["output"].keys())

    # GDP change
    gdp_change = scenario["gdp"] - baseline["gdp"]
    gdp_change_pct = (gdp_change / baseline["gdp"]) * 100

    # Sectoral output changes
    output_changes = {}
    for s in sectors:
        base_val = baseline["output"][s]
        scen_val = scenario["output"][s]
        output_changes[s] = {
            "absolute": scen_val - base_val,
            "percent": ((scen_val - base_val) / base_val) * 100 if base_val != 0 else 0,
        }

    # Value added changes
    va_changes = {}
    for s in sectors:
        base_val = baseline["value_added"][s]
        scen_val = scenario["value_added"][s]
        va_changes[s] = {
            "absolute": scen_val - base_val,
            "percent": ((scen_val - base_val) / base_val) * 100 if base_val != 0 else 0,
        }

    # Employment (labor) changes
    labor_changes = {}
    for s in sectors:
        base_val = baseline["labor"][s]
        scen_val = scenario["labor"][s]
        labor_changes[s] = {
            "absolute": scen_val - base_val,
            "percent": ((scen_val - base_val) / base_val) * 100 if base_val != 0 else 0,
        }

    # Price changes
    price_changes = {}
    for s in sectors:
        base_val = baseline["prices"][s]
        scen_val = scenario["prices"][s]
        price_changes[s] = {
            "absolute": scen_val - base_val,
            "percent": ((scen_val - base_val) / base_val) * 100 if base_val != 0 else 0,
        }

    # Capital return change
    r_change = scenario["rental_rate"] - baseline["rental_rate"]
    r_change_pct = (r_change / baseline["rental_rate"]) * 100 if baseline["rental_rate"] != 0 else 0

    return {
        "gdp": {
            "absolute": gdp_change,
            "percent": gdp_change_pct,
        },
        "rental_rate": {
            "absolute": r_change,
            "percent": r_change_pct,
        },
        "output": output_changes,
        "value_added": va_changes,
        "labor": labor_changes,
        "prices": price_changes,
    }


# ---------------------------------------------------------------------------
# Quick self-test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # Test: increase manufacturing tax by 10 percentage points
    result = simulate({
        "tax_rates": {"MFG": 0.22}  # from 0.12 to 0.22
    })

    if "error" in result:
        print(f"Error: {result['error']}")
    else:
        print("=== Policy Simulation: +10pp MFG Tax ===")
        print(f"Baseline GDP: {result['baseline']['gdp']:.4f}")
        print(f"Scenario GDP: {result['scenario']['gdp']:.4f}")
        print(f"GDP Change: {result['deltas']['gdp']['percent']:.2f}%")
        print(f"\nRental rate: {result['baseline']['rental_rate']:.4f} → "
              f"{result['scenario']['rental_rate']:.4f} "
              f"({result['deltas']['rental_rate']['percent']:+.2f}%)")
        print(f"\nOutput changes:")
        for s, v in result['deltas']['output'].items():
            print(f"  {s}: {v['percent']:+.2f}%")
        print(f"\nLabor shifts:")
        for s, v in result['deltas']['labor'].items():
            print(f"  {s}: {v['percent']:+.2f}%")
