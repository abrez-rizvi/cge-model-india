import { COLORS } from '../scripts/constants';

const Tip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="tooltip-box" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: 8 }}>
      <div className="tooltip-label">{label}</div>
      <div className="tooltip-row">
        <span className="tooltip-dot" style={{ background: COLORS[payload[0].dataKey === 'va' ? 0 : 1] }} />
        {payload[0].name}: {Number(payload[0].value).toFixed(2)}
      </div>
    </div>
  );
};

export default Tip;
