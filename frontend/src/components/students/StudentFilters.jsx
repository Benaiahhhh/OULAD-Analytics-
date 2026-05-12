import { Search, X } from 'lucide-react';

export default function StudentFilters({ filters, options, onChange, onSearch }) {
  return (
    <div className="card-padded">
      <div className="flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-brand-500 mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              className="input-field pl-9"
              placeholder="Student ID or region..."
            />
          </div>
        </div>

        {/* Region filter */}
        <div className="w-44">
          <label className="block text-xs font-medium text-brand-500 mb-1">Region</label>
          <select
            value={filters.region || ''}
            onChange={(e) => onChange({ ...filters, region: e.target.value })}
            className="select-field"
          >
            <option value="">All Regions</option>
            {options?.regions?.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Age Band */}
        <div className="w-32">
          <label className="block text-xs font-medium text-brand-500 mb-1">Age Band</label>
          <select
            value={filters.age_band || ''}
            onChange={(e) => onChange({ ...filters, age_band: e.target.value })}
            className="select-field"
          >
            <option value="">All Ages</option>
            {options?.age_bands?.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* Education */}
        <div className="w-48">
          <label className="block text-xs font-medium text-brand-500 mb-1">Education</label>
          <select
            value={filters.education || ''}
            onChange={(e) => onChange({ ...filters, education: e.target.value })}
            className="select-field"
          >
            <option value="">All Levels</option>
            {options?.educations?.map((ed) => (
              <option key={ed} value={ed}>{ed}</option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={onSearch} className="btn-primary">
            Filter
          </button>
          <button
            onClick={() => {
              onChange({ search: '', region: '', age_band: '', education: '' });
              onSearch();
            }}
            className="btn-secondary px-3"
            title="Clear filters"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
