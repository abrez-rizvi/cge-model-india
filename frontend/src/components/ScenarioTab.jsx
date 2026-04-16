import { useOutletContext } from 'react-router-dom';
import GlowCard from './GlowCard';
import { COLORS, NAMES } from '../scripts/constants';
import { Play, RotateCcw, Zap, RefreshCw } from 'lucide-react';
import PolicySlider from './PolicySlider';

const ScenarioTab = () => {
    const { sectors, shocks, setShocks, simulate, running, reset, d, data } = useOutletContext();
    return (
        <>
            <div className="content-header">
                <div className="content-label">Policy Lab</div>
                <div className="content-title">Scenario Analysis</div>
            </div>
            <div className="grid-main gap-lg">
                <GlowCard>
                    <div className="card-head">
                        <span className="card-label"><span className="label-dot" /> Policy Controls</span>
                    </div>
                    <div className="controls">
                        <PolicySlider
                            label="Labor Supply"
                            value={shocks.labor_supply}
                            min={0.8} max={1.3}
                            suffix="×"
                            baseline={1.0}
                            color="#3b82f6"
                            onChange={v => setShocks({ ...shocks, labor_supply: v })}
                        />
                        <PolicySlider
                            label="Capital Supply"
                            value={shocks.capital_supply}
                            min={0.8} max={1.3}
                            suffix="×"
                            baseline={1.0}
                            color="#a855f7"
                            onChange={v => setShocks({ ...shocks, capital_supply: v })}
                        />

                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 4 }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 20 }}>
                                Sectoral Tax Rates
                            </div>
                            {sectors.map((s, i) => (
                                <PolicySlider
                                    key={s}
                                    label={NAMES[s]}
                                    value={shocks.tax_rates[s] || 0}
                                    min={-0.20} max={0.50}
                                    suffix="%"
                                    baseline={data?.parameters.tax_rates[i]}
                                    color={COLORS[i]}
                                    onChange={v => setShocks({ ...shocks, tax_rates: { ...shocks.tax_rates, [s]: v } })}
                                />
                            ))}
                        </div>
                    </div>
                    <button className="btn-run" onClick={simulate} disabled={running}>
                        {running ? <RefreshCw size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Play size={15} />}
                        {running ? 'Computing…' : 'Run Simulation'}
                    </button>
                    <button className="btn-ghost" onClick={reset}>
                        <RotateCcw size={13} /> Reset to Baseline
                    </button>
                </GlowCard>
                <GlowCard>
                    <div className="card-head">
                        <span className="card-label"><span className="label-dot" /> Results</span>
                        {d && <span className="badge badge-ok">Converged</span>}
                    </div>
                    {!d ? (
                        <div className="empty-state">
                            <Zap size={52} />
                            <p>Adjust parameters and click <strong>Run Simulation</strong> to compute the new equilibrium.</p>
                        </div>
                    ) : (
                        <>
                            <div className="result-summary">
                                <div className="result-metric">
                                    <div className="result-metric-label">GDP Change</div>
                                    <div className={`result-metric-value ${d.gdp.percent >= 0 ? 'val-up' : 'val-down'}`}>
                                        {d.gdp.percent >= 0 ? '+' : ''}{d.gdp.percent.toFixed(3)}%
                                    </div>
                                </div>
                                <div className="result-metric">
                                    <div className="result-metric-label">Capital Return (r)</div>
                                    <div className={`result-metric-value ${d.rental_rate.percent >= 0 ? 'val-up' : 'val-down'}`}>
                                        {d.rental_rate.percent >= 0 ? '+' : ''}{d.rental_rate.percent.toFixed(3)}%
                                    </div>
                                </div>
                            </div>
                            <table className="tbl">
                                <thead>
                                    <tr>
                                        <th>Sector</th><th>Output Δ</th><th>Price Δ</th><th>Labor Δ</th><th>VA Δ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sectors.map((s, i) => (
                                        <tr key={s}>
                                            <td className="name-cell">
                                                <span className="color-dot" style={{ background: COLORS[i] }} />{NAMES[s]}
                                            </td>
                                            <td className={d.output[s].percent >= 0 ? 'val-up' : 'val-down'}>
                                                {d.output[s].percent >= 0 ? '+' : ''}{d.output[s].percent.toFixed(2)}%
                                            </td>
                                            <td className={d.prices[s].percent >= 0 ? 'val-up' : 'val-down'}>
                                                {d.prices[s].percent >= 0 ? '+' : ''}{d.prices[s].percent.toFixed(2)}%
                                            </td>
                                            <td className={d.labor[s].percent >= 0 ? 'val-up' : 'val-down'}>
                                                {d.labor[s].percent >= 0 ? '+' : ''}{d.labor[s].percent.toFixed(2)}%
                                            </td>
                                            <td className={d.output[s].percent >= 0 ? 'val-up' : 'val-down'}>
                                                {d.output[s].percent >= 0 ? '+' : ''}{d.output[s].percent.toFixed(2)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </>
                    )}
                </GlowCard>
            </div>
        </>
    );
};

export default ScenarioTab;
