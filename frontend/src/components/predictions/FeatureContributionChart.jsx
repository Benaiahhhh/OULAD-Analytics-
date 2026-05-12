import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const FEATURE_LABELS = {
  total_clicks: 'Total Clicks',
  avg_daily_clicks: 'Daily Click Avg',
  days_active: 'Days Active',
  assessment_score_avg: 'Assessment Avg',
  assessment_score_std: 'Assessment Std Dev',
  assessments_submitted: 'Submitted Assessments',
  assessments_total: 'Total Assessments',
  num_of_prev_attempts: 'Previous Attempts',
  studied_credits: 'Credits Studied',
  first_activity_day: 'First Activity Day',
  last_activity_day: 'Last Activity Day',
};

export default function FeatureContributionChart({ features, compact = false }) {
  if (!features || features.length === 0) return null;

  const data = features.map((f) => ({
    name: FEATURE_LABELS[f.feature] || f.feature,
    contribution: f.direction === 'risk' ? f.contribution : -f.contribution,
    direction: f.direction,
    rawValue: f.value,
  }));

  return (
    <div className={compact ? '' : 'card-padded'}>
      {!compact && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-brand-700">Feature Contributions</h3>
          <div className="flex items-center gap-4 text-xs text-brand-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Risk
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Protective
            </span>
          </div>
        </div>
      )}
      <div className={compact ? 'h-48' : 'h-64'}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: '#829ab1' }}
              tickLine={false}
              axisLine={{ stroke: '#d9e2ec' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontSize: 11, fill: '#627d98' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #d9e2ec', fontSize: '12px' }}
              formatter={(value, name, props) => [
                `${Math.abs(value).toFixed(3)} (${props.payload.direction})`,
                `Value: ${props.payload.rawValue}`,
              ]}
            />
            <ReferenceLine x={0} stroke="#d9e2ec" />
            <Bar dataKey="contribution" radius={[0, 4, 4, 0]} barSize={18}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.direction === 'risk' ? '#ef4444' : '#10b981'}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
