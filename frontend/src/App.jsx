import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { fetchBaseline, runSimulation } from './scripts/api';
import {
  TrendingUp, TrendingDown,
  ArrowRight, Zap, BarChart3,
  Activity, ChevronLeft, Sparkles
} from 'lucide-react';
import HeroVideo from './components/HeroVideo';
import PolicySlider from './components/PolicySlider';
import GlowCard from './components/GlowCard';
import OverviewTab from './components/OverviewTab';
import GDPImpactTab from './components/GDPImpact';
import EmploymentTab from './components/EmploymentTab';
import ScenarioTab from './components/ScenarioTab';
import DistributionTab from './components/DistributionTab';
import { COLORS, NAMES } from './scripts/constants';


const LandingPage = ({ eq }) => (
  <div className="landing">
    <HeroVideo />
    <div style={{ position: 'relative', zIndex: 10 }}>
      {/* ... previous nav ... */}
      <nav className="landing-nav">
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px", justifyContent: "center" }}>
          <img src="/equillio.png" alt="Equillio Logo" height={25} width={25} />
          <div className="landing-brand">Equillio</div>
        </div>
        <div className="landing-nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/dashboard/scenario">Simulate</Link>
        </div>
      </nav>

      <div className="landing-hero">
        <div className="landing-badge">
          <span className="pulse" />
          6-Sector Equilibrium Model
        </div>
        <h1 className="landing-title">
          <span className="gradient-text">Equillio</span><br />
          Policy Lab
        </h1>
        <p className="landing-subtitle">
          A Computable General Equilibrium model calibrated to India's economy.
          Simulate tax, subsidy, and factor supply shocks to analyze their impact
          on GDP, employment, and sectoral output in real time.
        </p>
        {!eq?.converged && (
           <div style={{ padding: '15px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#f87171', fontSize: '0.9rem', marginBottom: '20px' }}>
             <strong>Solver Warning:</strong> {eq?.message || "Model calibration in progress..."}
           </div>
        )}
        <div className="landing-cta-group">
          <Link to="/dashboard" className="btn-cta-primary">
            Open Dashboard <ArrowRight size={16} />
          </Link>
          <Link to="/dashboard/scenario" className="btn-cta-secondary">
            <Sparkles size={14} /> Run Simulation
          </Link>
        </div>
      </div>

      <div className="landing-features">
        <GlowCard className="feature-card">
          <div className="feature-icon"><BarChart3 size={24} /></div>
          <h3>Sectoral Analysis</h3>
          <p>Decompose GDP into Agriculture, Manufacturing, Services, Energy, Construction, and Government sectors.</p>
        </GlowCard>
        <GlowCard className="feature-card">
          <div className="feature-icon"><Activity size={24} /></div>
          <h3>Live Equilibrium</h3>
          <p>Hybrid Newton solver converges to general equilibrium in real time with Walras' Law enforcement.</p>
        </GlowCard>
        <GlowCard className="feature-card">
          <div className="feature-icon"><Zap size={24} /></div>
          <h3>Policy Laboratory</h3>
          <p>Test tax rate changes, factor supply shocks, and subsidies — instantly see output, price, and employment deltas.</p>
        </GlowCard>
      </div>

      <div className="landing-stats">
        <div className="landing-stat">
          <div className="landing-stat-value">6</div>
          <div className="landing-stat-label">Sectors</div>
        </div>
        <div className="landing-stat">
          <div className="landing-stat-value">25+</div>
          <div className="landing-stat-label">Equations</div>
        </div>
        <div className="landing-stat">
          <div className="landing-stat-value">₹{(eq?.gdp || 0).toFixed(0)}</div>
          <div className="landing-stat-label">Baseline GDP</div>
        </div>
        <div className="landing-stat">
          <div className="landing-stat-value">1e⁻⁸</div>
          <div className="landing-stat-label">Solver Tolerance</div>
        </div>
      </div>
    </div>
  </div>
);

const DashboardLayout = ({ eq, d, sim, tabs, contextValue }) => {
  const navigate = useNavigate();
  return (
    <div>
      <nav className="topbar">
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px", justifyContent: "center", cursor: "pointer" }} onClick={() => navigate('/')}>
          <img src="/equillio.png" alt="Equillio Logo" height={25} width={25} />
          <div className="topbar-brand">Equillio</div>
        </div>
        <div className="topbar-nav">
          {tabs.map(t => (
            <NavLink key={t.id} to={`/dashboard/${t.path}`} className={({ isActive }) => isActive ? 'active' : ''}>
              {t.label}
            </NavLink>
          ))}
        </div>
        <div className="topbar-right">
          <div className="status-chip">
            <span className="status-dot" />
            {sim ? 'Simulated' : 'Baseline'}
          </div>
          <Link to="/" className="back-btn">
            <ChevronLeft size={14} /> Home
          </Link>
        </div>
      </nav>

      <div className="kpi-strip">
        <div className="kpi-item anim">
          <div className="kpi-label">GDP (Value Added)</div>
          <div className="kpi-value">₹{eq.gdp.toFixed(2)}</div>
          {d && <div className={`kpi-trend ${d.gdp.percent >= 0 ? 'kpi-up' : 'kpi-down'}`}>
            {d.gdp.percent >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {d.gdp.percent.toFixed(2)}%
          </div>}
        </div>
        <div className="kpi-item anim anim-d1">
          <div className="kpi-label">Wage (Numeraire)</div>
          <div className="kpi-value">w = 1.00</div>
          <div className="kpi-trend kpi-fixed">Fixed anchor</div>
        </div>
        <div className="kpi-item anim anim-d2">
          <div className="kpi-label">Capital Return (r)</div>
          <div className="kpi-value">{eq.rental_rate.toFixed(4)}</div>
          {d && <div className={`kpi-trend ${d.rental_rate.percent >= 0 ? 'kpi-up' : 'kpi-down'}`}>
            {d.rental_rate.percent >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {d.rental_rate.percent.toFixed(2)}%
          </div>}
        </div>
        <div className="kpi-item anim anim-d3">
          <div className="kpi-label">Tax Revenue</div>
          <div className="kpi-value">₹{eq.tax_revenue.toFixed(2)}</div>
        </div>
      </div>

      <div className="content">
        <Outlet context={contextValue} />
      </div>

      <footer className="footer">
        Simplified CGE Model · Closed Economy · Cobb-Douglas · scipy.optimize.root
      </footer>
    </div>
  );
};

export default function App() {
  const [data, setData] = useState(null);
  const [sim, setSim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [shocks, setShocks] = useState({
    tax_rates: {}, subsidies: {}, labor_supply: 1.0, capital_supply: 1.0
  });

  const sectors = data ? data.parameters.sectors : [];
  const laborTypes = data ? data.parameters.labor_types : [];

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetchBaseline();
      setData(r);
      if (r.parameters && r.parameters.sectors) {
        const t = {};
        r.parameters.sectors.forEach((s, i) => { 
          t[s] = r.parameters.tax_rates[i]; 
        });
        setShocks(p => ({ ...p, tax_rates: t }));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const simulate = async () => {
    setRunning(true);
    try {
      const r = await runSimulation(shocks);
      setSim(r);
    } catch (e) { alert(e.message); }
    finally { setRunning(false); }
  };

  const reset = () => {
    setSim(null);
    if (data) {
      const t = {};
      data.parameters.sectors.forEach((s, i) => { t[s] = data.parameters.tax_rates[i]; });
      setShocks({ tax_rates: t, subsidies: {}, labor_supply: 1.0, capital_supply: 1.0 });
    }
  };

  // ────────────────────────────────────────────────────────────
  // LOADING
  // ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="loader">
        <div className="spinner" />
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 600 }}>
          Equillio
        </div>
        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
          Computing baseline equilibrium…
        </div>
      </div>
    );
  }

  const eq = sim ? sim.scenario : (data ? data.equilibrium : null);
  const d = sim ? sim.deltas : null;

  if (!eq) return <div className="loader">Initializing...</div>;

  const sd = sectors.map((s, i) => {
    const l_obj = eq.labor ? eq.labor[s] : 0;
    const total_l = (l_obj && typeof l_obj === 'object') ? Object.values(l_obj).reduce((a, b) => a + b, 0) : (l_obj || 0);
    
    return {
      name: s, full: NAMES[s] || s, color: COLORS[i % COLORS.length],
      va: (eq.value_added && eq.value_added[s]) ? eq.value_added[s] : 0, 
      price: (eq.prices && eq.prices[s]) ? eq.prices[s] : 1,
      labor: total_l, 
      labor_split: l_obj || {},
      capital: (eq.capital && eq.capital[s]) ? eq.capital[s] : 0,
      output: (eq.output && eq.output[s]) ? eq.output[s] : 0, 
      share: (eq.value_added && eq.gdp) ? (eq.value_added[s] / eq.gdp * 100) : 0
    };
  });

  const tabs = [
    { id: 'overview', label: 'Overview', path: 'overview' },
    { id: 'gdp', label: 'GDP Impact', path: 'gdp' },
    { id: 'distribution', label: 'Inequality', path: 'inequality' },
    { id: 'employment', label: 'Employment', path: 'employment' },
    { id: 'scenario', label: 'Scenario', path: 'scenario' },
  ];

  const contextValue = { eq, d, sim, data, sd, sectors, shocks, setShocks, simulate, running, reset };

  return (
    <Routes>
      <Route path="/" element={<LandingPage eq={eq} />} />
      <Route path="/dashboard" element={<DashboardLayout eq={eq} d={d} sim={sim} tabs={tabs} contextValue={contextValue} />}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<OverviewTab />} />
        <Route path="gdp" element={<GDPImpactTab />} />
        <Route path="inequality" element={<DistributionTab />} />
        <Route path="employment" element={<EmploymentTab />} />
        <Route path="scenario" element={<ScenarioTab />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
