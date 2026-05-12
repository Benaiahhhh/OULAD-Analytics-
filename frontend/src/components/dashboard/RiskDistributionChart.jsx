import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const RISK_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#7c2d12',
};

const RISK_LABELS = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
  critical: 'Critical',
};

export default function RiskDistributionChart({ distribution }) {
  if (!distribution) return null;

  const data = Object.entries(distribution)
    .filter(([_, v]) => v > 0)
    .map(([key, value]) => ({
      name: RISK_LABELS[key],
      value,
      color: RISK_COLORS[key],
    }));

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="card-padded">
        <h3 className="text-sm font-semibold text-brand-700 mb-4">Risk Distribution</h3>
        <p className="text-sm text-brand-400 text-center py-8">
          No predictions available yet. Run predictions to see the distribution.
        </p>
      </div>
    );
  }

  return (
    <div className="card-padded">
      <h3 className="text-sm font-semibold text-brand-700 mb-4">Risk Distribution</h3>
      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="w-40 h-40 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} students`, name]}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #d9e2ec',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend + bars */}
        <div className="flex-1 space-y-3">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-brand-600 w-20">{item.name}</span>
              <div className="flex-1 bg-brand-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(item.value / total) * 100}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
              <span className="text-xs font-mono font-medium text-brand-700 w-8 text-right">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
