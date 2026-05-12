import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';

export default function RiskTrendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="card-padded">
        <h3 className="text-sm font-semibold text-brand-700 mb-4">Risk Score Trend</h3>
        <p className="text-sm text-brand-400 text-center py-8">
          Run predictions over time to see the trend.
        </p>
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    score: +(d.avg_score * 100).toFixed(1),
  }));

  return (
    <div className="card-padded">
      <h3 className="text-sm font-semibold text-brand-700 mb-4">Risk Score Trend</h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formatted} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#d9e2ec" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#829ab1' }}
              tickLine={false}
              axisLine={{ stroke: '#d9e2ec' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#829ab1' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #d9e2ec',
                fontSize: '12px',
              }}
              formatter={(v) => [`${v}%`, 'Avg Risk']}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#riskGradient)"
              dot={{ r: 3, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
