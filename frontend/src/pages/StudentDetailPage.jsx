import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { students, predictions } from '../lib/api';
import FeatureContributionChart from '../components/predictions/FeatureContributionChart';
import { ArrowLeft, Loader2, User, BookOpen, BrainCircuit } from 'lucide-react';
import clsx from 'clsx';

const RISK_BADGE = {
  low: 'badge-risk-low',
  medium: 'badge-risk-medium',
  high: 'badge-risk-high',
  critical: 'badge-risk-critical',
};

export default function StudentDetailPage() {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [latestPrediction, setLatestPrediction] = useState(null);

  useEffect(() => {
    Promise.all([
      students.get(studentId),
      predictions.history(studentId).catch(() => []),
    ])
      .then(([s, h]) => {
        setStudent(s);
        setHistory(h);
        if (h.length > 0) setLatestPrediction(h[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [studentId]);

  const runPrediction = async (reg) => {
    setPredicting(true);
    try {
      const result = await predictions.single(
        parseInt(studentId), reg.module_code, reg.presentation
      );
      setLatestPrediction(result);
      setHistory((prev) => [result, ...prev]);
    } catch (err) {
      console.error(err);
    } finally {
      setPredicting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="card-padded text-center py-12">
        <p className="text-brand-400">Student not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Back link */}
      <Link to="/students" className="inline-flex items-center gap-1.5 text-sm text-brand-500 hover:text-brand-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Students
      </Link>

      {/* Profile header */}
      <div className="card-padded flex flex-col sm:flex-row sm:items-start gap-4 fade-in">
        <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-brand-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-brand-800">Student #{student.student_id}</h2>
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-brand-600">
            <span>Gender: <strong className="text-brand-800">{student.gender}</strong></span>
            <span>Age: <strong className="text-brand-800">{student.age_band}</strong></span>
            <span>Region: <strong className="text-brand-800">{student.region}</strong></span>
            <span>Education: <strong className="text-brand-800">{student.highest_education}</strong></span>
            <span>Credits: <strong className="text-brand-800">{student.studied_credits}</strong></span>
            <span>IMD: <strong className="text-brand-800">{student.imd_band || 'N/A'}</strong></span>
            <span>Disability: <strong className="text-brand-800">{student.disability}</strong></span>
            <span>Prev Attempts: <strong className="text-brand-800">{student.num_of_prev_attempts}</strong></span>
          </div>
        </div>
        {latestPrediction && (
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-brand-500 mb-1">Latest Risk</p>
            <span className={RISK_BADGE[latestPrediction.risk_level]}>
              {latestPrediction.risk_level}
            </span>
            <p className="text-2xl font-bold text-brand-800 mt-1 font-mono">
              {(latestPrediction.risk_score * 100).toFixed(1)}%
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registrations */}
        <div className="card overflow-hidden fade-in" style={{ animationDelay: '100ms' }}>
          <div className="px-5 py-4 border-b border-brand-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-500" />
            <h3 className="text-sm font-semibold text-brand-700">Registrations</h3>
          </div>
          {student.registrations?.length > 0 ? (
            <div className="divide-y divide-brand-100">
              {student.registrations.map((reg) => (
                <div key={reg.id} className="px-5 py-3 hover:bg-brand-50/40 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-medium text-brand-800">
                      {reg.module_code} · {reg.presentation}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        reg.final_result === 'Pass' || reg.final_result === 'Distinction'
                          ? 'bg-emerald-50 text-emerald-700'
                          : reg.final_result === 'Fail'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                      )}>
                        {reg.final_result}
                      </span>
                      <button
                        onClick={() => runPrediction(reg)}
                        disabled={predicting}
                        className="text-xs text-brand-500 hover:text-brand-700 font-medium transition-colors"
                      >
                        {predicting ? '...' : 'Predict'}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-brand-500">
                    <span>Clicks: <span className="font-mono text-brand-700">{reg.total_clicks}</span></span>
                    <span>Days: <span className="font-mono text-brand-700">{reg.days_active}</span></span>
                    <span>Assess: <span className="font-mono text-brand-700">{reg.assessment_score_avg?.toFixed(1) ?? 'N/A'}</span></span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-6 text-sm text-brand-400 text-center">No registrations found.</p>
          )}
        </div>

        {/* Feature contributions */}
        <div className="fade-in" style={{ animationDelay: '200ms' }}>
          {latestPrediction?.features ? (
            <FeatureContributionChart features={latestPrediction.features} />
          ) : (
            <div className="card-padded flex flex-col items-center justify-center py-12 text-center">
              <BrainCircuit className="w-8 h-8 text-brand-300 mb-3" />
              <p className="text-sm text-brand-400">
                Click "Predict" on a registration to see feature contributions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Prediction history */}
      {history.length > 0 && (
        <div className="card overflow-hidden fade-in" style={{ animationDelay: '300ms' }}>
          <div className="px-5 py-4 border-b border-brand-100">
            <h3 className="text-sm font-semibold text-brand-700">Prediction History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-50/60">
                  <th className="text-left px-5 py-2 text-xs font-semibold text-brand-500">Date</th>
                  <th className="text-left px-5 py-2 text-xs font-semibold text-brand-500">Module</th>
                  <th className="text-right px-5 py-2 text-xs font-semibold text-brand-500">Risk Score</th>
                  <th className="text-center px-5 py-2 text-xs font-semibold text-brand-500">Level</th>
                  <th className="text-right px-5 py-2 text-xs font-semibold text-brand-500">Model</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {history.map((p, i) => (
                  <tr key={i} className="hover:bg-brand-50/40">
                    <td className="px-5 py-2 text-brand-600">
                      {new Date(p.predicted_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-2 font-mono text-brand-700">{p.module_code}</td>
                    <td className="px-5 py-2 text-right font-mono font-medium text-brand-800">
                      {(p.risk_score * 100).toFixed(1)}%
                    </td>
                    <td className="px-5 py-2 text-center">
                      <span className={RISK_BADGE[p.risk_level]}>{p.risk_level}</span>
                    </td>
                    <td className="px-5 py-2 text-right text-brand-500 text-xs">{p.model_version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
