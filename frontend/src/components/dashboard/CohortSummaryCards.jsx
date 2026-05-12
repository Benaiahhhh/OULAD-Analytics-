import { Users, AlertTriangle, TrendingUp, Target } from 'lucide-react';
import clsx from 'clsx';

const CARDS = [
  {
    key: 'total_students',
    label: 'Total Students',
    icon: Users,
    color: 'text-brand-600',
    bg: 'bg-brand-50',
    format: (v) => v.toLocaleString(),
  },
  {
    key: 'at_risk_count',
    label: 'At Risk',
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    format: (v, data) => `${v} (${data.at_risk_percentage}%)`,
  },
  {
    key: 'avg_risk_score',
    label: 'Avg Risk Score',
    icon: TrendingUp,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    format: (v) => (v * 100).toFixed(1) + '%',
  },
];

export default function CohortSummaryCards({ data }) {
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {CARDS.map((card, i) => (
        <div
          key={card.key}
          className="card-padded flex items-start gap-4 fade-in"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className={clsx('p-2.5 rounded-xl', card.bg)}>
            <card.icon className={clsx('w-5 h-5', card.color)} />
          </div>
          <div>
            <p className="text-sm text-brand-500">{card.label}</p>
            <p className="text-2xl font-bold text-brand-800 mt-0.5 tracking-tight">
              {card.format(data[card.key], data)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
