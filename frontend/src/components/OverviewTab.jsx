import { useOutletContext } from 'react-router-dom';
import { Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import GlowCard from './GlowCard';
import { COLORS, NAMES } from '../scripts/constants';

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#111118', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 14, padding: '12px 16px', fontSize: '0.82rem'
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: '#f4f4f5' }}>{NAMES[label] || label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#a1a1aa' }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(3) : p.value}
        </div>
      ))}
    </div>
  );
};

const OverviewTab = () => {
  const { data, sd } = useOutletContext();
  return (
    <>
      <div className="content-header">
        <div className="content-label">Dashboard</div>
        <div className="content-title">Economic Overview</div>
      </div>
      <div className="grid-main gap-lg" style={{ marginBottom: 24 }}>
        <GlowCard>
          <div className="card-head">
            <span className="card-label"><span className="label-dot" /> Social Accounting Matrix</span>
            <span className="badge badge-ok">Balanced</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr><th></th>{data.sam.accounts.slice(0, 6).map(a => <th key={a}>{a}</th>)}</tr>
              </thead>
              <tbody>
                {data.sam.accounts.slice(0, 6).map((r, ri) => (
                  <tr key={r}>
                    <td className="name-cell">
                      <span className="color-dot" style={{ background: COLORS[ri] }} />{r}
                    </td>
                    {data.sam.matrix[ri].slice(0, 6).map((v, ci) => (
                      <td key={ci} style={{ color: v > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                        {v.toFixed(1)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlowCard>
        <GlowCard>
          <div className="card-head">
            <span className="card-label"><span className="label-dot" /> GDP Composition</span>
          </div>
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sd} cx="50%" cy="50%" innerRadius={55} outerRadius={100}
                  paddingAngle={4} dataKey="va" stroke="none">
                  {sd.map((e, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip content={<Tip />} isAnimationActive={false} cursor={{ fill: 'transparent' }} />
                <Legend verticalAlign="bottom" height={36}
                  formatter={v => <span style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>{NAMES[v] || v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>
      </div>
      <GlowCard>
        <div className="card-head">
          <span className="card-label"><span className="label-dot" /> Model Specification</span>
        </div>
        <div className="info-grid">
          {[
            { k: 'Type', v: 'Closed-Economy CGE' },
            { k: 'Sectors', v: '6 Production Sectors' },
            { k: 'Factors', v: 'Labor & Capital' },
            { k: 'Production', v: 'Cobb-Douglas' },
            { k: 'Utility', v: 'Cobb-Douglas' },
            { k: 'Numeraire', v: 'Wage (w = 1)' },
            { k: 'Solver', v: 'Hybrid Newton' },
            { k: 'Tolerance', v: '1e-8' },
            { k: "Walras' Law", v: 'Drop last eq.' },
          ].map(s => (
            <div key={s.k} className="info-item">
              <div className="info-key">{s.k}</div>
              <div className="info-val">{s.v}</div>
            </div>
          ))}
        </div>
      </GlowCard>
    </>
  );
};

export default OverviewTab;
