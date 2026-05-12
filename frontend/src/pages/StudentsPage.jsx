import { useState, useEffect, useCallback } from 'react';
import { students } from '../lib/api';
import StudentTable from '../components/students/StudentTable';
import StudentFilters from '../components/students/StudentFilters';
import { Loader2 } from 'lucide-react';

export default function StudentsPage() {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({
    search: '', region: '', age_band: '', education: '',
  });
  const [page, setPage] = useState(1);
  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const result = await students.list({ ...filters, page, per_page: 25 });
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchStudents();
  }, [page]); // only re-fetch on page change automatically

  useEffect(() => {
    students.filterOptions().then(setOptions).catch(console.error);
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchStudents();
  };

  return (
    <div className="space-y-4 max-w-6xl">
      <StudentFilters
        filters={filters}
        options={options}
        onChange={setFilters}
        onSearch={handleSearch}
      />

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
        </div>
      ) : (
        <StudentTable
          data={data?.items}
          page={data?.page || 1}
          totalPages={data?.pages || 1}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
