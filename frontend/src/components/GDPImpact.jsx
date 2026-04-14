import { useOutletContext } from 'react-router-dom';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import GlowCard from './GlowCard';
import Tip from './Tip';
import { COLORS } from '../scripts/constants';

const GDPImpactTab = () => {
  const { sd } = useOutletContext();
  return (
    <>
      <div className="content-header">
        <div className="content-label">Macro Analysis</div>
        <div className="content-title">GDP & Price Impact</div>
      </div>
      <div className="grid-2 gap-lg">
        <GlowCard>
          <div className="card-head">
            <span className="card-label"><span className="label-dot" /> Value Added by Sector</span>
          </div>
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sd} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.25)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.25)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<Tip />} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="va" name="Value Added" radius={[5, 5, 0, 0]}>
                  {sd.map((e, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>
        <GlowCard>
          <div className="card-head">
            <span className="card-label"><span className="label-dot" /> Output Prices</span>
          </div>
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sd} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.25)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 'auto']} stroke="rgba(255,255,255,0.25)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<Tip />} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="price" name="Price" radius={[5, 5, 0, 0]} fill="#c4b5fd" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>
      </div>
    </>
  );
};

export default GDPImpactTab;
