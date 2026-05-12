import { useState, useEffect } from 'react';
import { dashboard } from '../lib/api';
import CohortSummaryCards from '../components/dashboard/CohortSummaryCards';
import RiskDistributionChart from '../components/dashboard/RiskDistributionChart';
import RiskTrendChart from '../components/dashboard/RiskTrendChart';
import ModuleTable from '../components/dashboard/ModuleTable';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    dashboard
      .summary()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-padded text-center py-12">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <CohortSummaryCards data={data?.cohort} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskDistributionChart distribution={data?.cohort?.risk_distribution} />
        <RiskTrendChart data={data?.risk_trend} />
      </div>

      <ModuleTable modules={data?.modules} />
    </div>
  );
}
