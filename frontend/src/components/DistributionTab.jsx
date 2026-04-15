import React from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, LabelList
} from 'recharts';
import GlowCard from './GlowCard';
import { COLORS } from '../scripts/constants';
import Tip from './Tip';

// Aggregation mapping for the UI
const AGG_MAP = {
  "Rural Lower": ["hhd-r1", "hhd-r2"],
  "Rural Middle": ["hhd-r3", "hhd-r4"],
  "Rural Upper": ["hhd-r5"],
  "Urban Lower": ["hhd-u1", "hhd-u2"],
  "Urban Middle": ["hhd-u3", "hhd-u4"],
  "Urban Upper": ["hhd-u5"]
};

export default function DistributionTab() {
  const { eq, d, sim, data } = useOutletContext();
  
  if (!d || !d.real_incomes) {
    return (
      <div className="tab-placeholder">
        <div className="placeholder-content">
          <div className="placeholder-icon">📊</div>
          <h3>Distributional Analysis</h3>
          <p>Run a simulation in the 'Scenario' tab to see how policy shocks impact different household income groups.</p>
        </div>
      </div>
    );
  }

  // Aggregate 10 quintiles into 6 human-readable groups for the chart
  const baselineIncomes = sim.baseline.nominal_incomes;
  const chartData = Object.entries(AGG_MAP).map(([groupName, rawKeys]) => {
    // Weighted average percent change
    let totalBaseline = 0;
    let weightedSum = 0;
    
    rawKeys.forEach(k => {
      const b = baselineIncomes[k] || 1;
      const pct = d.real_incomes[k]?.percent || 0;
      weightedSum += (pct * b);
      totalBaseline += b;
    });
    
    const avgPct = totalBaseline > 0 ? (weightedSum / totalBaseline) : 0;
    
    return {
      name: groupName,
      impact: parseFloat(avgPct.toFixed(3)),
      color: groupName.startsWith("Rural") ? "#34d399" : "#3b82f6"
    };
  });

  // Calculate Inequality metrics
  const getGini = (incomes) => {
    const sorted = Object.values(incomes).sort((a, b) => a - b);
    const n = sorted.length;
    let sumDiff = 0;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            sumDiff += Math.abs(sorted[i] - sorted[j]);
        }
    }
    return sumDiff / (2 * n * n * (sorted.reduce((a, b) => a + b, 0) / n));
  };

  const bGini = getGini(sim.baseline.real_incomes);
  const sGini = getGini(sim.scenario.real_incomes);
  const giniChange = ((sGini - bGini) / bGini) * 100;

  return (
    <div className="tab-container anim-fade-in">
      <div className="grid-2-1">
        <GlowCard>
          <div className="card-header">
            <h3>Real Income Impact by Household Group</h3>
            <p>Weighted average % change in purchasing power per group.</p>
          </div>
          
          <div style={{ height: 400, marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-tertiary)" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="var(--text-tertiary)" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                  label={{ value: '% Change', angle: -90, position: 'insideLeft', fill: 'var(--text-tertiary)', fontSize: 10 }}
                />
                <Tooltip 
                  content={<Tip />}
                  cursor={{ fill: 'transparent' }}
                />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                <Bar dataKey="impact" name="Real Income Change %" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList dataKey="impact" position="top" fill="#fff" fontSize={11} formatter={(v) => `${v > 0 ? '+' : ''}${v}%`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>

        <div className="side-panel">
          <GlowCard>
            <div className="card-header">
              <h3>Equity Metrics</h3>
            </div>
            <div className="stat-list">
              <div className="stat-row">
                <span className="stat-label">Gini Coefficient (IE)</span>
                <span className="stat-value">{sGini.toFixed(4)}</span>
                <span className={`stat-delta ${giniChange <= 0 ? 'trend-up' : 'trend-down'}`}>
                   {giniChange.toFixed(2)}%
                </span>
              </div>
              <div className="stat-description">
                {giniChange < 0 ? 'The policy shock reduced overall income inequality.' : 'Inequality increased slightly under this scenario.'}
              </div>
              
              <div className="divider" />
              
              <div className="stat-row">
                <span className="stat-label">Rural/Urban Gap Index</span>
                <span className="stat-value">
                  {(chartData[2].impact - chartData[5].impact).toFixed(2)} pts
                </span>
              </div>
            </div>
          </GlowCard>
          
          <GlowCard style={{ marginTop: '20px' }}>
             <h4>💡 Insight</h4>
             <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
               This simulation uses 10 distinct agent budget constraints. Different groups are affected differently based on their unique consumption baskets (e.g. food vs. fuel intensity) and their primary sources of income (e.g. unskilled labor vs. land rents).
             </p>
          </GlowCard>
        </div>
      </div>
    </div>
  );
}
