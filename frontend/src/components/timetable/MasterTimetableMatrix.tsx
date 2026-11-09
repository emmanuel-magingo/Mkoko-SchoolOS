import React from 'react';
import { Plus, Coffee, Utensils } from 'lucide-react';
import { TimetableMatrixResponse, MatrixSlot } from '../../api/timetableApi';

interface MasterTimetableMatrixProps {
  matrix: TimetableMatrixResponse | null;
  isLoading: boolean;
  canManage: boolean;
  onCellClick: (classId: string, startTime: string, endTime: string) => void;
  selectedDay: string;
  onDayChange: (day: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  termFilter: string;
  onTermChange: (termId: string) => void;
  terms: Array<{ id: string; name: string }>;
}

export const MasterTimetableMatrix: React.FC<MasterTimetableMatrixProps> = ({
  matrix,
  isLoading,
  canManage,
  onCellClick,
  selectedDay,
  onDayChange,
  statusFilter,
  onStatusChange,
  termFilter,
  onTermChange,
  terms,
}) => {
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Term Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Academic Term
            </label>
            <select
              value={termFilter}
              onChange={(e) => onTermChange(e.target.value)}
              className="p-2 border border-slate-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-brand-500"
            >
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Publication Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="p-2 border border-slate-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">All Schedules</option>
              <option value="PUBLISHED">Published Only</option>
              <option value="DRAFT">Draft Only</option>
            </select>
          </div>
        </div>

        {/* Day of Week Tabs */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            School Day
          </label>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => onDayChange(day)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  selectedDay === day
                    ? 'bg-white text-brand-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {day.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500">
            <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm">Loading master timetable matrix...</p>
          </div>
        ) : !matrix || matrix.rows.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <p className="text-sm font-medium">No classes configured for this tenant.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              {/* Header: Periods & Breaks */}
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs font-semibold">
                  <th className="sticky left-0 z-20 bg-slate-50 px-4 py-3.5 border-r border-slate-200 w-36 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]">
                    Class / Stream
                  </th>
                  {matrix.slots.map((slot: MatrixSlot) => (
                    <th
                      key={slot.index}
                      className={`px-3 py-3 border-r border-slate-200 text-center ${
                        slot.isBreak
                          ? 'bg-amber-50/70 text-amber-900 w-24'
                          : 'w-32'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-center gap-1">
                        {slot.isBreak ? (
                          slot.breakType === 'LUNCH_BREAK' ? (
                            <Utensils size={13} className="text-amber-600" />
                          ) : (
                            <Coffee size={13} className="text-amber-600" />
                          )
                        ) : null}
                        <span>{slot.label}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal font-mono mt-0.5">
                        {slot.startTime} - {slot.endTime}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Rows: Each School Class */}
              <tbody className="divide-y divide-slate-200 text-xs">
                {matrix.rows.map((row) => (
                  <tr key={row.classId} className="hover:bg-slate-50/60 transition-colors">
                    {/* Sticky Class Column */}
                    <td className="sticky left-0 z-10 bg-white font-bold text-slate-900 px-4 py-3 border-r border-slate-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]">
                      <div className="text-sm text-slate-800">{row.className}</div>
                      {row.classStream && (
                        <div className="text-[11px] font-normal text-slate-500">
                          Stream: {row.classStream}
                        </div>
                      )}
                    </td>

                    {/* Slot Cells */}
                    {row.cells.map((cell) => {
                      // 1. Break Slots
                      if (cell.isBreak) {
                        return (
                          <td
                            key={cell.slotIndex}
                            className="bg-amber-50/40 border-r border-slate-200 text-center py-2 px-1 text-[11px] text-amber-800 font-medium select-none"
                          >
                            <span className="writing-mode-vertical tracking-wider text-[10px] uppercase opacity-75">
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
                            className="p-1.5 border-r border-slate-200 bg-indigo-50/20 text-center"
                          >
                            <div className="h-full flex items-center justify-center text-[10px] font-semibold text-indigo-400 italic">
                              (Double block cont.)
                            </div>
                          </td>
                        );
                      }

                      // 3. Assigned Lesson
                      if (cell.isAssigned && cell.period) {
                        const isDraft = cell.period.status === 'DRAFT';
                        return (
                          <td
                            key={cell.slotIndex}
                            className={`p-1.5 border-r border-slate-200 ${
                              cell.isDoublePeriod ? 'bg-indigo-50/40' : ''
                            }`}
                          >
                            <div
                              className={`rounded-lg p-2.5 border transition-all shadow-xs ${
                                cell.isDoublePeriod
                                  ? 'bg-indigo-50/80 border-indigo-200 hover:border-indigo-300'
                                  : 'bg-blue-50/60 border-blue-200 hover:border-blue-300'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-bold text-slate-900 tracking-tight text-xs truncate">
                                  {cell.period.subjectCode}
                                </span>
                                {cell.isDoublePeriod && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-indigo-200 text-indigo-800">
                                    2x Block
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-600 font-medium truncate" title={cell.period.subjectName}>
                                {cell.period.subjectName}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate mt-1">
                                👨‍🏫 {cell.period.teacherName}
                              </div>
                              {cell.period.room && (
                                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                  📍 {cell.period.room}
                                </div>
                              )}
                              {isDraft && (
                                <div className="mt-1 text-[9px] font-semibold text-amber-700 bg-amber-100 px-1 py-0.2 rounded w-fit">
                                  Draft
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      }

                      // 4. Empty Slot
                      return (
                        <td
                          key={cell.slotIndex}
                          className="p-1.5 border-r border-slate-200 text-center group"
                        >
                          {canManage ? (
                            <button
                              type="button"
                              onClick={() => onCellClick(row.classId, cell.startTime, cell.endTime)}
                              className="w-full h-18 rounded-lg border border-dashed border-slate-200 hover:border-brand-400 hover:bg-brand-50/50 flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-brand-600 transition-all cursor-pointer group-hover:shadow-xs"
                              title={`Schedule lesson for ${row.className} (${cell.startTime}-${cell.endTime})`}
                            >
                              <Plus size={16} className="group-hover:scale-110 transition-transform" />
                              <span className="text-[10px] font-medium hidden group-hover:inline">
                                Assign
                              </span>
                            </button>
                          ) : (
                            <div className="h-18 rounded-lg bg-slate-50/50 flex items-center justify-center text-slate-300 text-[11px]">
                              -
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
