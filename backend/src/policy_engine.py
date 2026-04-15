"""
Policy Simulation Engine (Multi-Labor Supported)

Applies policy shocks to baseline parameters and computes
the new equilibrium, then calculates the deltas (changes).
"""

import copy
import numpy as np
from .sam_data import get_baseline_params
from .cge_solver import solve


def apply_policy(baseline_params, shocks):
    """
    Apply policy shocks to baseline parameters.
    """
    params = copy.deepcopy(baseline_params)
    sectors = params["sectors"]
    labor_types = params["labor_types"]

    # 1. Tax rate changes
    if "tax_rates" in shocks:
        for sector, rate in shocks["tax_rates"].items():
            if sector in sectors:
                idx = sectors.index(sector)
                params["tax_rates"][idx] = rate

    # 2. Subsidies
    if "subsidies" in shocks:
        for sector, subsidy in shocks["subsidies"].items():
            if sector in sectors:
                idx = sectors.index(sector)
                params["tax_rates"][idx] = max(
                    params["tax_rates"][idx] - subsidy, -0.50
                )

    # 3. Labor supply shocks (can be targeted or general)
    # If "labor_supply" is a float, apply to all types.
    # If it's a dict, apply to specific types: {"Unskilled": 1.10}
    if "labor_supply" in shocks:
        s = shocks["labor_supply"]
        if isinstance(s, (int, float)):
            params["total_labor"] *= s
            params["labor_by_sector"] *= s
        elif isinstance(s, dict):
            for lt, multiplier in s.items():
                if lt in labor_types:
                    k = labor_types.index(lt)
                    params["total_labor"][k] *= multiplier
                    params["labor_by_sector"][:, k] *= multiplier

    # 4. Capital supply shock
    if "capital_supply" in shocks:
        multiplier = shocks["capital_supply"]
        params["total_capital"] *= multiplier
        params["capital_by_sector"] *= multiplier

    return params


def simulate(shocks):
    """Full simulation: baseline -> shocks -> solve -> deltas."""
    baseline_params = get_baseline_params()

    # Solve baseline
    baseline_result = solve(baseline_params)
    if not baseline_result["converged"]:
        return {"error": "Baseline solver did not converge"}

    # Apply shocks
    scenario_params = apply_policy(baseline_params, shocks)
    scenario_result = solve(scenario_params)
    if not scenario_result["converged"]:
        return {"error": "Scenario solver did not converge"}

    # Compute deltas
    return {
        "baseline": baseline_result,
        "scenario": scenario_result,
        "deltas": compute_deltas(baseline_result, scenario_result),
        "shocks_applied": shocks,
    }


def compute_deltas(baseline, scenario):
    """Compute changes with support for segmented labor and multi-household."""
    sectors = list(baseline["value_added"].keys())
    labor_types = list(baseline["total_labor"].keys())

    def get_change(b_val, s_val):
        abs_diff = s_val - b_val
        pct_diff = (abs_diff / b_val * 100) if b_val != 0 else 0
        return {"absolute": abs_diff, "percent": pct_diff}

    # Macro
    deltas = {
        "gdp": get_change(baseline["gdp"], scenario["gdp"]),
        "rental_rate": get_change(baseline["rental_rate"], scenario["rental_rate"]),
        "output": {s: get_change(baseline["value_added"][s], scenario["value_added"][s]) for s in sectors},
        "prices": {s: get_change(baseline["prices"][s], scenario["prices"][s]) for s in sectors},
    }

    # Wage changes
    deltas["wages"] = {lt: get_change(baseline["wages"][lt], scenario["wages"][lt]) for lt in labor_types}

    # Labor changes (Total and by sector)
    deltas["total_labor"] = {lt: get_change(baseline["total_labor"][lt], scenario["total_labor"][lt]) for lt in labor_types}
    
    # Household Distributional Impact
    hhd_names = list(baseline["real_incomes"].keys())
    deltas["real_incomes"] = {h: get_change(baseline["real_incomes"][h], scenario["real_incomes"][h]) for h in hhd_names}
    
    # Detailed labor shifts by sector and type
    deltas["labor"] = {}
    for s in sectors:
        deltas["labor"][s] = {
            lt: get_change(baseline["labor"][s][lt], scenario["labor"][s][lt])
            for lt in labor_types
        }
        # Add total for backward compatibility in results table
        b_sum = sum(baseline["labor"][s].values())
        s_sum = sum(scenario["labor"][s].values())
        deltas["labor"][s]["total"] = get_change(b_sum, s_sum)
        # Map the top level to total for simple table access
        deltas["labor"][s]["percent"] = deltas["labor"][s]["total"]["percent"]
        deltas["labor"][s]["absolute"] = deltas["labor"][s]["total"]["absolute"]

    return deltas
