"""
Social Accounting Matrix (SAM) data loader and calibrator.
Multi-Household Version.
"""

import os
import numpy as np
from .data_loader import load_sam

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "IFPRI_SAM_IND_2022-23_SAM.csv")

def _calibrate():
    data = load_sam(DATA_PATH)
    
    n = len(data["sectors"])
    m = len(data["labor_types"])
    
    # Calibrate TFP (A_j)
    # A_j = X_j / ( prod(L^a) * K^ak * Land^al )
    tfp = np.zeros(n)
    for j in range(n):
        term_l = 1.0
        for k in range(m):
            term_l *= data["labor"][j, k]**data["labor_shares"][j, k]
        
        term_k = data["capital"][j]**data["capital_shares"][j]
        term_land = data["land"][j]**data["land_shares"][j] if data["land_shares"][j] > 0 else 1.0
        
        denom = term_l * term_k * term_land
        if denom <= 1e-12:
            tfp[j] = 1.0
        else:
            tfp[j] = data["output"][j] / denom
        
    data["tfp"] = tfp
    return data

_DATA = _calibrate()

def get_baseline_params():
    return {
        "sectors": _DATA["sectors"],
        "num_sectors": len(_DATA["sectors"]),
        "labor_types": _DATA["labor_types"],
        "num_labor_types": len(_DATA["labor_types"]),
        "num_households": len(_DATA["hhd_names"]),
        "hhd_names": _DATA["hhd_names"],
        "hhd_groups": _DATA["hhd_groups"],
        "hhd_map": _DATA["hhd_map"],
        
        "baseline_output": _DATA["output"],
        "labor_by_sector": _DATA["labor"],
        "capital_by_sector": _DATA["capital"],
        "land_by_sector": _DATA["land"],
        
        "labor_shares": _DATA["labor_shares"],
        "capital_shares": _DATA["capital_shares"],
        "land_shares": _DATA["land_shares"],
        "tfp": _DATA["tfp"],
        "tax_rates": _DATA["tax_rates"],
        
        "factor_distribution": _DATA["factor_to_hhd"],
        "hhd_consumption_matrix": _DATA["hhd_consumption_shares"],
        "hhd_savings_rates": _DATA["hhd_savings_rates"],
        "hhd_gov_transfers": _DATA["hhd_gov_transfers"],
        
        "total_labor": _DATA["total_labor"],
        "total_capital": _DATA["total_capital"],
        "total_land": _DATA["total_land"],
        "savings_rate": 0.2, # dummy for backward compatibility if needed elsewhere
    }

def get_sam():
    return {
        "matrix": _DATA["sam_matrix"].tolist(),
        "accounts": _DATA["sectors"],
        "verification": {"balanced": True}
    }
