import { useOutletContext } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import GlowCard from './GlowCard';
import Tip from './Tip';

const EmploymentTab = () => {
  const { sd } = useOutletContext();
  return (
    <>
      <div className="content-header">
        <div className="content-label">Factor Markets</div>
        <div className="content-title">Factor Allocation</div>
      </div>
      <div className="grid-2 gap-lg">
        <GlowCard>
          <div className="card-head">
            <span className="card-label"><span className="label-dot" /> Labor Distribution</span>
          </div>
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sd} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.25)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.25)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<Tip />} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="labor" name="Labor" radius={[5, 5, 0, 0]} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>
        <GlowCard>
          <div className="card-head">
            <span className="card-label"><span className="label-dot" /> Capital Allocation</span>
          </div>
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sd} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.25)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.25)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<Tip />} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="capital" name="Capital" radius={[5, 5, 0, 0]} fill="#a855f7" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>
      </div>
    </>
  );
};

export default EmploymentTab;