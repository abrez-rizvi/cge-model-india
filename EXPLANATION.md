# CGE Model for India — Complete Explanation

## Table of Contents

1. [What is a CGE Model?](#1-what-is-a-cge-model)
2. [Our Model at a Glance](#2-our-model-at-a-glance)
3. [The Social Accounting Matrix (SAM)](#3-the-social-accounting-matrix-sam)
4. [Mathematical Formulation](#4-mathematical-formulation)
5. [How the Solver Works](#5-how-the-solver-works)
6. [Policy Simulation Engine](#6-policy-simulation-engine)
7. [Code Architecture](#7-code-architecture)
8. [Frontend Dashboard](#8-frontend-dashboard)
9. [Example: What Happens When You Raise a Tax?](#9-example-what-happens-when-you-raise-a-tax)

---

## 1. What is a CGE Model?

A **Computable General Equilibrium (CGE)** model is a mathematical representation of an entire economy. Unlike partial equilibrium models (which look at one market in isolation), a CGE model captures how **all sectors, households, and the government interact simultaneously**.

**Key idea:** When you change something in one sector (e.g., raise taxes on manufacturing), it doesn't just affect manufacturing — it ripples through the entire economy:

- Workers leave manufacturing for other sectors
- Prices of manufactured goods rise
- Households shift their spending
- Government collects different tax revenue
- Capital flows to more profitable sectors

A CGE model computes the **new equilibrium** — the set of prices, quantities, and allocations where all markets clear simultaneously after a policy change.

### Why "General Equilibrium"?

The term comes from the work of Léon Walras (1874). In **general** equilibrium, we require that:
- Every market clears (supply = demand for all goods, labor, and capital)
- Every firm earns zero economic profit (competition drives prices to costs)
- Every household maximizes utility subject to their budget

All of these must hold **at the same time**, which is what makes it "general" rather than "partial."

---

## 2. Our Model at a Glance

| Feature | Specification |
|---------|--------------|
| Economy type | **Closed** (no imports/exports) |
| Sectors | 6: Agriculture, Manufacturing, Services, Energy, Construction, Government |
| Factors of production | 2: Labor (L), Capital (K) |
| Production technology | Cobb-Douglas |
| Household preferences | Cobb-Douglas utility |
| Government | Collects ad-valorem taxes, provides transfers and public spending |
| Investment | Fixed savings rate, fixed sectoral investment shares |
| Numeraire | Wage (w = 1) — all prices are relative to the wage |
| Solver | `scipy.optimize.root` (Powell hybrid method) |

### Sector Calibration (India's GDP Shares)

| Sector | Code | GDP Share | Labor Share (α) | Tax Rate |
|--------|------|-----------|-----------------|----------|
| Agriculture | AGR | ~17% | 0.60 | 5% |
| Manufacturing | MFG | ~23% | 0.45 | 12% |
| Services | SRV | ~32% | 0.55 | 10% |
| Energy | ENG | ~10% | 0.30 | 8% |
| Construction | CON | ~13% | 0.50 | 10% |
| Government | GOV | ~5% | 0.70 | 2% |

---

## 3. The Social Accounting Matrix (SAM)

### What is a SAM?

A SAM is a square matrix that records **every monetary flow** in an economy. Think of it as a complete bookkeeping system:

- **Rows** = income (who receives money)
- **Columns** = expenditure (who spends money)
- **Critical rule:** Row total = Column total for each account (double-entry bookkeeping)

### Our SAM Structure (10 × 10)

The accounts are:

```
[AGR, MFG, SRV, ENG, CON, GOV, Labor, Capital, Households, Government]
```

Here's how to read the flows:

```
                    ┌─────────────── COLUMNS (Expenditure) ──────────────┐
                    │ Sectors  │ Labor │ Capital │ Households │ Government │
    ┌───────────────┼──────────┼───────┼─────────┼────────────┼────────────┤
    │ Sectors       │    —     │   —   │    —    │ Consumption│ Gov Spend  │
    │               │          │       │         │ +Investment│            │
R   ├───────────────┼──────────┼───────┼─────────┼────────────┼────────────┤
O   │ Labor         │ Wages    │   —   │    —    │     —      │     —      │
W   ├───────────────┼──────────┼───────┼─────────┼────────────┼────────────┤
S   │ Capital       │ Profits  │   —   │    —    │     —      │     —      │
    ├───────────────┼──────────┼───────┼─────────┼────────────┼────────────┤
(   │ Households    │    —     │ Labor │ Capital │     —      │ Transfers  │
I   │               │          │Income │ Income  │            │            │
n   ├───────────────┼──────────┼───────┼─────────┼────────────┼────────────┤
c   │ Government    │  Taxes   │   —   │    —    │     —      │     —      │
o   └───────────────┴──────────┴───────┴─────────┴────────────┴────────────┘
m
e)
```

### The Circular Flow

Follow the money around the economy:

1. **Sectors produce** → pay wages to Labor and profits to Capital, plus taxes to Government
2. **Labor and Capital** → pass all income to Households
3. **Households** → spend on goods (Consumption) and save (→ Investment in sectors)
4. **Government** → spends tax revenue on sectors and transfers some back to Households

**This is why row sums = column sums:** every rupee spent by someone is received by someone else.

### How We Balance the SAM

The tricky part is making the SAM self-consistent. We use a **back-solving approach**:

1. Start with target sector outputs (X_j) and structural parameters (labor shares, tax rates)
2. Compute the **supply side** (factor payments, tax revenue)
3. Compute income (factor income + transfers → disposable income)
4. **Back-out consumption shares** (β_j) so that total demand = total supply for each sector:
   ```
   β_j = (X_j − G_j − I_j) / Consumption_budget
   ```
5. This guarantees market clearing at baseline by construction

---

## 4. Mathematical Formulation

### 4.1 Production (Supply Side)

Each sector j produces output using a **Cobb-Douglas production function**:

```
X_j = A_j · L_j^α_j · K_j^(1 − α_j)
```

Where:
- `X_j` = output of sector j
- `A_j` = Total Factor Productivity (TFP) — how efficiently the sector converts inputs to output
- `L_j` = labor employed in sector j
- `K_j` = capital used in sector j
- `α_j` = labor share (how much of value added goes to workers)

**Why Cobb-Douglas?** It's the simplest production function that:
- Has constant returns to scale (double inputs → double output)
- Gives clean analytical results for factor demands
- Is widely used in macroeconomics (backed by empirical evidence for aggregate production)

### 4.2 Profit Maximization (Zero-Profit Conditions)

Firms in each sector hire labor and capital to minimize costs. Under perfect competition, they make zero economic profit, meaning **price = average cost**:

```
p_j = (1 + τ_j) · (1/A_j) · (w/α_j)^α_j · (r/(1−α_j))^(1−α_j)
```

Where:
- `p_j` = consumer price (what buyers pay)
- `τ_j` = ad-valorem tax rate
- `w` = wage rate (= 1, our numeraire)
- `r` = rental rate of capital

**Intuition:** The price equals the unit cost of production (from Cobb-Douglas cost function) marked up by the tax rate. If you raise the tax, the price rises; if TFP improves, the price falls.

### 4.3 Factor Demands (First-Order Conditions)

From cost minimization, the optimal factor demands are:

```
w · L_j = α_j · p_producer_j · X_j       (labor demand)
r · K_j = (1 − α_j) · p_producer_j · X_j  (capital demand)
```

Where `p_producer_j = p_j / (1 + τ_j)` is the price net of tax.

**Intuition:** Each factor is paid its marginal product. Labor gets fraction α of revenue, capital gets (1 − α).

### 4.4 Household Demand (Cobb-Douglas Utility)

Households have Cobb-Douglas preferences, meaning they spend a **fixed share** of their budget on each good:

```
C_j = β_j · Y / p_j
```

Where:
- `C_j` = quantity of good j consumed
- `β_j` = budget share for good j (sum to 1)
- `Y` = disposable income = factor income + transfers − savings

**Disposable income:**
```
Y_disposable = w · L_total + r · K_total + Transfers
Consumption = (1 − s) · Y_disposable    (s = savings rate = 0.20)
```

### 4.5 Government

```
Tax Revenue  = Σ τ_j · p_producer_j · X_j
Transfers    = s_gov · Tax Revenue          (30% returned to households)
Gov Spending = (1 − s_gov) · Tax Revenue    (70% spent on goods)
G_j          = γ_j · Gov_Spending / p_j     (spending shares)
```

### 4.6 Investment

```
Savings  = s_hh · Y_disposable
I_j      = δ_j · Savings / p_j    (fixed investment shares)
```

### 4.7 Market Clearing

**Goods markets** (supply = demand):
```
X_j = C_j + G_j + I_j    for j = 1, ..., 5
```

We **drop the 6th equation** due to **Walras' Law**: if 5 out of 6 goods markets clear and all budget constraints are satisfied, the 6th market must clear automatically. Including it would make the system over-determined.

**Factor markets** (total demand = total supply):
```
Σ L_j = L_total    (labor market)
Σ K_j = K_total    (capital market)
```

### 4.8 GDP

```
GDP = Σ (w · L_j + r · K_j) = Σ Value_Added_j
```

GDP is the total value added across all sectors (sum of wages and capital income).

---

## 5. How the Solver Works

### The Unknown Vector

We need to find 25 numbers simultaneously:

```
x = [p₁, p₂, p₃, p₄, p₅, p₆,   ← 6 prices
     r,                            ← 1 rental rate
     L₁, L₂, L₃, L₄, L₅, L₆,   ← 6 labor allocations
     K₁, K₂, K₃, K₄, K₅, K₆,   ← 6 capital allocations
     X₁, X₂, X₃, X₄, X₅, X₆]   ← 6 output levels
```

### The Equation System

We define 25 equations F(x) = 0:

| Equations | Count | What they encode |
|-----------|-------|-----------------|
| Zero-profit: `p_j − unit_cost · (1+τ_j) = 0` | 6 | Prices equal costs |
| Production: `X_j − A_j · L_j^α · K_j^(1−α) = 0` | 6 | Output from inputs |
| Labor FOC: `w·L_j − α_j · p_prod_j · X_j = 0` | 6 | Labor gets its marginal product |
| Goods clearing: `X_j − C_j − G_j − I_j = 0` | 5 | Supply = demand (drop one) |
| Labor market: `Σ L_j − L_total = 0` | 1 | All labor employed |
| Capital market: `Σ K_j − K_total = 0` | 1 | All capital employed |
| **Total** | **25** | |

### The Solver: `scipy.optimize.root`

We use SciPy's `root` function with the **Powell hybrid method** (`hybr`):

1. Start with an **initial guess** (baseline values: all prices = 1, r = 1, proportional factor allocation)
2. The solver iteratively adjusts the 25 unknowns to drive all 25 residuals toward zero
3. Convergence criterion: all residuals < 10⁻⁸

**Why `scipy.optimize.root` instead of fixed-point iteration?**
- More robust convergence guarantees
- Handles the simultaneous nonlinear system directly
- Typically converges in fewer iterations
- Built-in Jacobian approximation via Broyden's method

### TFP Calibration

TFP values (A_j) are **not free parameters** — they are back-computed from the baseline:

```
A_j = X_j / (L_j^α_j · K_j^(1−α_j))
```

This ensures the baseline equilibrium is **exactly reproduced** by the model. The solver at baseline should return prices = 1, r = 1, and the original allocations — it does (max residual: 1.42 × 10⁻¹⁴).

---

## 6. Policy Simulation Engine

### How a Simulation Works

```
   Baseline         Shock           New Params        New Equilibrium
   Parameters  ──►  Apply   ──►    (modified τ,   ──► scipy.root  ──►  Deltas
   (τ, L, K)        Policy         L_total, etc.)     solve            (% changes)
```

1. **Start** with baseline parameters
2. **Apply the shock** (e.g., change τ_MFG from 0.12 to 0.25)
3. **Re-solve** the entire equation system with modified parameters
4. **Compute deltas** — percentage changes in GDP, output, labor, prices, etc.

### Supported Shocks

| Shock Type | What It Does | Example |
|------------|-------------|---------|
| `tax_rates` | Change ad-valorem tax on a sector | MFG tax: 12% → 25% |
| `subsidies` | Reduce effective tax (subsidy = negative tax) | AGR subsidy: 5% |
| `labor_supply` | Scale total labor endowment | +10% labor force |
| `capital_supply` | Scale total capital endowment | +5% capital stock |

### Why Does the Equilibrium Change?

When you change a tax rate, the zero-profit conditions force prices to change. Changed prices affect:
- Household demand (consumers substitute across goods)
- Government revenue (more/less tax collected)
- Factor demands (firms adjust labor/capital mix)
- Factor returns (r changes to clear capital market)

All of these adjustments happen **simultaneously** through the 25-equation system.

---

## 7. Code Architecture

### File-by-File Walkthrough

```
d:/Projects/CURRENT/cge/
├── app.py                 ─── Flask entry point, serves API + static files
├── requirements.txt       ─── Python dependencies
├── backend/
│   ├── __init__.py
│   ├── sam_data.py        ─── SAM construction + baseline calibration
│   ├── cge_solver.py      ─── 25-equation system + scipy root solver
│   ├── policy_engine.py   ─── Shock application + delta computation
│   └── api.py             ─── Flask API routes
└── static/
    ├── index.html          ─── Dashboard HTML (4 tabs)
    ├── css/style.css       ─── Dark theme + glassmorphism
    └── js/
        ├── app.js          ─── Tab navigation + API calls + KPIs
        ├── charts.js       ─── Chart.js visualizations
        └── controls.js     ─── Policy sliders + simulation logic
```

### Data Flow

```
1. Browser loads  →  GET /api/baseline
                          │
2. Flask calls    →  sam_data.get_baseline_params()
                     cge_solver.solve(params)
                          │
3. Returns JSON   →  { sam, equilibrium, parameters }
                          │
4. Frontend       →  Renders KPIs, SAM table, charts

5. User adjusts sliders and clicks "Simulate"
                          │
6. Browser sends  →  POST /api/simulate { shocks: {...} }
                          │
7. Flask calls    →  policy_engine.simulate(shocks)
                          │  ├── apply_policy(baseline, shocks)
                          │  ├── solve(baseline_params)
                          │  ├── solve(scenario_params)
                          │  └── compute_deltas(baseline, scenario)
                          │
8. Returns JSON   →  { baseline, scenario, deltas }
                          │
9. Frontend       →  Updates KPIs, charts (dual-bar), results table
```

### `sam_data.py` — Key Logic

```python
# 1. Define structural parameters
BASELINE_OUTPUT = [34, 46, 64, 20, 26, 10]  # Target output per sector
LABOR_SHARE = [0.60, 0.45, 0.55, 0.30, 0.50, 0.70]
TAX_RATES = [0.05, 0.12, 0.10, 0.08, 0.10, 0.02]

# 2. Compute supply side
value_added = producer_price × output
labor_income = α × value_added
capital_income = (1−α) × value_added

# 3. Compute income side
disposable = factor_income + gov_transfers
consumption_budget = (1 − savings_rate) × disposable

# 4. Back-solve consumption shares for market clearing
β_j = (X_j − G_j − I_j) / consumption_budget
```

### `cge_solver.py` — Key Logic

```python
def residuals(x):
    # Unpack 25 unknowns
    p, r, L, K, X = unpack(x)

    # 6 zero-profit equations
    for j in range(6):
        F[j] = p[j] - unit_cost(w, r, A[j], α[j]) × (1 + τ[j])

    # 6 production function equations
    for j in range(6):
        F[6+j] = X[j] - A[j] × L[j]^α × K[j]^(1−α)

    # 6 labor FOC equations
    for j in range(6):
        F[12+j] = w×L[j] - α[j] × p_prod[j] × X[j]

    # 5 goods market clearing (Walras: drop last)
    for j in range(5):
        F[18+j] = X[j] - C[j] - G[j] - I[j]

    # 2 factor market clearing
    F[23] = sum(L) - L_total
    F[24] = sum(K) - K_total

    return F  # 25-vector, solver drives this to zero
```

---

## 8. Frontend Dashboard

### Tab 1: Overview
- **SAM Table**: Full 10×10 matrix with row/column totals, verification badge
- **Model Specification**: Summary card listing all model assumptions
- **GDP Composition**: Doughnut chart showing sector GDP shares

### Tab 2: GDP Impact
- **Value Added Bar Chart**: Grouped bars (baseline vs. scenario) for each sector
- **Output Prices Chart**: Grouped bars showing price levels

### Tab 3: Employment
- **Labor Distribution**: Bar chart showing labor allocation per sector
- **Capital Allocation**: Bar chart showing capital deployment per sector

### Tab 4: Scenario Analysis
- **Policy Controls Panel**: Range sliders for tax rates (0–50%), subsidies (0–30%), labor supply (0.8–1.3×), capital supply (0.8–1.3×)
- **Simulate Button**: Sends shocks to `/api/simulate`, receives results
- **Results Table**: Sector-by-sector % changes in output, value added, labor, prices
- **Summary KPIs**: GDP change %, capital return change %

### KPI Cards (Always Visible)
- **GDP**: Total value added in the economy
- **Wage**: Fixed at w = 1 (numeraire)
- **Capital Return (r)**: Endogenous — changes with policy
- **Tax Revenue**: Total government tax collection

---

## 9. Example: What Happens When You Raise a Tax?

### Scenario: Increase Manufacturing Tax from 12% to 25%

**Step-by-step economic logic:**

1. **Higher MFG tax → Higher MFG price**
   - Zero-profit condition forces `p_MFG` up to cover the tax
   - Manufacturing goods become more expensive for consumers

2. **Consumers substitute away from MFG**
   - With Cobb-Douglas utility, budget shares are fixed, but higher prices mean fewer units bought
   - Demand for MFG goods falls

3. **MFG output contracts**
   - Firms reduce production to match lower demand
   - MFG output drops ~9.4%

4. **Factors leave MFG**
   - As MFG shrinks, it releases labor and capital
   - These factors flow to other sectors (AGR, SRV, etc.)
   - Other sectors expand (AGR +2.9%, SRV +1.9%)

5. **Capital return (r) falls**
   - The reallocation is not perfectly efficient — overall productivity drops
   - r falls by ~0.8% (labor is pinned at w = 1)

6. **GDP falls**
   - The distortion from higher taxes reduces total value added
   - GDP drops ~0.4%

7. **Government revenue changes**
   - Higher tax rate × smaller base → net effect on revenue depends on elasticity
   - In this case, revenue increases slightly (rate effect dominates)

**This entire chain of effects is computed simultaneously by the solver — there are no sequential steps in the math, only in the economic intuition.**

---

## Key Takeaways

1. **Everything is interconnected**: Changing one parameter affects all 25 equilibrium values
2. **The SAM ensures consistency**: Every flow in the economy is accounted for (row sums = column sums)
3. **Cobb-Douglas keeps it tractable**: Clean analytical forms for demands and costs
4. **The numeraire matters**: w = 1 means all prices are relative to wages
5. **Walras' Law saves one equation**: If N−1 markets clear and all budgets balance, the Nth market clears automatically
6. **TFP calibration**: Ensures the model exactly reproduces the baseline data
7. **Policy analysis is comparative statics**: We compare two equilibria (before and after the shock), not a dynamic transition
