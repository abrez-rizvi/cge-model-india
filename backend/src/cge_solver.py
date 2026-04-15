"""
CGE Equilibrium Solver (Multi-Household & Multi-Labor Version)
Solves general equilibrium equations with 10 household groups.
"""

import numpy as np
from scipy.optimize import root, least_squares

def build_residuals(params):
    n = params["num_sectors"]
    m = params["num_labor_types"]
    h_count = params["num_households"]
    
    A = params["tfp"]
    alpha_L = params["labor_shares"]
    alpha_K = params["capital_shares"]
    alpha_Land = params["land_shares"]
    
    phi = params["factor_distribution"] # (Factors: m+2, HHD: 10)
    beta = params["hhd_consumption_matrix"] # (Sector: n, HHD: 10)
    s_hhd = params["hhd_savings_rates"]
    transfers = params["hhd_gov_transfers"]
    
    tau = params["tax_rates"]
    L_total = params["total_labor"]
    K_total = params["total_capital"]
    Land_total = params["total_land"]
    
    w0 = 1.0 # Numeraire

    def residuals(x):
        """
        x layout:
          0..n-1     : p (prices)
          n..n+m-2   : w_k (wages for k=1..m-1)
          n+m-1      : r (rental of capital)
          n+m        : w_land (rent of land)
          ... factor allocations and output ...
        """
        EPS = 1e-12
        p = np.clip(x[0:n], EPS, None)
        w = np.concatenate(([w0], np.clip(x[n : n+m-1], EPS, None)))
        r = max(x[n+m-1], EPS)
        w_land = max(x[n+m], EPS)
        
        idx = n + m + 1
        L = np.clip(x[idx : idx + n*m].reshape((n, m)), EPS, None)
        idx += n*m
        K = np.clip(x[idx : idx + n], EPS, None)
        idx += n
        Land = np.clip(x[idx : idx + n], EPS, None)
        idx += n
        X = np.clip(x[idx : idx + n], EPS, None)

        F = np.zeros(5*n + n*m + m + 1)
        f_idx = 0

        # 1. Zero-profit (Unit Cost = Price before tax)
        # UC = (1/A) * prod(w/a)^a * (r/ak)^ak * (wl/al)^al
        for j in range(n):
            term_l = 1.0
            for k in range(m):
                if alpha_L[j, k] > 0:
                    term_l *= (w[k] / alpha_L[j, k])**alpha_L[j, k]
            
            term_k = (r / alpha_K[j])**alpha_K[j] if alpha_K[j] > 0 else 1.0
            term_land = (w_land / alpha_Land[j])**alpha_Land[j] if alpha_Land[j] > 0 else 1.0
            
            unit_cost = (1.0 / A[j]) * term_l * term_k * term_land
            F[f_idx] = p[j] - unit_cost * (1 + tau[j])
            f_idx += 1

        # 2. Production Functions
        for j in range(n):
            term_l = 1.0
            for k in range(m):
                term_l *= L[j, k]**alpha_L[j, k]
            val = A[j] * term_l * (K[j]**alpha_K[j]) * (Land[j]**alpha_Land[j])
            F[f_idx] = X[j] - val
            f_idx += 1

        # 3. Factor Demands (FOCs)
        for j in range(n):
            pp = p[j] / (1 + tau[j])
            # Labor
            for k in range(m):
                F[f_idx] = w[k] * L[j, k] - alpha_L[j, k] * pp * X[j]
                f_idx += 1
            # Capital
            F[f_idx] = r * K[j] - alpha_K[j] * pp * X[j]
            f_idx += 1
            # Land
            F[f_idx] = w_land * Land[j] - alpha_Land[j] * pp * X[j]
            f_idx += 1

        # 4. Household Income & Aggregate Consumption
        # Total returns from factors
        labor_income = L_total * w
        capital_income = K_total * r
        land_income = Land_total * w_land
        
        # Combined factor income vector [L1, L2..Lm, K, Land]
        total_incomes = np.concatenate((labor_income, [capital_income], [land_income]))
        
        # Distributed to 10 households
        # Y_h = sum_f (Incomes_f * phi_fh) + Transfers_h
        Y_h = (total_incomes @ phi) + transfers
        
        # Aggregate demand per sector
        C_j = np.zeros(n)
        for h in range(h_count):
            h_budget = (1 - s_hhd[h]) * Y_h[h]
            C_j += beta[:, h] * h_budget / p
            
        # Goods market clearing (minus last to avoid redundancy - Walras)
        for j in range(n - 1):
            # For simplicity, Gov and Inv are currently fixed shares of total output or placeholders
            # In this model, they are treated as fixed leakage or simple split
            # We'll use a fixed demand share for Gov/Inv for now
            F[f_idx] = X[j] - C_j[j] # Simplified: assuming G and I are absorbed in SAM calibration
            f_idx += 1

        # 5. Factor Market Clearing
        # Labor
        L_sums = L.sum(axis=0)
        for k in range(m):
            F[f_idx] = L_sums[k] - L_total[k]
            f_idx += 1
        # Capital
        F[f_idx] = K.sum() - K_total
        f_idx += 1
        # Land
        F[f_idx] = Land.sum() - Land_total
        f_idx += 1

        return F

    return residuals

def solve(params):
    n = params["num_sectors"]
    m = params["num_labor_types"]
    
    # Unknowns: p(n), w(m-1), r(1), w_land(1), L(n*m), K(n), Land(n), X(n)
    size = n + (m - 1) + 2 + n*m + n + n + n
    x0 = np.ones(size)
    
    # Better initial guess from baseline
    idx = n + m + 1
    x0[idx : idx + n*m] = params["labor_by_sector"].flatten()
    idx += n*m
    x0[idx : idx + n] = params["capital_by_sector"]
    idx += n
    x0[idx : idx + n] = params["land_by_sector"]
    idx += n
    x0[idx : idx + n] = params["baseline_output"]
    
    # Ensure initial guess is within bounds [1e-12, inf]
    x0 = np.clip(x0, 1e-9, None)
    
    F = build_residuals(params)
    lower = np.ones_like(x0) * 1e-12
    
    # Diagnostic check
    if np.any(x0 < lower):
        violations = np.where(x0 < lower)[0]
        print(f"DIAGNOSTIC: x0 violates bounds at indices {violations}")
        print(f"Values: {x0[violations]}")
        print(f"Lower bounds: {lower[violations]}")
    
    sol = least_squares(F, x0, bounds=(lower, np.inf), ftol=1e-10, xtol=1e-10, gtol=1e-10)
    
    if not sol.success and sol.optimality > 1e-4:
        return {"converged": False, "message": sol.message}

    # Extract
    p = sol.x[0:n]
    w = np.concatenate(([1.0], sol.x[n : n+m-1]))
    r = sol.x[n+m-1]
    w_land = sol.x[n+m]
    
    idx = n + m + 1
    L_alloc = sol.x[idx : idx + n*m].reshape((n, m))
    idx += n*m
    K_alloc = sol.x[idx : idx + n]
    idx += n
    # Land_alloc omitted for brevity
    idx += n
    X_alloc = sol.x[idx : idx + n]
    
    # Compute results
    labor_income = params["total_labor"] * w
    total_returns = np.concatenate((labor_income, [params["total_capital"] * r], [params["total_land"] * w_land]))
    Y_h = (total_returns @ params["factor_distribution"]) + params["hhd_gov_transfers"]
    
    cpi_h = np.zeros(len(Y_h))
    for h in range(len(Y_h)):
        cpi_h[h] = np.sum(p * params["hhd_consumption_matrix"][:, h])
    
    real_Y_h = Y_h / cpi_h

    sectors = params["sectors"]
    lt_names = params["labor_types"]

    # Tax Revenue
    tax_rev = 0.0
    for j in range(n):
        pp = p[j] / (1 + params["tax_rates"][j])
        tax_rev += params["tax_rates"][j] * pp * X_alloc[j]

    return {
        "converged": True,
        "prices": {sectors[j]: float(p[j]) for j in range(n)},
        "wages": {lt_names[k]: float(w[k]) for k in range(m)},
        "rental_rate": float(r),
        "land_rent": float(w_land),
        "tax_revenue": float(tax_rev),
        "gdp": float(Y_h.sum()),
        "real_incomes": {params["hhd_names"][h]: float(real_Y_h[h]) for h in range(len(Y_h))},
        "nominal_incomes": {params["hhd_names"][h]: float(Y_h[h]) for h in range(len(Y_h))},
        "value_added": {sectors[j]: float(X_alloc[j]) for j in range(n)},
        "capital": {sectors[j]: float(K_alloc[j]) for j in range(n)},
        "labor": {
            sectors[j]: {lt_names[k]: float(L_alloc[j, k]) for k in range(m)}
            for j in range(n)
        },
        "total_labor": {lt_names[k]: float((L_alloc.sum(axis=0))[k]) for k in range(m)}
    }
