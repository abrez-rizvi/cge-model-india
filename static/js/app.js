/**
 * India CGE Model — Main Application Logic
 * Handles tab navigation, API calls, and state management.
 */

const API_BASE = '';

// ---- Application State ----
const AppState = {
    baseline: null,
    scenario: null,
    activeTab: 'overview',
    loading: false,
};

// ---- API Layer ----
async function fetchBaseline() {
    const res = await fetch(`${API_BASE}/api/baseline`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

async function fetchSimulation(shocks) {
    const res = await fetch(`${API_BASE}/api/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shocks }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `API error: ${res.status}`);
    }
    return res.json();
}

// ---- Tab Navigation ----
function initTabs() {
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
}

function switchTab(tabName) {
    AppState.activeTab = tabName;
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    // Update panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `panel-${tabName}`);
    });
}

// ---- KPI Updates ----
function updateKPIs(equilibrium, deltas) {
    // GDP
    const gdpEl = document.getElementById('kpi-gdp-value');
    const gdpDelta = document.getElementById('kpi-gdp-delta');
    gdpEl.textContent = `₹ ${equilibrium.gdp.toFixed(2)}`;

    if (deltas) {
        const pct = deltas.gdp.percent;
        gdpDelta.textContent = `${pct >= 0 ? '+' : ''}${pct.toFixed(3)}%`;
        gdpDelta.className = `kpi-delta ${pct >= 0 ? 'positive' : 'negative'}`;
    } else {
        gdpDelta.textContent = 'Baseline';
        gdpDelta.className = 'kpi-delta';
    }

    // Capital return
    const rEl = document.getElementById('kpi-capital-value');
    const rDelta = document.getElementById('kpi-capital-delta');
    rEl.textContent = `r = ${equilibrium.rental_rate.toFixed(4)}`;

    if (deltas) {
        const pct = deltas.rental_rate.percent;
        rDelta.textContent = `${pct >= 0 ? '+' : ''}${pct.toFixed(3)}%`;
        rDelta.className = `kpi-delta ${pct >= 0 ? 'positive' : 'negative'}`;
    } else {
        rDelta.textContent = 'Baseline';
        rDelta.className = 'kpi-delta';
    }

    // Tax revenue
    const taxEl = document.getElementById('kpi-tax-value');
    const taxDelta = document.getElementById('kpi-tax-delta');
    taxEl.textContent = `₹ ${equilibrium.tax_revenue.toFixed(2)}`;

    if (deltas && AppState.baseline) {
        const baseTax = AppState.baseline.equilibrium.tax_revenue;
        const pct = ((equilibrium.tax_revenue - baseTax) / baseTax) * 100;
        taxDelta.textContent = `${pct >= 0 ? '+' : ''}${pct.toFixed(3)}%`;
        taxDelta.className = `kpi-delta ${pct >= 0 ? 'positive' : 'negative'}`;
    } else {
        taxDelta.textContent = 'Baseline';
        taxDelta.className = 'kpi-delta';
    }
}

// ---- SAM Table ----
function renderSAMTable(samData) {
    const table = document.getElementById('sam-table');
    const accounts = samData.accounts;
    const matrix = samData.matrix;

    let html = '<thead><tr><th></th>';
    accounts.forEach(a => { html += `<th>${a}</th>`; });
    html += '<th>Total</th></tr></thead><tbody>';

    matrix.forEach((row, i) => {
        const rowSum = row.reduce((a, b) => a + b, 0);
        html += `<tr><td>${accounts[i]}</td>`;
        row.forEach(val => {
            const cls = val > 0.001 ? 'cell-nonzero' : 'cell-zero';
            html += `<td class="${cls}">${val > 0.001 ? val.toFixed(2) : '—'}</td>`;
        });
        html += `<td class="cell-nonzero" style="font-weight:600">${rowSum.toFixed(2)}</td>`;
        html += '</tr>';
    });

    // Column totals row
    html += '<tr style="font-weight:600"><td>Total</td>';
    for (let j = 0; j < accounts.length; j++) {
        let colSum = 0;
        matrix.forEach(row => { colSum += row[j]; });
        html += `<td class="cell-nonzero">${colSum.toFixed(2)}</td>`;
    }
    let grandTotal = 0;
    matrix.forEach(row => row.forEach(v => { grandTotal += v; }));
    html += `<td class="cell-nonzero">${grandTotal.toFixed(2)}</td></tr>`;
    html += '</tbody>';

    table.innerHTML = html;

    // Update status badge
    const badge = document.getElementById('sam-status');
    badge.textContent = samData.verification.balanced ? 'Balanced ✓' : 'Imbalanced ✗';
    badge.className = `badge ${samData.verification.balanced ? 'badge-info' : ''}`;
}

// ---- Solver Status ----
function updateSolverStatus(converged) {
    const badge = document.getElementById('solver-status');
    const dot = badge.querySelector('.status-dot');
    const text = badge.querySelector('span:last-child');
    if (converged) {
        dot.classList.add('online');
        text.textContent = 'Equilibrium Solved';
    } else {
        dot.classList.remove('online');
        text.textContent = 'Not Converged';
    }
}

// ---- Initialize ----
async function init() {
    initTabs();

    try {
        const data = await fetchBaseline();
        AppState.baseline = data;

        updateSolverStatus(data.equilibrium.converged);
        updateKPIs(data.equilibrium, null);
        renderSAMTable(data.sam);
        initCharts(data);
        initControls(data.parameters);
    } catch (err) {
        console.error('Failed to load baseline:', err);
        updateSolverStatus(false);
    }
}

document.addEventListener('DOMContentLoaded', init);
