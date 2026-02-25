/**
 * India CGE Model — Policy Controls
 * Tax/subsidy sliders, factor supply inputs, simulation trigger, results table.
 */

const SECTORS_META = [
    { code: 'AGR', name: 'Agriculture' },
    { code: 'MFG', name: 'Manufacturing' },
    { code: 'SRV', name: 'Services' },
    { code: 'ENG', name: 'Energy' },
    { code: 'CON', name: 'Construction' },
    { code: 'GOV', name: 'Government' },
];

let baselineTaxRates = {};
let currentShocks = {};

function initControls(params) {
    baselineTaxRates = {};
    params.sectors.forEach((s, i) => {
        baselineTaxRates[s] = params.tax_rates[i];
    });

    buildTaxSliders();
    buildSubsidySliders();
    bindFactorSliders();
    bindButtons();
}

// ---- Tax Rate Sliders ----
function buildTaxSliders() {
    const container = document.getElementById('tax-sliders');
    container.innerHTML = '';

    SECTORS_META.forEach(sec => {
        const baseRate = baselineTaxRates[sec.code] || 0.1;
        const group = document.createElement('div');
        group.className = 'slider-group';
        group.innerHTML = `
            <label class="slider-label">
                <span>${sec.name}</span>
                <span class="slider-value" id="tax-val-${sec.code}">${(baseRate * 100).toFixed(0)}%</span>
            </label>
            <input type="range" class="policy-slider tax-slider"
                   id="slider-tax-${sec.code}"
                   data-sector="${sec.code}"
                   min="0" max="50" step="1"
                   value="${(baseRate * 100).toFixed(0)}">
        `;
        container.appendChild(group);

        const slider = group.querySelector('input');
        slider.addEventListener('input', () => {
            document.getElementById(`tax-val-${sec.code}`).textContent = `${slider.value}%`;
        });
    });
}

// ---- Subsidy Sliders ----
function buildSubsidySliders() {
    const container = document.getElementById('subsidy-sliders');
    container.innerHTML = '';

    SECTORS_META.forEach(sec => {
        const group = document.createElement('div');
        group.className = 'slider-group';
        group.innerHTML = `
            <label class="slider-label">
                <span>${sec.name}</span>
                <span class="slider-value" id="sub-val-${sec.code}">0%</span>
            </label>
            <input type="range" class="policy-slider subsidy-slider"
                   id="slider-sub-${sec.code}"
                   data-sector="${sec.code}"
                   min="0" max="30" step="1"
                   value="0">
        `;
        container.appendChild(group);

        const slider = group.querySelector('input');
        slider.addEventListener('input', () => {
            document.getElementById(`sub-val-${sec.code}`).textContent = `${slider.value}%`;
        });
    });
}

// ---- Factor Supply Sliders ----
function bindFactorSliders() {
    const laborSlider = document.getElementById('slider-labor-supply');
    const capitalSlider = document.getElementById('slider-capital-supply');

    laborSlider.addEventListener('input', () => {
        document.getElementById('labor-supply-val').textContent = `${parseFloat(laborSlider.value).toFixed(2)}×`;
    });
    capitalSlider.addEventListener('input', () => {
        document.getElementById('capital-supply-val').textContent = `${parseFloat(capitalSlider.value).toFixed(2)}×`;
    });
}

// ---- Collect Shocks ----
function collectShocks() {
    const shocks = {};

    // Tax rates
    const taxRates = {};
    let hasTaxChange = false;
    SECTORS_META.forEach(sec => {
        const slider = document.getElementById(`slider-tax-${sec.code}`);
        const newRate = parseInt(slider.value) / 100;
        const baseRate = baselineTaxRates[sec.code];
        if (Math.abs(newRate - baseRate) > 0.001) {
            taxRates[sec.code] = newRate;
            hasTaxChange = true;
        }
    });
    if (hasTaxChange) shocks.tax_rates = taxRates;

    // Subsidies
    const subsidies = {};
    let hasSubsidy = false;
    SECTORS_META.forEach(sec => {
        const slider = document.getElementById(`slider-sub-${sec.code}`);
        const subRate = parseInt(slider.value) / 100;
        if (subRate > 0.001) {
            subsidies[sec.code] = subRate;
            hasSubsidy = true;
        }
    });
    if (hasSubsidy) shocks.subsidies = subsidies;

    // Factor supply
    const laborMult = parseFloat(document.getElementById('slider-labor-supply').value);
    if (Math.abs(laborMult - 1.0) > 0.001) shocks.labor_supply = laborMult;

    const capitalMult = parseFloat(document.getElementById('slider-capital-supply').value);
    if (Math.abs(capitalMult - 1.0) > 0.001) shocks.capital_supply = capitalMult;

    return shocks;
}

// ---- Button Handlers ----
function bindButtons() {
    const simBtn = document.getElementById('btn-simulate');
    const resetBtn = document.getElementById('btn-reset');

    simBtn.addEventListener('click', runSimulation);
    resetBtn.addEventListener('click', resetAll);
}

async function runSimulation() {
    const simBtn = document.getElementById('btn-simulate');
    const badge = document.getElementById('sim-status-badge');

    const shocks = collectShocks();
    if (Object.keys(shocks).length === 0) {
        badge.textContent = 'No changes';
        return;
    }

    simBtn.disabled = true;
    badge.textContent = 'Solving...';

    try {
        const result = await fetchSimulation(shocks);

        if (result.error) {
            badge.textContent = 'Error';
            renderErrorResult(result.error);
            return;
        }

        AppState.scenario = result;

        // Update KPIs with scenario
        updateKPIs(result.scenario, result.deltas);

        // Update charts
        updateChartsWithScenario(result);

        // Render results table
        renderResultsTable(result);

        badge.textContent = 'Converged ✓';
        badge.className = 'badge badge-info';

    } catch (err) {
        console.error('Simulation error:', err);
        badge.textContent = 'Failed';
        renderErrorResult(err.message);
    } finally {
        simBtn.disabled = false;
    }
}

function resetAll() {
    // Reset sliders
    SECTORS_META.forEach(sec => {
        const taxSlider = document.getElementById(`slider-tax-${sec.code}`);
        const subSlider = document.getElementById(`slider-sub-${sec.code}`);
        const baseRate = baselineTaxRates[sec.code];
        taxSlider.value = (baseRate * 100).toFixed(0);
        subSlider.value = 0;
        document.getElementById(`tax-val-${sec.code}`).textContent = `${(baseRate * 100).toFixed(0)}%`;
        document.getElementById(`sub-val-${sec.code}`).textContent = '0%';
    });
    document.getElementById('slider-labor-supply').value = 1.0;
    document.getElementById('slider-capital-supply').value = 1.0;
    document.getElementById('labor-supply-val').textContent = '1.00×';
    document.getElementById('capital-supply-val').textContent = '1.00×';

    // Reset state
    AppState.scenario = null;

    // Reset KPIs
    if (AppState.baseline) {
        updateKPIs(AppState.baseline.equilibrium, null);
    }

    // Reset charts
    resetChartsToBaseline();

    // Reset results
    const container = document.getElementById('results-container');
    container.innerHTML = `
        <div class="placeholder-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M8 40V16l8-8h16l8 8v24l-8 0H8z"/>
                <path d="M16 28h16M16 34h10"/>
            </svg>
        </div>
        <p>Adjust policy parameters and click <b>Simulate</b> to see results</p>
    `;
    container.className = 'results-placeholder';

    // Reset badge
    const badge = document.getElementById('sim-status-badge');
    badge.textContent = 'No simulation';
    badge.className = 'badge';
}

// ---- Results Table ----
function renderResultsTable(result) {
    const container = document.getElementById('results-container');
    container.className = '';

    const sectors = Object.keys(result.baseline.output);
    const d = result.deltas;

    let html = `
        <div style="margin-bottom: 1rem;">
            <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
                <div class="result-card">
                    <span style="color: var(--text-muted); font-size: 0.7rem;">GDP Change</span>
                    <span class="${d.gdp.percent >= 0 ? 'change-positive' : 'change-negative'}" style="font-size: 1.1rem; font-weight: 700;">
                        ${d.gdp.percent >= 0 ? '+' : ''}${d.gdp.percent.toFixed(3)}%
                    </span>
                </div>
                <div class="result-card">
                    <span style="color: var(--text-muted); font-size: 0.7rem;">Capital Return (r)</span>
                    <span class="${d.rental_rate.percent >= 0 ? 'change-positive' : 'change-negative'}" style="font-size: 1.1rem; font-weight: 700;">
                        ${d.rental_rate.percent >= 0 ? '+' : ''}${d.rental_rate.percent.toFixed(3)}%
                    </span>
                </div>
            </div>
        </div>
        <table class="results-table">
            <thead>
                <tr>
                    <th>Sector</th>
                    <th>Output Δ%</th>
                    <th>Value Added Δ%</th>
                    <th>Labor Δ%</th>
                    <th>Price Δ%</th>
                </tr>
            </thead>
            <tbody>
    `;

    sectors.forEach(s => {
        const outPct = d.output[s].percent;
        const vaPct = d.value_added[s].percent;
        const labPct = d.labor[s].percent;
        const prcPct = d.prices[s].percent;

        html += `
            <tr>
                <td class="sector-cell">${SECTOR_LABELS[s] || s}</td>
                <td class="${outPct >= 0 ? 'change-positive' : 'change-negative'}">${outPct >= 0 ? '+' : ''}${outPct.toFixed(2)}%</td>
                <td class="${vaPct >= 0 ? 'change-positive' : 'change-negative'}">${vaPct >= 0 ? '+' : ''}${vaPct.toFixed(2)}%</td>
                <td class="${labPct >= 0 ? 'change-positive' : 'change-negative'}">${labPct >= 0 ? '+' : ''}${labPct.toFixed(2)}%</td>
                <td class="${prcPct >= 0 ? 'change-positive' : 'change-negative'}">${prcPct >= 0 ? '+' : ''}${prcPct.toFixed(2)}%</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

function renderErrorResult(message) {
    const container = document.getElementById('results-container');
    container.className = 'results-placeholder';
    container.innerHTML = `
        <div style="color: var(--accent-rose);">
            <svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 10.5a.75.75 0 110-1.5.75.75 0 010 1.5zM8.75 4.5v4a.75.75 0 01-1.5 0v-4a.75.75 0 011.5 0z"/>
            </svg>
        </div>
        <p style="color: var(--accent-rose);">${message}</p>
    `;
}
