import { useState } from 'react';
import { predictions } from '../lib/api';
import FeatureContributionChart from '../components/predictions/FeatureContributionChart';
import { BrainCircuit, Loader2, Upload, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

const RISK_BADGE = {
  low: 'badge-risk-low',
  medium: 'badge-risk-medium',
  high: 'badge-risk-high',
  critical: 'badge-risk-critical',
};

export default function PredictionsPage() {
  const [tab, setTab] = useState('single');

  return (
    <div className="max-w-4xl space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-brand-100 rounded-lg p-1 w-fit">
        {['single', 'batch'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'px-4 py-2 text-sm font-medium rounded-md transition-all',
              tab === t
                ? 'bg-white text-brand-800 shadow-sm'
                : 'text-brand-500 hover:text-brand-700'
            )}
          >
            {t === 'single' ? 'Single Prediction' : 'Batch Prediction'}
          </button>
        ))}
      </div>

      {tab === 'single' ? <SinglePrediction /> : <BatchPrediction />}
    </div>
  );
}

function SinglePrediction() {
  const [studentId, setStudentId] = useState('');
  const [moduleCode, setModuleCode] = useState('');
  const [presentation, setPresentation] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePredict = async () => {
    if (!studentId || !moduleCode || !presentation) {
      setError('All fields are required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await predictions.single(parseInt(studentId), moduleCode, presentation);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-padded fade-in">
        <h3 className="text-sm font-semibold text-brand-700 mb-4">Predict Student Risk</h3>

        {error && (
          <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-brand-500 mb-1">Student ID</label>
            <input
              type="number"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="input-field"
              placeholder="e.g. 10001"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-500 mb-1">Module Code</label>
            <input
              type="text"
              value={moduleCode}
              onChange={(e) => setModuleCode(e.target.value.toUpperCase())}
              className="input-field"
              placeholder="e.g. AAA"
              maxLength={5}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-500 mb-1">Presentation</label>
            <input
              type="text"
              value={presentation}
              onChange={(e) => setPresentation(e.target.value)}
              className="input-field"
              placeholder="e.g. 2014J"
            />
          </div>
        </div>

        <button
          onClick={handlePredict}
          disabled={loading}
          className="btn-primary mt-4 inline-flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Predicting...
            </>
          ) : (
            <>
              <BrainCircuit className="w-4 h-4" /> Run Prediction
            </>
          )}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-4 fade-in">
          <div className="card-padded flex items-center gap-6">
            <div>
              <p className="text-xs text-brand-500 mb-1">Risk Score</p>
              <p className="text-4xl font-bold font-mono text-brand-800">
                {(result.risk_score * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-brand-500 mb-1">Risk Level</p>
              <span className={clsx(RISK_BADGE[result.risk_level], 'text-sm px-3 py-1')}>
                {result.risk_level}
              </span>
            </div>
            <div>
              <p className="text-xs text-brand-500 mb-1">Model</p>
              <p className="text-sm font-mono text-brand-700">{result.model_version}</p>
            </div>
          </div>

          <FeatureContributionChart features={result.features} />
        </div>
      )}
    </div>
  );
}

function BatchPrediction() {
  const [batchInput, setBatchInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBatch = async () => {
    setError('');
    try {
      const lines = batchInput.trim().split('\n').filter(Boolean);
      const studentList = lines.map((line) => {
        const [student_id, module_code, presentation] = line.split(',').map((s) => s.trim());
        return { student_id: parseInt(student_id), module_code, presentation };
      });

      if (studentList.length === 0) {
        setError('Enter at least one student (student_id,module_code,presentation)');
        return;
      }

      setLoading(true);
      const res = await predictions.batch(studentList);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-padded fade-in">
        <h3 className="text-sm font-semibold text-brand-700 mb-2">Batch Prediction</h3>
        <p className="text-xs text-brand-400 mb-4">
          Enter one student per line: <code className="bg-brand-100 px-1 rounded">student_id, module_code, presentation</code>
        </p>

        {error && (
          <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <textarea
          value={batchInput}
          onChange={(e) => setBatchInput(e.target.value)}
          rows={6}
          className="input-field font-mono text-sm"
          placeholder={`10001, AAA, 2014J\n10002, BBB, 2014J\n10003, CCC, 2013B`}
        />

        <button
          onClick={handleBatch}
          disabled={loading}
          className="btn-primary mt-4 inline-flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Processing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" /> Run Batch
            </>
          )}
        </button>
      </div>

      {/* Batch results */}
      {result && (
        <div className="space-y-4 fade-in">
          {/* Summary */}
          <div className="card-padded">
            <h3 className="text-sm font-semibold text-brand-700 mb-3">Batch Summary</h3>
            <div className="flex flex-wrap gap-4">
              {['critical', 'high', 'medium', 'low'].map((level) => (
                <div key={level} className="text-center">
                  <p className="text-2xl font-bold font-mono text-brand-800">
                    {result.summary[level]}
                  </p>
                  <span className={RISK_BADGE[level]}>{level}</span>
                </div>
              ))}
              <div className="text-center ml-auto">
                <p className="text-2xl font-bold font-mono text-brand-800">
                  {(result.summary.avg_risk_score * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-brand-500">Avg Risk</p>
              </div>
            </div>
          </div>

          {/* Individual results */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-brand-50/60">
                    <th className="text-left px-5 py-2 text-xs font-semibold text-brand-500">Student</th>
                    <th className="text-right px-5 py-2 text-xs font-semibold text-brand-500">Risk Score</th>
                    <th className="text-center px-5 py-2 text-xs font-semibold text-brand-500">Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100">
                  {result.predictions.map((p, i) => (
                    <tr key={i} className="hover:bg-brand-50/40">
                      <td className="px-5 py-2 font-mono text-brand-800">{p.student_id}</td>
                      <td className="px-5 py-2 text-right font-mono font-medium">
                        {(p.risk_score * 100).toFixed(1)}%
                      </td>
                      <td className="px-5 py-2 text-center">
                        <span className={RISK_BADGE[p.risk_level]}>{p.risk_level}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
