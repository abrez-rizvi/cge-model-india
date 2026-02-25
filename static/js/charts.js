/**
 * India CGE Model — Chart Rendering
 * GDP impact, employment, prices, and GDP composition charts using Chart.js.
 */

// Sector colors (consistent across all charts)
const SECTOR_COLORS = {
    AGR: { bg: 'rgba(16, 185, 129, 0.7)', border: '#10b981' },  // Emerald
    MFG: { bg: 'rgba(99, 102, 241, 0.7)', border: '#6366f1' },  // Indigo
    SRV: { bg: 'rgba(168, 85, 247, 0.7)', border: '#a855f7' },  // Purple
    ENG: { bg: 'rgba(245, 158, 11, 0.7)', border: '#f59e0b' },  // Amber
    CON: { bg: 'rgba(34, 211, 238, 0.7)', border: '#22d3ee' },   // Cyan
    GOV: { bg: 'rgba(244, 63, 94, 0.7)', border: '#f43f5e' },    // Rose
};

const SECTOR_LABELS = {
    AGR: 'Agriculture',
    MFG: 'Manufacturing',
    SRV: 'Services',
    ENG: 'Energy',
    CON: 'Construction',
    GOV: 'Government',
};

// Global Chart.js defaults
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyleWidth = 12;
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.95)';
Chart.defaults.plugins.tooltip.titleFont = { weight: '600' };
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.plugins.tooltip.borderColor = 'rgba(99,102,241,0.3)';
Chart.defaults.plugins.tooltip.borderWidth = 1;

// Chart instances
let chartGDPPie = null;
let chartGDPBar = null;
let chartPrices = null;
let chartLaborBar = null;
let chartCapitalBar = null;

function initCharts(baselineData) {
    const eq = baselineData.equilibrium;
    const sectors = Object.keys(eq.gdp_shares);

    createGDPPieChart(eq);
    createGDPBarChart(eq);
    createPricesChart(eq);
    createLaborChart(eq);
    createCapitalChart(eq);
}

// ---- GDP Composition Pie ----
function createGDPPieChart(eq) {
    const ctx = document.getElementById('chart-gdp-pie').getContext('2d');
    const sectors = Object.keys(eq.gdp_shares);

    chartGDPPie = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: sectors.map(s => SECTOR_LABELS[s] || s),
            datasets: [{
                data: sectors.map(s => eq.gdp_shares[s] * 100),
                backgroundColor: sectors.map(s => SECTOR_COLORS[s]?.bg || '#666'),
                borderColor: sectors.map(s => SECTOR_COLORS[s]?.border || '#888'),
                borderWidth: 2,
                hoverOffset: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '55%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: { padding: 12 },
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${ctx.parsed.toFixed(1)}%`
                    }
                }
            },
            animation: { animateRotate: true, duration: 800 },
        }
    });
}

// ---- GDP Value Added Bar Chart ----
function createGDPBarChart(eq) {
    const ctx = document.getElementById('chart-gdp-bar').getContext('2d');
    const sectors = Object.keys(eq.value_added);

    chartGDPBar = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sectors.map(s => SECTOR_LABELS[s] || s),
            datasets: [{
                label: 'Baseline',
                data: sectors.map(s => eq.value_added[s]),
                backgroundColor: sectors.map(s => SECTOR_COLORS[s]?.bg || '#666'),
                borderColor: sectors.map(s => SECTOR_COLORS[s]?.border || '#888'),
                borderWidth: 1.5,
                borderRadius: 6,
                barPercentage: 0.7,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ₹ ${ctx.parsed.y.toFixed(2)}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Value Added (₹)' },
                    grid: { color: 'rgba(255,255,255,0.04)' },
                },
                x: {
                    grid: { display: false },
                }
            },
            animation: { duration: 600 },
        }
    });
}

// ---- Prices Chart ----
function createPricesChart(eq) {
    const ctx = document.getElementById('chart-prices').getContext('2d');
    const sectors = Object.keys(eq.prices);

    chartPrices = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sectors.map(s => SECTOR_LABELS[s] || s),
            datasets: [{
                label: 'Baseline',
                data: sectors.map(s => eq.prices[s]),
                backgroundColor: 'rgba(99, 102, 241, 0.5)',
                borderColor: '#6366f1',
                borderWidth: 1.5,
                borderRadius: 6,
                barPercentage: 0.6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(4)}`
                    }
                }
            },
            scales: {
                y: {
                    title: { display: true, text: 'Price Level' },
                    grid: { color: 'rgba(255,255,255,0.04)' },
                },
                x: { grid: { display: false } }
            },
            animation: { duration: 600 },
        }
    });
}

// ---- Labor Bar Chart ----
function createLaborChart(eq) {
    const ctx = document.getElementById('chart-labor-bar').getContext('2d');
    const sectors = Object.keys(eq.labor);

    chartLaborBar = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sectors.map(s => SECTOR_LABELS[s] || s),
            datasets: [{
                label: 'Baseline',
                data: sectors.map(s => eq.labor[s]),
                backgroundColor: sectors.map(s => SECTOR_COLORS[s]?.bg || '#666'),
                borderColor: sectors.map(s => SECTOR_COLORS[s]?.border || '#888'),
                borderWidth: 1.5,
                borderRadius: 6,
                barPercentage: 0.7,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} units`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Labor Allocation' },
                    grid: { color: 'rgba(255,255,255,0.04)' },
                },
                x: { grid: { display: false } }
            },
            animation: { duration: 600 },
        }
    });
}

// ---- Capital Bar Chart ----
function createCapitalChart(eq) {
    const ctx = document.getElementById('chart-capital-bar').getContext('2d');
    const sectors = Object.keys(eq.capital);

    chartCapitalBar = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sectors.map(s => SECTOR_LABELS[s] || s),
            datasets: [{
                label: 'Baseline',
                data: sectors.map(s => eq.capital[s]),
                backgroundColor: sectors.map(s => SECTOR_COLORS[s]?.bg || '#666'),
                borderColor: sectors.map(s => SECTOR_COLORS[s]?.border || '#888'),
                borderWidth: 1.5,
                borderRadius: 6,
                barPercentage: 0.7,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} units`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Capital Allocation' },
                    grid: { color: 'rgba(255,255,255,0.04)' },
                },
                x: { grid: { display: false } }
            },
            animation: { duration: 600 },
        }
    });
}

// ---- Update Charts with Scenario Data ----
function updateChartsWithScenario(simResult) {
    const baseline = simResult.baseline;
    const scenario = simResult.scenario;
    const sectors = Object.keys(baseline.output);

    // Update GDP bar (add scenario dataset)
    chartGDPBar.data.datasets = [
        {
            label: 'Baseline',
            data: sectors.map(s => baseline.value_added[s]),
            backgroundColor: sectors.map(s => SECTOR_COLORS[s]?.bg.replace('0.7', '0.35') || '#444'),
            borderColor: sectors.map(s => SECTOR_COLORS[s]?.border || '#888'),
            borderWidth: 1.5,
            borderRadius: 6,
            barPercentage: 0.7,
        },
        {
            label: 'Scenario',
            data: sectors.map(s => scenario.value_added[s]),
            backgroundColor: sectors.map(s => SECTOR_COLORS[s]?.bg || '#666'),
            borderColor: sectors.map(s => SECTOR_COLORS[s]?.border || '#888'),
            borderWidth: 1.5,
            borderRadius: 6,
            barPercentage: 0.7,
        }
    ];
    chartGDPBar.update('active');

    // Update prices
    chartPrices.data.datasets = [
        {
            label: 'Baseline',
            data: sectors.map(s => baseline.prices[s]),
            backgroundColor: 'rgba(99,102,241,0.25)',
            borderColor: '#6366f1',
            borderWidth: 1.5,
            borderRadius: 6,
            barPercentage: 0.6,
        },
        {
            label: 'Scenario',
            data: sectors.map(s => scenario.prices[s]),
            backgroundColor: 'rgba(168,85,247,0.5)',
            borderColor: '#a855f7',
            borderWidth: 1.5,
            borderRadius: 6,
            barPercentage: 0.6,
        }
    ];
    chartPrices.update('active');

    // Update labor
    chartLaborBar.data.datasets = [
        {
            label: 'Baseline',
            data: sectors.map(s => baseline.labor[s]),
            backgroundColor: sectors.map(s => SECTOR_COLORS[s]?.bg.replace('0.7', '0.35') || '#444'),
            borderColor: sectors.map(s => SECTOR_COLORS[s]?.border || '#888'),
            borderWidth: 1.5,
            borderRadius: 6,
            barPercentage: 0.7,
        },
        {
            label: 'Scenario',
            data: sectors.map(s => scenario.labor[s]),
            backgroundColor: sectors.map(s => SECTOR_COLORS[s]?.bg || '#666'),
            borderColor: sectors.map(s => SECTOR_COLORS[s]?.border || '#888'),
            borderWidth: 1.5,
            borderRadius: 6,
            barPercentage: 0.7,
        }
    ];
    chartLaborBar.update('active');

    // Update capital
    chartCapitalBar.data.datasets = [
        {
            label: 'Baseline',
            data: sectors.map(s => baseline.capital[s]),
            backgroundColor: sectors.map(s => SECTOR_COLORS[s]?.bg.replace('0.7', '0.35') || '#444'),
            borderColor: sectors.map(s => SECTOR_COLORS[s]?.border || '#888'),
            borderWidth: 1.5,
            borderRadius: 6,
            barPercentage: 0.7,
        },
        {
            label: 'Scenario',
            data: sectors.map(s => scenario.capital[s]),
            backgroundColor: sectors.map(s => SECTOR_COLORS[s]?.bg || '#666'),
            borderColor: sectors.map(s => SECTOR_COLORS[s]?.border || '#888'),
            borderWidth: 1.5,
            borderRadius: 6,
            barPercentage: 0.7,
        }
    ];
    chartCapitalBar.update('active');

    // Update GDP pie with scenario
    chartGDPPie.data.datasets[0].data = sectors.map(s => scenario.gdp_shares[s] * 100);
    chartGDPPie.update('active');

    // Update badges
    document.getElementById('gdp-mode-badge').textContent = 'Scenario';
    document.getElementById('gdp-mode-badge').classList.add('scenario-active');
    document.getElementById('emp-mode-badge').textContent = 'Scenario';
    document.getElementById('emp-mode-badge').classList.add('scenario-active');
}

// ---- Reset Charts to Baseline ----
function resetChartsToBaseline() {
    if (!AppState.baseline) return;
    const eq = AppState.baseline.equilibrium;
    const sectors = Object.keys(eq.output);

    // GDP bar — single dataset
    chartGDPBar.data.datasets = [{
        label: 'Baseline',
        data: sectors.map(s => eq.value_added[s]),
        backgroundColor: sectors.map(s => SECTOR_COLORS[s]?.bg || '#666'),
        borderColor: sectors.map(s => SECTOR_COLORS[s]?.border || '#888'),
        borderWidth: 1.5,
        borderRadius: 6,
        barPercentage: 0.7,
    }];
    chartGDPBar.update('active');

    // Prices
    chartPrices.data.datasets = [{
        label: 'Baseline',
        data: sectors.map(s => eq.prices[s]),
        backgroundColor: 'rgba(99,102,241,0.5)',
        borderColor: '#6366f1',
        borderWidth: 1.5,
        borderRadius: 6,
        barPercentage: 0.6,
    }];
    chartPrices.update('active');

    // Labor
    chartLaborBar.data.datasets = [{
        label: 'Baseline',
        data: sectors.map(s => eq.labor[s]),
        backgroundColor: sectors.map(s => SECTOR_COLORS[s]?.bg || '#666'),
        borderColor: sectors.map(s => SECTOR_COLORS[s]?.border || '#888'),
        borderWidth: 1.5,
        borderRadius: 6,
        barPercentage: 0.7,
    }];
    chartLaborBar.update('active');

    // Capital
    chartCapitalBar.data.datasets = [{
        label: 'Baseline',
        data: sectors.map(s => eq.capital[s]),
        backgroundColor: sectors.map(s => SECTOR_COLORS[s]?.bg || '#666'),
        borderColor: sectors.map(s => SECTOR_COLORS[s]?.border || '#888'),
        borderWidth: 1.5,
        borderRadius: 6,
        barPercentage: 0.7,
    }];
    chartCapitalBar.update('active');

    // Pie
    chartGDPPie.data.datasets[0].data = sectors.map(s => eq.gdp_shares[s] * 100);
    chartGDPPie.update('active');

    // Badges
    document.getElementById('gdp-mode-badge').textContent = 'Baseline';
    document.getElementById('gdp-mode-badge').classList.remove('scenario-active');
    document.getElementById('emp-mode-badge').textContent = 'Baseline';
    document.getElementById('emp-mode-badge').classList.remove('scenario-active');
}
