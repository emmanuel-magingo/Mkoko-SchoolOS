import React, { useState } from 'react';
import { Filter, RotateCcw, Download } from 'lucide-react';
import { ReportsFilter } from '../../api/reports';

interface ReportFilterBarProps {
  onApplyFilters: (filters: ReportsFilter) => void;
  onExportCsv?: () => void;
  showDateRange?: boolean;
  showClassSelect?: boolean;
  showSubjectSelect?: boolean;
  classList?: Array<{ id: string; name: string }>;
  subjectList?: Array<{ id: string; name: string }>;
}

export const ReportFilterBar: React.FC<ReportFilterBarProps> = ({
  onApplyFilters,
  onExportCsv,
  showDateRange = true,
  showClassSelect = true,
  showSubjectSelect = false,
  classList = [],
  subjectList = [],
}) => {
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyFilters({
      classId: classId || undefined,
      subjectId: subjectId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  const handleReset = () => {
    setClassId('');
    setSubjectId('');
    setStartDate('');
    setEndDate('');
    onApplyFilters({});
  };

  return (
    <form onSubmit={handleApply} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
            <Filter className="w-4 h-4 text-brand-600" />
            Filters
          </div>

          {showClassSelect && (
            <div>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-700"
              >
                <option value="">All Classes</option>
                {classList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showSubjectSelect && (
            <div>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-700"
              >
                <option value="">All Subjects</option>
                {subjectList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showDateRange && (
            <>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-700"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-700"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 transition-colors shadow-xs"
          >
            Apply
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            title="Reset Filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {onExportCsv && (
          <button
            type="button"
            onClick={onExportCsv}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>
    </form>
  );
};
