"""
Social Accounting Matrix (SAM) data for a simplified 6-sector Indian economy.

Sectors: AGR, MFG, SRV, ENG, CON, GOV
Factors: Labor (L), Capital (K)
Institutions: Households (HH), Government (GOV_INST)

The SAM is a 10x10 matrix capturing all circular flows of income.
Row totals MUST equal column totals for each account (double-entry accounting).

Calibrated to approximate India's GDP composition:
  AGR ~17%, MFG ~23%, SRV ~32%, ENG ~10%, CON ~13%, GOV ~5%
"""

import numpy as np

# ---------------------------------------------------------------------------
# Sector definitions
# ---------------------------------------------------------------------------
SECTORS = ["AGR", "MFG", "SRV", "ENG", "CON", "GOV"]
NUM_SECTORS = len(SECTORS)

SAM_ACCOUNTS = SECTORS + ["Labor", "Capital", "Households", "Government"]
NUM_ACCOUNTS = len(SAM_ACCOUNTS)

# ---------------------------------------------------------------------------
# Baseline parameters
# ---------------------------------------------------------------------------

# Total output by sector (abstract units, ~200 total)
BASELINE_OUTPUT = np.array([34.0, 46.0, 64.0, 20.0, 26.0, 10.0])

# Labor share (alpha) in Cobb-Douglas
LABOR_SHARE = np.array([0.60, 0.45, 0.55, 0.30, 0.50, 0.70])

# Tax rates (ad-valorem)
TAX_RATES = np.array([0.05, 0.12, 0.10, 0.08, 0.10, 0.02])

# Household savings rate
SAVINGS_RATE = 0.20

# Government transfer share (fraction of tax revenue → household transfers)
GOV_TRANSFER_SHARE = 0.30

# ---------------------------------------------------------------------------
# Derived baseline quantities (at baseline p=1, w=1, r=1)
# ---------------------------------------------------------------------------

def _compute_baseline():
    """
    Compute all baseline quantities ensuring SAM balance.

    Strategy: Start from target output X_j, derive factor payments,
    tax revenue, income, and then BACK-OUT the demand shares (beta, gamma, delta)
    so that goods markets clear exactly at baseline.
    """
    X = BASELINE_OUTPUT.copy()
    alpha = LABOR_SHARE.copy()
    tau = TAX_RATES.copy()

    # --- Supply side ---
    # Producer price = 1/(1+tau) at consumer price p=1
    # Value added per sector (at producer prices)
    producer_price = 1.0 / (1.0 + tau)
    value_added = producer_price * X  # = p_producer * X

    # Factor payments
    labor_income = alpha * value_added       # w * L_j = alpha * p_prod * X
    capital_income = (1 - alpha) * value_added  # r * K_j = (1-alpha) * p_prod * X

    L_total = labor_income.sum()   # since w = 1
    K_total = capital_income.sum()  # since r = 1

    # Tax revenue
    tax_revenue = (tau * producer_price * X).sum()

    # --- Income side ---
    factor_income = L_total + K_total
    transfers = GOV_TRANSFER_SHARE * tax_revenue
    disposable_income = factor_income + transfers

    consumption_budget = (1 - SAVINGS_RATE) * disposable_income
    savings_budget = SAVINGS_RATE * disposable_income
    gov_spending_budget = (1 - GOV_TRANSFER_SHARE) * tax_revenue

    # --- Demand side ---
    # Total demand for sector j: D_j = C_j + G_j + I_j = X_j  (market clearing at baseline)
    # We need: beta_j * consumption_budget / p_j + gamma_j * gov_budget / p_j + delta_j * savings / p_j = X_j
    # At p_j = 1:  beta_j * C + gamma_j * G + delta_j * S = X_j
    #
    # We have 6 unknowns (beta, gamma, delta — 18 total) but only 6 equations.
    # Fix gamma and delta using target shares, then solve for beta.

    # Government spending shares (policy choice)
    gamma = np.array([0.15, 0.10, 0.20, 0.15, 0.30, 0.10])

    # Investment shares (structural)
    delta = np.array([0.10, 0.25, 0.20, 0.20, 0.20, 0.05])

    # Solved consumption shares to clear markets:
    # beta_j = (X_j - gamma_j * G - delta_j * S) / C
    gov_demand = gamma * gov_spending_budget
    inv_demand = delta * savings_budget
    consumption_demand = X - gov_demand - inv_demand

    # Check that consumption for each sector is positive
    if np.any(consumption_demand <= 0):
        raise ValueError("Negative consumption demand — check calibration!")

    beta = consumption_demand / consumption_budget

    # Normalize beta to sum to 1 (should be close already due to Walras' law)
    # Any small discrepancy is due to the accounting identity
    beta_sum = beta.sum()
    if abs(beta_sum - 1.0) > 0.05:
        raise ValueError(
            f"Consumption shares sum to {beta_sum:.4f}, too far from 1.0. "
            "Recalibrate parameters."
        )
    beta = beta / beta_sum

    # After normalization, recompute consumption demand to close SAM exactly
    consumption_demand = beta * consumption_budget

    return {
        "X": X,
        "alpha": alpha,
        "tau": tau,
        "L_by_sector": labor_income,   # = L_j since w=1
        "K_by_sector": capital_income,  # = K_j since r=1
        "L_total": L_total,
        "K_total": K_total,
        "tax_revenue": tax_revenue,
        "transfers": transfers,
        "factor_income": factor_income,
        "disposable_income": disposable_income,
        "consumption_budget": consumption_budget,
        "savings_budget": savings_budget,
        "gov_spending_budget": gov_spending_budget,
        "beta": beta,
        "gamma": gamma,
        "delta": delta,
        "consumption_demand": consumption_demand,
        "gov_demand": gov_demand,
        "inv_demand": inv_demand,
    }


_BASELINE = _compute_baseline()

# Export key arrays
CONSUMPTION_SHARES = _BASELINE["beta"]
GOV_SPENDING_SHARES = _BASELINE["gamma"]
INVESTMENT_SHARES = _BASELINE["delta"]

LABOR_BY_SECTOR = _BASELINE["L_by_sector"]
CAPITAL_BY_SECTOR = _BASELINE["K_by_sector"]
TOTAL_LABOR = _BASELINE["L_total"]
TOTAL_CAPITAL = _BASELINE["K_total"]
BASELINE_R = 1.0

# ---------------------------------------------------------------------------
# TFP Calibration
# ---------------------------------------------------------------------------

def calibrate_tfp():
    """
    Calibrate TFP so X_j = A_j * L_j^alpha_j * K_j^(1-alpha_j) at baseline.
    """
    tfp = np.zeros(NUM_SECTORS)
    for j in range(NUM_SECTORS):
        L_j = LABOR_BY_SECTOR[j]
        K_j = CAPITAL_BY_SECTOR[j]
        a_j = LABOR_SHARE[j]
        tfp[j] = BASELINE_OUTPUT[j] / (L_j**a_j * K_j**(1 - a_j))
    return tfp


TFP = calibrate_tfp()


# ---------------------------------------------------------------------------
# SAM Construction
# ---------------------------------------------------------------------------

def build_sam():
    """
    Build a balanced 10x10 SAM.

    Accounts:
      0-5: AGR, MFG, SRV, ENG, CON, GOV (activity/commodity)
      6:   Labor
      7:   Capital
      8:   Households
      9:   Government
    """
    b = _BASELINE
    sam = np.zeros((NUM_ACCOUNTS, NUM_ACCOUNTS))

    for j in range(NUM_SECTORS):
        # Sector column: factor payments + taxes
        sam[6, j] = b["L_by_sector"][j]       # Labor ← Sector
        sam[7, j] = b["K_by_sector"][j]       # Capital ← Sector
        sam[9, j] = b["tau"][j] * b["X"][j] / (1 + b["tau"][j])  # Gov ← Sector (tax)

    # Labor column: all labor income → Households
    sam[8, 6] = b["L_total"]

    # Capital column: all capital income → Households
    sam[8, 7] = b["K_total"]

    # Household column: consumption + savings (→ investment in sectors)
    for j in range(NUM_SECTORS):
        sam[j, 8] = b["consumption_demand"][j] + b["inv_demand"][j]

    # Government column: spending on sectors + transfers to HH
    for j in range(NUM_SECTORS):
        sam[j, 9] = b["gov_demand"][j]
    sam[8, 9] = b["transfers"]  # Transfers → HH

    return sam, SAM_ACCOUNTS


def verify_sam(sam):
    """Verify row sums = column sums."""
    row_sums = sam.sum(axis=1)
    col_sums = sam.sum(axis=0)
    diff = np.abs(row_sums - col_sums)
    return {
        "balanced": bool(diff.max() < 0.01),
        "max_difference": float(diff.max()),
        "row_sums": row_sums.tolist(),
        "col_sums": col_sums.tolist(),
        "differences": diff.tolist(),
    }


def get_sam():
    """Return SAM matrix and verification."""
    sam, accounts = build_sam()
    return {
        "matrix": sam,
        "accounts": accounts,
        "verification": verify_sam(sam),
    }


def get_baseline_params():
    """Return all parameters needed by the CGE solver."""
    return {
        "sectors": SECTORS,
        "num_sectors": NUM_SECTORS,
        "baseline_output": BASELINE_OUTPUT.copy(),
        "labor_share": LABOR_SHARE.copy(),
        "tfp": TFP.copy(),
        "consumption_shares": CONSUMPTION_SHARES.copy(),
        "gov_spending_shares": GOV_SPENDING_SHARES.copy(),
        "investment_shares": INVESTMENT_SHARES.copy(),
        "tax_rates": TAX_RATES.copy(),
        "savings_rate": SAVINGS_RATE,
        "gov_transfer_share": GOV_TRANSFER_SHARE,
        "total_labor": TOTAL_LABOR,
        "total_capital": TOTAL_CAPITAL,
        "labor_by_sector": LABOR_BY_SECTOR.copy(),
        "capital_by_sector": CAPITAL_BY_SECTOR.copy(),
        "baseline_r": BASELINE_R,
    }


# ---------------------------------------------------------------------------
# Self-test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    params = get_baseline_params()
    print("=== Baseline Parameters ===")
    print(f"Sectors: {params['sectors']}")
    print(f"Output:  {params['baseline_output']}")
    print(f"TFP:     {np.round(params['tfp'], 4)}")
    print(f"Cons shares (beta): {np.round(params['consumption_shares'], 4)}")
    print(f"Total Labor:  {params['total_labor']:.2f}")
    print(f"Total Capital: {params['total_capital']:.2f}")
    print()

    sam_result = get_sam()
    v = sam_result["verification"]
    print("=== SAM Verification ===")
    print(f"Balanced: {v['balanced']}")
    print(f"Max diff: {v['max_difference']:.6f}")
    for i, name in enumerate(SAM_ACCOUNTS):
        print(f"  {name:12s}  row={v['row_sums'][i]:8.2f}  col={v['col_sums'][i]:8.2f}  diff={v['differences'][i]:.4f}")
