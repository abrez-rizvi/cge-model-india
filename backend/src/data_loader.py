import csv
import os
import numpy as np

# Mapping of 42 IFPRI activities to 6 user-friendly sectors
SECTOR_MAP = {
    # Agriculture
    "amaiz": "Agriculture", "arice": "Agriculture", "aocer": "Agriculture", 
    "apuls": "Agriculture", "aoils": "Agriculture", "aroot": "Agriculture", 
    "avege": "Agriculture", "asugr": "Agriculture", "atoba": "Agriculture", 
    "acott": "Agriculture", "afrui": "Agriculture", "acoff": "Agriculture", 
    "aocrp": "Agriculture", "acatt": "Agriculture", "apoul": "Agriculture", 
    "aoliv": "Agriculture", "afore": "Agriculture", "afish": "Agriculture",
    
    # Manufacturing
    "afood": "Manufacturing", "abeve": "Manufacturing", "atext": "Manufacturing", 
    "awood": "Manufacturing", "achem": "Manufacturing", "anmet": "Manufacturing", 
    "ametl": "Manufacturing", "amach": "Manufacturing", "aoman": "Manufacturing",
    
    # Services
    "atrad": "Services", "atran": "Services", "ahotl": "Services", 
    "acomm": "Services", "afsrv": "Services", "areal": "Services", 
    "absrv": "Services", "aosrv": "Services", "aeduc": "Services", 
    "aheal": "Services",
    
    # Energy & Mining
    "aelec": "Energy & Mining", "awatr": "Energy & Mining", "amine": "Energy & Mining",
    
    # Construction
    "acons": "Construction",
    
    # Government
    "apadm": "Public Administration"
}

SECTORS = ["Agriculture", "Manufacturing", "Services", "Energy & Mining", "Construction", "Public Administration"]
LABOR_TYPES = ["Unskilled", "Semi-Skilled", "Skilled"]
FACTORS = LABOR_TYPES + ["Capital", "Land"]

# Household Groups (raw)
RAW_HHD = [f"hhd-r{i}" for i in range(1, 6)] + [f"hhd-u{i}" for i in range(1, 6)]

# Household Display Groups (aggregated for UI)
HHD_GROUPS = [
    "Rural Lower", "Rural Middle", "Rural Upper",
    "Urban Lower", "Urban Middle", "Urban Upper"
]
HHD_MAP = {
    "hhd-r1": "Rural Lower", "hhd-r2": "Rural Lower",
    "hhd-r3": "Rural Middle", "hhd-r4": "Rural Middle",
    "hhd-r5": "Rural Upper",
    "hhd-u1": "Urban Lower", "hhd-u2": "Urban Lower",
    "hhd-u3": "Urban Middle", "hhd-u4": "Urban Middle",
    "hhd-u5": "Urban Upper"
}

def load_sam(csv_path):
    """
    Load and aggregate the IFPRI SAM into a balanced framework.
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"SAM file not found at {csv_path}")

    with open(csv_path, 'r') as f:
        reader = csv.reader(f)
        header = next(reader)
        data = list(reader)

    codes = header[2:] 
    code_to_idx = {code: i for i, code in enumerate(codes)}
    
    def get_val(row_code, col_code):
        row_idx = None
        for i, r in enumerate(data):
            if r[1] == row_code:
                row_idx = i
                break
        if row_idx is None: return 0.0
        
        try:
            col_idx = code_to_idx[col_code] + 2
            val_str = data[row_idx][col_idx]
            return float(val_str) if val_str else 0.0
        except (ValueError, KeyError, IndexError):
            return 0.0

    # 1. Total Scaling Factor
    total_output_raw = sum(get_val(act, "total") for act in SECTOR_MAP.keys())
    scale = 1000.0 / total_output_raw

    # 2. Sectoral Totals
    labor_payments = {s: {lt: 0.0 for lt in LABOR_TYPES} for s in SECTORS}
    labor_codes = {"Unskilled": "flab-n", "Semi-Skilled": "flab-p", "Skilled": "flab-s"}
    capital_payments = {s: 0.0 for s in SECTORS}
    land_payments = {s: 0.0 for s in SECTORS}
    tax_revenue = {s: 0.0 for s in SECTORS}

    for act_code, sector in SECTOR_MAP.items():
        for lt_name, lt_code in labor_codes.items():
            labor_payments[sector][lt_name] += get_val(lt_code, act_code)
        capital_payments[sector] += get_val("fcap", act_code)
        land_payments[sector] += get_val("flnd", act_code)
        tax_revenue[sector] += get_val("atax", act_code)

    # 3. Income Distribution Weights (Factors to Households)
    # How much of factor 'f' total income goes to household 'h'
    factor_to_hhd = np.zeros((len(FACTORS), len(RAW_HHD)))
    factor_raw_codes = ["flab-n", "flab-p", "flab-s", "fcap", "flnd"]
    
    for f_idx, f_code in enumerate(factor_raw_codes):
        total_f_income = get_val(f_code, "total")
        if total_f_income > 0:
            for h_idx, h_code in enumerate(RAW_HHD):
                factor_to_hhd[f_idx, h_idx] = get_val(h_code, f_code) / total_f_income

    # 4. Household Consumption and Savings
    # beta[j, h]
    hhd_consumption_matrix = np.zeros((len(SECTORS), len(RAW_HHD)))
    hhd_savings = np.zeros(len(RAW_HHD))
    hhd_total_income = np.zeros(len(RAW_HHD))
    hhd_gov_transfers = np.zeros(len(RAW_HHD))

    for h_idx, h_code in enumerate(RAW_HHD):
        # Total Income for group h
        hhd_total_income[h_idx] = get_val("total", h_code) * scale
        # Transfers from Gov to HHD
        hhd_gov_transfers[h_idx] = get_val(h_code, "gov") * scale
        # Savings
        hhd_savings[h_idx] = get_val("s-i", h_code) * scale
        
        # Consumption by sector
        group_total_cons = 0
        group_cons_by_sector = {s: 0.0 for s in SECTORS}
        for act_code, sector in SECTOR_MAP.items():
            comm_code = "c" + act_code[1:]
            val = get_val(comm_code, h_code)
            group_cons_by_sector[sector] += val
            group_total_cons += val
        
        if group_total_cons > 0:
            for s_idx, sector in enumerate(SECTORS):
                hhd_consumption_matrix[s_idx, h_idx] = group_cons_by_sector[sector] / group_total_cons

    # Calculate individual savings rates
    # s = savings / (factor_income + transfers)
    hhd_savings_rates = np.zeros(len(RAW_HHD))
    for h_idx in range(len(RAW_HHD)):
        if hhd_total_income[h_idx] > 0:
            hhd_savings_rates[h_idx] = hhd_savings[h_idx] / hhd_total_income[h_idx]

    # 5. Build Result Dictionary
    results = {
        "sectors": SECTORS,
        "labor_types": LABOR_TYPES,
        "hhd_names": RAW_HHD,
        "hhd_groups": HHD_GROUPS,
        "hhd_map": HHD_MAP,
        
        # Production Side
        "output": np.zeros(len(SECTORS)),
        "tax_rates": np.zeros(len(SECTORS)),
        "labor_shares": np.zeros((len(SECTORS), len(LABOR_TYPES))),
        "capital_shares": np.zeros(len(SECTORS)),
        "land_shares": np.zeros(len(SECTORS)),
        
        # Distribution Side
        "factor_to_hhd": factor_to_hhd,
        "hhd_consumption_shares": hhd_consumption_matrix,
        "hhd_savings_rates": hhd_savings_rates,
        "hhd_gov_transfers": hhd_gov_transfers,
        
        # Factors by sector
        "labor": None,   # Will be filled below
        "capital": None,
        "land": None,

        # Gov & Investment (Aggregated)
        "gov_spending_shares": np.ones(len(SECTORS))/len(SECTORS), # Placeholder
        "investment_shares": np.ones(len(SECTORS))/len(SECTORS), # Placeholder
    }

    # Aggregate Sectoral production parameters
    L = np.zeros((len(SECTORS), len(LABOR_TYPES)))
    K = np.zeros(len(SECTORS))
    Land = np.zeros(len(SECTORS))
    for i, s in enumerate(SECTORS):
        for j, lt in enumerate(LABOR_TYPES):
            L[i, j] = labor_payments[s][lt] * scale
        K[i] = capital_payments[s] * scale
        Land[i] = land_payments[s] * scale
        
        # Total Sector VA (Output in our simplified model)
        tax_s = tax_revenue[s] * scale
        va_s = L[i].sum() + K[i] + Land[i] + tax_s
        results["output"][i] = va_s
        
        # Factor shares (normalize VA without taxes)
        factor_sum = L[i].sum() + K[i] + Land[i]
        if factor_sum > 0:
            results["labor_shares"][i] = L[i] / factor_sum
            results["capital_shares"][i] = K[i] / factor_sum
            results["land_shares"][i] = Land[i] / factor_sum
            results["tax_rates"][i] = tax_s / factor_sum
            
    results["total_labor"] = L.sum(axis=0)
    results["total_capital"] = K.sum()
    results["total_land"] = Land.sum()
    results["labor"] = L
    results["capital"] = K
    results["land"] = Land

    # Inter-sectoral (for visualization only)
    sam_matrix = np.zeros((len(SECTORS), len(SECTORS)))
    for act_col, sector_col in SECTOR_MAP.items():
        c_idx = SECTORS.index(sector_col)
        for act_row, sector_row in SECTOR_MAP.items():
            r_idx = SECTORS.index(sector_row)
            sam_matrix[r_idx, c_idx] += get_val("c"+act_row[1:], act_col) * scale
    results["sam_matrix"] = sam_matrix

    return results

if __name__ == "__main__":
    path = os.path.join(os.path.dirname(__file__), "..", "data", "IFPRI_SAM_IND_2022-23_SAM.csv")
    res = load_sam(path)
    print("=== Multi-Household SAM Loaded ===")
    print(f"Income Share (flab-s) to Urban Rich (hhd-u5): {res['factor_to_hhd'][2, 9]:.2%}")
    print(f"Savings Rate (Urban Rich): {res['hhd_savings_rates'][9]:.2%}")
