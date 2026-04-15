"""
Flask API for the CGE model.

Endpoints:
  GET  /api/baseline  — Return baseline SAM and equilibrium
  POST /api/simulate  — Run simulation with policy shocks
"""

from flask import Blueprint, jsonify, request
from .sam_data import get_sam, get_baseline_params
from .cge_solver import solve
from .policy_engine import simulate

api = Blueprint("api", __name__)


@api.route("/api/baseline", methods=["GET"])
def get_baseline():
    """Return baseline equilibrium and SAM data."""
    # Get SAM
    sam_result = get_sam()
    sam_data = {
        "matrix": sam_result["matrix"],
        "accounts": sam_result["accounts"],
        "verification": sam_result["verification"],
    }

    # Solve baseline equilibrium
    params = get_baseline_params()
    equilibrium = solve(params)

    return jsonify({
        "sam": sam_data,
        "equilibrium": equilibrium,
        "parameters": {
            "sectors": params["sectors"],
            "labor_types": params["labor_types"],
            "labor_shares": params["labor_shares"].tolist(),
            "tax_rates": params["tax_rates"].tolist(),
            "consumption_matrix": params["hhd_consumption_matrix"].tolist(),
            "consumption_shares": params["hhd_consumption_matrix"].mean(axis=1).tolist(),
            "hhd_savings_rates": params["hhd_savings_rates"].tolist(),
            "savings_rate": float(params["hhd_savings_rates"].mean()),
            "total_labor": params["total_labor"].tolist(),
            "total_capital": float(params["total_capital"]),
            "hhd_names": params["hhd_names"],
            "hhd_groups": params["hhd_groups"],
            "hhd_map": params["hhd_map"]
        }
    })


@api.route("/api/simulate", methods=["POST"])
def run_simulation():
    """
    Run a policy simulation.

    Request body (JSON):
    {
        "shocks": {
            "tax_rates": {"MFG": 0.20, ...},
            "subsidies": {"AGR": 0.05, ...},
            "labor_supply": 1.10,
            "capital_supply": 1.05
        }
    }

    Returns baseline, scenario, and deltas.
    """
    data = request.get_json()
    if not data or "shocks" not in data:
        return jsonify({"error": "Request body must include 'shocks' object"}), 400

    shocks = data["shocks"]

    # Validate shock types
    valid_keys = {"tax_rates", "subsidies", "labor_supply", "capital_supply"}
    invalid_keys = set(shocks.keys()) - valid_keys
    if invalid_keys:
        return jsonify({
            "error": f"Invalid shock keys: {invalid_keys}. Valid: {valid_keys}"
        }), 400

    result = simulate(shocks)

    if "error" in result:
        return jsonify(result), 500

    return jsonify(result)
