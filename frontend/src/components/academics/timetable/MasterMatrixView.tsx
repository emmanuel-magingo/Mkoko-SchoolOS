import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Coffee,
  Search,
  AlertCircle,
  User,
  MapPin,
  Edit2,
  Clock,
} from 'lucide-react';
import {
  TimetableMatrixResponse,
  MatrixSlot,
  STANDARD_TIMETABLE_SLOTS,
} from '../../../api/timetable.api';
import { getEducationLevelFromClass } from '../../../utils/education-level.utils';

export interface MasterMatrixViewProps {
  matrix: TimetableMatrixResponse | null;
  isLoading?: boolean;
  canManage?: boolean;
  selectedDay: string;
  onDayChange: (day: string) => void;
  onCellClick: (classId: string, startTime: string, endTime: string) => void;
  onEditCellClick?: (period: any, classId: string, dayOfWeek: string) => void;
  classes?: Array<{ id: string; name: string; level?: string; stream?: string }>;
  error?: string | null;
}

const DAYS_OF_WEEK = [
  { key: 'MONDAY', label: 'Monday', short: 'Mon' },
  { key: 'TUESDAY', label: 'Tuesday', short: 'Tue' },
  { key: 'WEDNESDAY', label: 'Wednesday', short: 'Wed' },
  { key: 'THURSDAY', label: 'Thursday', short: 'Thu' },
  { key: 'FRIDAY', label: 'Friday', short: 'Fri' },
];

export const MasterMatrixView: React.FC<MasterMatrixViewProps> = ({
  matrix,
  isLoading = false,
  canManage = true,
  selectedDay,
  onDayChange,
  onCellClick,
  onEditCellClick,
  classes = [],
  error,
}) => {
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const slots: MatrixSlot[] =
    matrix?.slots && matrix.slots.length > 0 ? matrix.slots : STANDARD_TIMETABLE_SLOTS;

  // Filter rows by level and search query
  const filteredRows = (matrix?.rows || []).filter((row) => {
    const matchesLevel =
      levelFilter === 'ALL' ||
      getEducationLevelFromClass(row.classLevel, row.className) === levelFilter;

    const matchesSearch =
      !searchQuery.trim() ||
      row.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (row.classStream && row.classStream.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesLevel && matchesSearch;
  });

  const configuredLevels = Array.from(new Set(
    (matrix?.rows || classes).map((item: any) => getEducationLevelFromClass(item.level || item.classLevel, item.name || item.className))
  ));
  const educationLevelLabels: Record<string, string> = {
    PRIMARY: 'Primary',
    O_LEVEL: 'Secondary / O-Level',
    A_LEVEL: 'Advanced / A-Level',
  };

  // Calculate statistics
  const totalClasses = matrix?.rows?.length || classes.length;
  const assignedLessonsCount = (matrix?.rows || []).reduce((acc, row) => {
    return acc + row.cells.filter((c) => c.isAssigned && c.period).length;
  }, 0);

  const instructionalSlotsCount = slots.filter((s) => !s.isBreak).length;

  return (
    <div id="master-matrix-view" className="space-y-4">
      {error && (
        <div
          id="master-matrix-error-alert"
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* Matrix Controls & Day Switcher Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        {/* Day Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl">
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = selectedDay === day.key;
            return (
              <button
                key={day.key}
                type="button"
                id={`day-tab-${day.key.toLowerCase()}`}
                onClick={() => onDayChange(day.key)}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-white text-blue-700 shadow-xs ring-1 ring-slate-950/5 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span>{day.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filters: Search & Level Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              id="matrix-search-input"
              placeholder="Filter class / stream..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-48 shadow-2xs"
            />
          </div>

          <select
            id="matrix-level-filter"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
          >
            <option value="ALL">All Levels</option>
            {configuredLevels.map((level) => (
              <option key={level} value={level}>{educationLevelLabels[level] || level}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">Active Form Classes</span>
          <div className="mt-1 text-lg font-bold text-slate-900">{totalClasses} Classes</div>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 shadow-2xs">
          <span className="text-[11px] font-medium text-blue-700">Scheduled Periods Today</span>
          <div className="mt-1 text-lg font-bold text-blue-900">{assignedLessonsCount} Periods</div>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 shadow-2xs">
          <span className="text-[11px] font-medium text-emerald-700">Daily Instructional Slots</span>
          <div className="mt-1 text-lg font-bold text-emerald-900">
            {instructionalSlotsCount} Lessons / Day
          </div>
        </div>
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 shadow-2xs">
          <span className="text-[11px] font-medium text-indigo-700">Selected Day</span>
          <div className="mt-1 text-lg font-bold text-indigo-900">
            {DAYS_OF_WEEK.find((d) => d.key === selectedDay)?.label || selectedDay}
          </div>
        </div>
      </div>

      {/* Master Matrix Table Container */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
            <p className="text-xs font-medium">Generating master school timetable matrix...</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-2">
            <Calendar className="h-8 w-8 mx-auto text-slate-400" />
            <p className="text-xs font-semibold text-slate-700">No classes found in the matrix</p>
            <p className="text-[11px] text-slate-400">
              Classes will populate dynamically once active academic streams are created.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              {/* Table Header: Columns are Periods of the day */}
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-700 text-xs">
                  {/* Sticky Class Name Column */}
                  <th className="sticky left-0 z-20 bg-slate-50/95 backdrop-blur-xs px-4 py-3 font-bold border-r border-slate-200 w-44 shadow-2xs">
                    <span className="text-slate-800 uppercase tracking-wider text-[11px]">Class / Stream</span>
                  </th>

                  {slots.map((slot) => {
                    const isBreak = slot.isBreak;
                    return (
                      <th
                        key={slot.index}
                        className={`px-3 py-2.5 text-center border-r border-slate-200 ${
                          isBreak
                            ? 'bg-amber-50/70 text-amber-900 w-24'
                            : 'text-slate-800 min-w-[130px]'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1 font-bold text-xs">
                          {isBreak ? (
                            <>
                              <Coffee className="h-3 w-3 text-amber-600 shrink-0" />
                              <span className="text-amber-800">{slot.label}</span>
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                                P{slot.index}
                              </span>
                              <span>{slot.label}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center justify-center gap-1">
                          <Clock className="h-2.5 w-2.5 text-slate-400" />
                          <span>{`${slot.startTime} - ${slot.endTime}`}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Table Body: Rows are Classes/Streams */}
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRows.map((row) => (
                  <tr key={row.classId} className="hover:bg-slate-50/50 transition-colors">
                    {/* Sticky Class Name Column */}
                    <td className="sticky left-0 z-10 bg-white font-bold text-slate-900 px-4 py-3 border-r border-slate-200 shadow-2xs">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        <span>{row.className}</span>
                      </div>
                      {row.classStream && (
                        <div className="text-[10px] font-normal text-slate-500 pl-3.5">
                          {'Stream ' + row.classStream}
                        </div>
                      )}
                      {row.combination && (
                        <div className="text-[10px] font-semibold text-indigo-700 pl-3.5">
                          {row.combination.name} ({row.combination.code})
                        </div>
                      )}
                    </td>

                    {/* Cells for each period of the day */}
                    {row.cells.map((cell) => {
                      // 1. Break slot
                      if (cell.isBreak) {
                        return (
                          <td
                            key={cell.slotIndex}
                            className="bg-amber-50/40 border-r border-slate-100 text-center py-2 px-1 text-[10px] font-medium text-amber-800 select-none"
                          >
                            <span className="uppercase tracking-wider opacity-80 text-[9px] font-semibold">
                              {cell.breakLabel || 'Break'}
                            </span>
                          </td>
                        );
                      }

                      // 2. Continuation of double-period
                      if (cell.isContinuation) {
                        return (
                          <td
                            key={cell.slotIndex}
                            className="p-1.5 border-r border-slate-100 bg-indigo-50/20 text-center"
                          >
                            <div className="h-full min-h-[56px] flex items-center justify-center text-[10px] font-semibold text-indigo-500 italic rounded border border-dashed border-indigo-200 bg-indigo-50/30">
                              (Double Block)
                            </div>
                          </td>
                        );
                      }

                      // 3. Assigned lesson period
                      if (cell.isAssigned && cell.period) {
                        const period = cell.period;
                        return (
                          <td
                            key={cell.slotIndex}
                            className={`p-1.5 border-r border-slate-100 ${
                              cell.isDoublePeriod ? 'bg-indigo-50/20' : ''
                            }`}
                          >
                            <div
                              role="button"
                              tabIndex={0}
                              id={`matrix-assigned-cell-${row.classId}-${cell.slotIndex}`}
                              onClick={() => {
                                if (onEditCellClick) {
                                  onEditCellClick(period, row.classId, selectedDay);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  if (onEditCellClick) {
                                    onEditCellClick(period, row.classId, selectedDay);
                                  }
                                }
                              }}
                              title={
                                canManage
                                  ? `Click to edit or reassign ${period.subjectCode} (${period.teacherName})`
                                  : `${period.subjectName} with ${period.teacherName}`
                              }
                              className={`group relative rounded-lg border border-blue-200/90 bg-blue-50/80 p-2 text-left shadow-2xs transition-all ${
                                canManage
                                  ? 'hover:border-blue-400 hover:shadow-xs hover:bg-blue-100/70 cursor-pointer active:scale-98'
                                  : ''
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-blue-900 text-xs tracking-tight">
                                  {period.subjectCode}
                                </span>
                                <div className="flex items-center gap-1">
                                  {cell.isDoublePeriod && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700">
                                      2x
                                    </span>
                                  )}
                                  {canManage && (
                                    <Edit2 className="h-2.5 w-2.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  )}
                                </div>
                              </div>

                              <div className="text-[11px] font-medium text-slate-700 truncate flex items-center gap-1 mt-0.5">
                                <User className="h-3 w-3 text-slate-400 shrink-0" />
                                <span className="truncate">{period.teacherName}</span>
                              </div>

                              {period.room && (
                                <div className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                  <MapPin className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                                  <span className="truncate">{period.room}</span>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      }

                      // 4. Empty slot: clickable to open assignment modal
                      return (
                        <td
                          key={cell.slotIndex}
                          className="p-1.5 border-r border-slate-100 text-center"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              onCellClick(row.classId, cell.startTime, cell.endTime)
                            }
                            className="group h-full w-full min-h-[56px] rounded-lg border border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex flex-col items-center justify-center gap-0.5 transition-all p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                            title={`Assign lesson for ${row.className} at ${cell.startTime}`}
                          >
                            <Plus className="h-3.5 w-3.5 group-hover:scale-115 transition-transform" />
                            <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                              Assign
                            </span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Matrix Legend Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 text-[11px] text-slate-600">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-slate-700">Legend:</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-blue-100 border border-blue-300" />
              <span>Assigned Lesson (Click to edit / reassign)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-indigo-100 border border-indigo-300" />
              <span>Double Period (2x)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-amber-100 border border-amber-300" />
              <span>Break Time</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded border border-dashed border-slate-300" />
              <span>Available Slot (Click to assign)</span>
            </span>
          </div>

          <div className="text-[10px] text-slate-400">
            Clicking any assigned cell allows reassigning teacher or removing the period.
          </div>
        </div>
      </div>
    </div>
  );
};
