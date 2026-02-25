"""
CGE Equilibrium Solver

Solves a simplified closed-economy CGE model with:
  - 6 production sectors (Cobb-Douglas)
  - 2 factors (Labor, Capital)
  - Cobb-Douglas household utility
  - Government sector (taxes → spending + transfers)
  - Fixed savings rate → investment

Numeraire: wage w = 1

Unknown vector (25 unknowns):
  x = [p_1..p_6, r, L_1..L_6, K_1..K_6, X_1..X_6]

Equations (25 equations):
  - 6 zero-profit conditions
  - 6 labor demand (FOC)
  - 6 capital demand (FOC)
  - 5 goods market clearing (drop last by Walras' Law)
  - 1 labor market clearing
  - 1 capital market clearing

Solver: scipy.optimize.root with tolerance 1e-8
"""

import numpy as np
from scipy.optimize import root


def build_residuals(params):
    """
    Build the system of equations F(x) = 0 for the CGE model.

    Returns a function F(x) -> np.ndarray of residuals.
    """
    n = params["num_sectors"]
    A = params["tfp"]
    alpha = params["labor_share"]
    beta = params["consumption_shares"]
    gamma = params["gov_spending_shares"]
    delta = params["investment_shares"]
    tau = params["tax_rates"]
    s_hh = params["savings_rate"]
    s_gov = params["gov_transfer_share"]
    L_total = params["total_labor"]
    K_total = params["total_capital"]

    w = 1.0  # numeraire

    def residuals(x):
        """
        x layout:
          x[0:6]   = p_j  (output prices)
          x[6]     = r    (rental rate of capital)
          x[7:13]  = L_j  (labor allocated to sector j)
          x[13:19] = K_j  (capital allocated to sector j)
          x[19:25] = X_j  (output of sector j)
        """
        p = x[0:n]
        r = x[n]
        L = x[n+1 : 2*n+1]
        K = x[2*n+1 : 3*n+1]
        X = x[3*n+1 : 4*n+1]

        F = np.zeros(4*n + 1)
        idx = 0

        # ------------------------------------------------------------------
        # 1. Zero-profit conditions (6 equations)
        #    p_j * X_j = (w * L_j + r * K_j) * (1 + tau_j)
        #    Rearranged: p_j - (w*L_j + r*K_j) * (1 + tau_j) / X_j = 0
        #
        #    Actually, the standard form:
        #    Unit cost = p_j / (1 + tau_j)
        #    Unit cost = (1/A_j) * (w/alpha_j)^alpha_j * (r/(1-alpha_j))^(1-alpha_j)
        # ------------------------------------------------------------------
        for j in range(n):
            unit_cost = (1.0 / A[j]) * \
                        (w / alpha[j])**alpha[j] * \
                        (r / (1 - alpha[j]))**(1 - alpha[j])
            # Producer price (net of tax) = unit cost
            # Consumer price p_j = unit_cost * (1 + tau_j)
            F[idx] = p[j] - unit_cost * (1 + tau[j])
            idx += 1

        # ------------------------------------------------------------------
        # 2. Production function (6 equations)
        #    X_j = A_j * L_j^alpha_j * K_j^(1-alpha_j)
        # ------------------------------------------------------------------
        for j in range(n):
            X_cd = A[j] * L[j]**alpha[j] * K[j]**(1 - alpha[j])
            F[idx] = X[j] - X_cd
            idx += 1

        # ------------------------------------------------------------------
        # 3. Factor demand FOCs (cost minimization)
        #    w * L_j = alpha_j * (p_j / (1+tau_j)) * X_j
        #    r * K_j = (1-alpha_j) * (p_j / (1+tau_j)) * X_j
        #    We use the labor FOC (6 equations):
        # ------------------------------------------------------------------
        for j in range(n):
            producer_price = p[j] / (1 + tau[j])
            F[idx] = w * L[j] - alpha[j] * producer_price * X[j]
            idx += 1

        # ------------------------------------------------------------------
        # 4. Goods market clearing (5 equations, drop last for Walras' Law)
        #    X_j = C_j + G_j + I_j
        # ------------------------------------------------------------------
        # Compute income and demand components
        total_labor_income = w * L_total
        total_capital_income = r * K_total
        factor_income = total_labor_income + total_capital_income

        # Tax revenue
        tax_revenue = 0.0
        for j in range(n):
            producer_price = p[j] / (1 + tau[j])
            tax_revenue += tau[j] * producer_price * X[j]

        transfers = s_gov * tax_revenue
        disposable_income = factor_income + transfers

        consumption_budget = (1 - s_hh) * disposable_income
        savings_budget = s_hh * disposable_income

        gov_spending_budget = (1 - s_gov) * tax_revenue

        for j in range(n - 1):  # drop last equation (Walras' Law)
            C_j = beta[j] * consumption_budget / p[j]
            G_j = gamma[j] * gov_spending_budget / p[j]
            I_j = delta[j] * savings_budget / p[j]
            F[idx] = X[j] - C_j - G_j - I_j
            idx += 1

        # ------------------------------------------------------------------
        # 5. Factor market clearing (2 equations)
        #    sum(L_j) = L_total
        #    sum(K_j) = K_total
        # ------------------------------------------------------------------
        F[idx] = L.sum() - L_total
        idx += 1
        F[idx] = K.sum() - K_total
        idx += 1

        return F

    return residuals


def build_initial_guess(params):
    """Build initial guess for the solver from baseline values."""
    n = params["num_sectors"]
    x0 = np.zeros(4 * n + 1)

    # Prices = 1 (adjusted for taxes)
    for j in range(n):
        alpha_j = params["labor_share"][j]
        tau_j = params["tax_rates"][j]
        A_j = params["tfp"][j]
        # At w=1, r=1: unit_cost = (1/A_j)*(1/alpha_j)^alpha_j * (1/(1-alpha_j))^(1-alpha_j)
        unit_cost = (1.0 / A_j) * \
                    (1.0 / alpha_j)**alpha_j * \
                    (1.0 / (1 - alpha_j))**(1 - alpha_j)
        x0[j] = unit_cost * (1 + tau_j)

    # r = 1
    x0[n] = params["baseline_r"]

    # Labor allocation
    x0[n+1 : 2*n+1] = params["labor_by_sector"]

    # Capital allocation
    x0[2*n+1 : 3*n+1] = params["capital_by_sector"]

    # Output
    x0[3*n+1 : 4*n+1] = params["baseline_output"]

    return x0


def solve(params):
    """
    Solve the CGE model for given parameters.

    Returns:
        dict with equilibrium values, convergence info, and derived metrics.
    """
    n = params["num_sectors"]
    sectors = params["sectors"]

    F = build_residuals(params)
    x0 = build_initial_guess(params)

    # Solve
    sol = root(F, x0, method="hybr", tol=1e-8,
               options={"maxfev": 10000})

    # Extract solution
    p = sol.x[0:n]
    r = sol.x[n]
    L = sol.x[n+1 : 2*n+1]
    K = sol.x[2*n+1 : 3*n+1]
    X = sol.x[3*n+1 : 4*n+1]

    w = 1.0  # numeraire

    # Derived quantities
    value_added = w * L + r * K
    gdp = value_added.sum()
    gdp_shares = value_added / gdp

    # Tax revenue
    tax_revenue = 0.0
    for j in range(n):
        producer_price = p[j] / (1 + params["tax_rates"][j])
        tax_revenue += params["tax_rates"][j] * producer_price * X[j]

    transfers = params["gov_transfer_share"] * tax_revenue
    factor_income = w * L.sum() + r * K.sum()
    disposable_income = factor_income + transfers

    # Employment shares
    labor_shares = L / L.sum()

    # Max residual
    max_residual = float(np.max(np.abs(sol.fun)))

    return {
        "converged": bool(sol.success),
        "max_residual": max_residual,
        "message": sol.message,
        "prices": {sectors[j]: float(p[j]) for j in range(n)},
        "rental_rate": float(r),
        "wage": float(w),
        "labor": {sectors[j]: float(L[j]) for j in range(n)},
        "capital": {sectors[j]: float(K[j]) for j in range(n)},
        "output": {sectors[j]: float(X[j]) for j in range(n)},
        "value_added": {sectors[j]: float(value_added[j]) for j in range(n)},
        "gdp": float(gdp),
        "gdp_shares": {sectors[j]: float(gdp_shares[j]) for j in range(n)},
        "labor_shares": {sectors[j]: float(labor_shares[j]) for j in range(n)},
        "tax_revenue": float(tax_revenue),
        "disposable_income": float(disposable_income),
        "total_labor": float(L.sum()),
        "total_capital": float(K.sum()),
    }


# ---------------------------------------------------------------------------
# Quick self-test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    from sam_data import get_baseline_params

    params = get_baseline_params()
    result = solve(params)

    print("=== CGE Solver Results ===")
    print(f"Converged: {result['converged']}")
    print(f"Max residual: {result['max_residual']:.2e}")
    print(f"Message: {result['message']}")
    print(f"\nGDP: {result['gdp']:.4f}")
    print(f"Rental rate (r): {result['rental_rate']:.4f}")
    print(f"Wage (w): {result['wage']:.4f}")
    print(f"\nPrices: {result['prices']}")
    print(f"\nGDP shares: {result['gdp_shares']}")
    print(f"\nLabor shares: {result['labor_shares']}")
    print(f"\nTax revenue: {result['tax_revenue']:.4f}")
