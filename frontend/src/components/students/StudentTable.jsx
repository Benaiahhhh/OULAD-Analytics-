import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export default function StudentTable({ data, page, totalPages, onPageChange }) {
  const navigate = useNavigate();

  if (!data || data.length === 0) {
    return (
      <div className="card-padded text-center py-12">
        <p className="text-brand-400 text-sm">No students found.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand-50/60">
              <th className="text-left px-5 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">ID</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Gender</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Region</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Education</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Age Band</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Credits</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-brand-500 uppercase tracking-wider">Disability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-100">
            {data.map((student, i) => (
              <tr
                key={student.student_id}
                onClick={() => navigate(`/students/${student.student_id}`)}
                className="hover:bg-brand-50/40 cursor-pointer transition-colors fade-in"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <td className="px-5 py-3 font-mono font-medium text-brand-800">
                  {student.student_id}
                </td>
                <td className="px-5 py-3 text-brand-600">{student.gender}</td>
                <td className="px-5 py-3 text-brand-600">{student.region}</td>
                <td className="px-5 py-3 text-brand-600">{student.highest_education}</td>
                <td className="px-5 py-3 text-brand-600">{student.age_band}</td>
                <td className="px-5 py-3 text-right font-mono text-brand-700">{student.studied_credits}</td>
                <td className="px-5 py-3 text-center">
                  <span className={clsx(
                    'inline-block w-2 h-2 rounded-full',
                    student.disability === 'Y' ? 'bg-amber-400' : 'bg-brand-200'
                  )} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-brand-100 bg-brand-50/30">
          <span className="text-xs text-brand-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-md hover:bg-brand-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-brand-600" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-md hover:bg-brand-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-brand-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
