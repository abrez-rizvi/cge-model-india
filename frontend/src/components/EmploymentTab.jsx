import { useOutletContext } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import GlowCard from './GlowCard';
import Tip from './Tip';

const EmploymentTab = () => {
  const { sd } = useOutletContext();
  
  // Transform sd for the stacked chart
  // sd already contains labor_split: { Unskilled, Semi-Skilled, Skilled }
  const chartData = sd.map(item => ({
    name: item.name,
    Unskilled: item.labor_split?.Unskilled || 0,
    'Semi-Skilled': item.labor_split?.['Semi-Skilled'] || 0,
    Skilled: item.labor_split?.Skilled || 0,
    capital: item.capital
  }));

  return (
    <>
      <div className="content-header">
        <div className="content-label">Factor Markets</div>
        <div className="content-title">Labor & Capital Allocation</div>
      </div>
      <div className="grid-2 gap-lg">
        <GlowCard>
          <div className="card-head">
            <span className="card-label"><span className="label-dot" /> Labor Skill Composition</span>
          </div>
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.25)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.25)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<Tip />} cursor={{ fill: 'transparent' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }} />
                <Bar dataKey="Unskilled" stackId="a" name="Unskilled" fill="#fbbf24" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Semi-Skilled" stackId="a" name="Semi-Skilled" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Skilled" stackId="a" name="Skilled" fill="#8b5cf6" radius={[5, 5, 0, 0]} />
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
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.25)" fontSize={11} tickLine={false} axisLine={false} />
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