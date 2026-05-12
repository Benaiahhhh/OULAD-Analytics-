import clsx from 'clsx';

export default function ModuleTable({ modules }) {
  if (!modules || modules.length === 0) {
    return (
      <div className="card-padded">
        <h3 className="text-sm font-semibold text-brand-700 mb-4">Module Performance</h3>
        <p className="text-sm text-brand-400 text-center py-6">No module data available.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-brand-100">
        <h3 className="text-sm font-semibold text-brand-700">Module Performance</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand-50/60">
              <th className="text-left px-5 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Module</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Presentation</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Enrolled</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">At Risk</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Avg Clicks</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Pass Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {modules.map((mod, i) => (
              <tr
                key={`${mod.module_code}-${mod.presentation}`}
                className="hover:bg-brand-50/40 transition-colors fade-in"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <td className="px-5 py-3 font-mono font-medium text-brand-800">{mod.module_code}</td>
                <td className="px-5 py-3 text-brand-600">{mod.presentation}</td>
                <td className="px-5 py-3 text-right text-brand-700">{mod.enrolled}</td>
                <td className="px-5 py-3 text-right">
                  <span className={clsx(
                    'font-medium',
                    mod.at_risk > 0 ? 'text-red-600' : 'text-brand-500'
                  )}>
                    {mod.at_risk}
                  </span>
                </td>
                <td className="px-5 py-3 text-right font-mono text-brand-600">
                  {mod.avg_engagement.toLocaleString()}
                </td>
                <td className="px-5 py-3 text-right">
                  <span className={clsx(
                    'font-medium',
                    mod.pass_rate >= 70 ? 'text-emerald-600' :
                    mod.pass_rate >= 50 ? 'text-amber-600' : 'text-red-600'
                  )}>
                    {mod.pass_rate?.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
