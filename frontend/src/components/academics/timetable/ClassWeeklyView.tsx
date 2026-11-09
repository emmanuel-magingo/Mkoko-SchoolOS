import React from 'react';
import {
  Calendar,
  MapPin,
  GraduationCap,
  AlertCircle,
  Plus,
  User,
} from 'lucide-react';
import {
  TimetablePeriod,
  MatrixSlot,
  STANDARD_TIMETABLE_SLOTS,
} from '../../../api/timetable.api';

export interface ClassWeeklyViewProps {
  periods?: TimetablePeriod[];
  slots?: MatrixSlot[];
  isLoading?: boolean;
  canManage?: boolean;
  classes?: Array<{ id: string; name: string; level?: string; stream?: string; combination?: { name: string; code: string } | null }>;
  selectedClassId?: string;
  onSelectClass?: (classId: string) => void;
  onCellClick?: (classId: string, dayOfWeek: string, startTime: string, endTime: string) => void;
  onEditCellClick?: (period: any, classId: string, dayOfWeek: string) => void;
  error?: string | null;
}

const WEEK_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const;

export const ClassWeeklyView: React.FC<ClassWeeklyViewProps> = ({
  periods = [],
  slots,
  isLoading = false,
  canManage = false,
  classes = [],
  selectedClassId,
  onSelectClass,
  onCellClick,
  onEditCellClick,
  error,
}) => {
  const standardSlots: MatrixSlot[] = slots && slots.length > 0 ? slots : STANDARD_TIMETABLE_SLOTS;

  // Selected class display
  const activeClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const effectiveClassId = activeClass?.id || selectedClassId || '';
  const classDisplayName = activeClass
    ? `${activeClass.name}${activeClass.stream ? ` (${activeClass.stream})` : ''}${activeClass.combination ? ` — ${activeClass.combination.name} (${activeClass.combination.code})` : ''}`
    : 'Selected Class';

  // Filter periods strictly belonging to this class
  const classPeriods = periods.filter((p) => {
    return p.classId === effectiveClassId;
  });

  const totalLessonsThisWeek = classPeriods.length;
  const instructionalDurations = Array.from(new Set(
    standardSlots
      .filter((slot) => !slot.isBreak)
      .map((slot) => {
        const [startHour, startMinute] = slot.startTime.split(':').map(Number);
        const [endHour, endMinute] = slot.endTime.split(':').map(Number);
        return endHour * 60 + endMinute - (startHour * 60 + startMinute);
      })
  ));
  const periodDurationLabel = instructionalDurations.length === 1
    ? `${instructionalDurations[0]} Minutes`
    : instructionalDurations.length > 1 ? 'Variable' : '—';

  return (
    <div id="class-weekly-view" className="space-y-4">
      {/* Error Banner */}
      {error && (
        <div
          id="class-weekly-error-alert"
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* Class Selection & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              {`${classDisplayName}'s Weekly Timetable`}
            </h4>
            <p className="text-[11px] text-slate-500">
              Instructional schedule, subjects, assigned teachers and classrooms across Monday to Friday
            </p>
          </div>
        </div>

        {/* Class Dropdown Switcher */}
        {classes.length > 0 && onSelectClass && (
          <div className="flex items-center gap-2">
            <label htmlFor="select-class-timetable" className="text-xs font-semibold text-slate-600">
              Select Class:
            </label>
            <select
              id="select-class-timetable"
              value={effectiveClassId}
              onChange={(e) => onSelectClass(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.stream ? `(${c.stream})` : ''}{c.combination ? ` — ${c.combination.name} (${c.combination.code})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Metric Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 shadow-2xs">
          <span className="text-[11px] font-medium text-indigo-700">Scheduled Lessons</span>
          <div className="mt-1 text-xl font-bold text-indigo-900">
            {`${totalLessonsThisWeek} Lessons`}
          </div>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 shadow-2xs">
          <span className="text-[11px] font-medium text-emerald-700">Instructional Days</span>
          <div className="mt-1 text-xl font-bold text-emerald-900">5 Days</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">Standard Period</span>
          <div className="mt-1 text-xl font-bold text-slate-900">{periodDurationLabel}</div>
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
            <p className="text-xs font-medium">Loading class weekly timetable...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-2">
            <Calendar className="h-8 w-8 mx-auto text-slate-400" />
            <p className="text-xs font-semibold text-slate-700">No classes available</p>
            <p className="text-[11px] text-slate-400">
              Please register academic classes and streams first to display class schedules.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              {/* Header: Columns are Days of the Week */}
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs">
                  <th className="sticky left-0 z-20 bg-slate-50 px-4 py-3 font-bold border-r border-slate-200 w-36">
                    <span>Period &amp; Time</span>
                  </th>
                  {WEEK_DAYS.map((day) => (
                    <th
                      key={day}
                      className="px-4 py-3 font-bold border-r border-slate-200 text-center uppercase tracking-wider text-slate-800"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Rows are Periods of the Day */}
              <tbody className="divide-y divide-slate-100 text-xs">
                {standardSlots.map((slot) => {
                  return (
                    <tr key={slot.index} className="hover:bg-slate-50/50 transition-colors">
                      {/* Period Header Column */}
                      <td className="sticky left-0 z-10 bg-white font-bold text-slate-900 px-4 py-3 border-r border-slate-200 shadow-2xs">
                        <div className="text-xs font-bold text-slate-900">{slot.label}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {`${slot.startTime} - ${slot.endTime}`}
                        </div>
                      </td>

                      {/* Day Columns */}
                      {WEEK_DAYS.map((day) => {
                        // Find matching period for this day and slot time (exact start or interval overlap)
                        const period = classPeriods.find(
                          (p) =>
                            p.dayOfWeek?.toUpperCase() === day &&
                            (p.startTime === slot.startTime ||
                              (p.startTime < slot.endTime && p.endTime > slot.startTime))
                        );

                        // If break slot and no scheduled lesson during this slot
                        if (slot.isBreak && !period) {
                          return (
                            <td
                              key={day}
                              className="bg-amber-50/30 border-r border-slate-100 text-center py-2 px-1 text-[10px] font-medium text-amber-800 select-none"
                            >
                              <span className="uppercase tracking-wider opacity-75">
                                {slot.breakType === 'LUNCH_BREAK' ? 'Lunch Break' : 'Short Break'}
                              </span>
                            </td>
                          );
                        }

                        // If period is assigned
                        if (period) {
                          const subjectCode = period.subject?.code || (period as any).subjectCode || 'SUBJ';
                          const subjectName = period.subject?.name || (period as any).subjectName || 'Subject';
                          const teacherName = period.teacher
                            ? `${period.teacher.firstName} ${period.teacher.lastName}`.trim()
                            : (period as any).teacherName || 'Assigned Teacher';

                          return (
                            <td key={day} className="p-1.5 border-r border-slate-100">
                              <div
                                role={canManage && onEditCellClick ? 'button' : undefined}
                                tabIndex={canManage && onEditCellClick ? 0 : undefined}
                                onClick={() => {
                                  if (canManage && onEditCellClick) {
                                    onEditCellClick(period, effectiveClassId, day);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    if (canManage && onEditCellClick) {
                                      onEditCellClick(period, effectiveClassId, day);
                                    }
                                  }
                                }}
                                title={
                                  canManage
                                    ? `Click to edit or reassign ${subjectCode} (${teacherName})`
                                    : `${subjectName} with ${teacherName}`
                                }
                                className={`rounded-lg border border-indigo-200 bg-indigo-50/80 p-2.5 shadow-2xs space-y-1 transition-all ${
                                  canManage && onEditCellClick
                                    ? 'hover:border-indigo-400 hover:bg-indigo-100/70 hover:shadow-xs cursor-pointer active:scale-98'
                                    : ''
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-bold text-indigo-900 text-xs truncate">
                                    {subjectCode}
                                  </span>
                                  {period.isDoublePeriod && (
                                    <span className="rounded bg-indigo-200 px-1 py-0.2 text-[9px] font-bold text-indigo-800">
                                      2x
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] font-semibold text-slate-800 truncate">
                                  {subjectName}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-slate-600 truncate">
                                  <User className="h-3 w-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{teacherName}</span>
                                </div>
                                {period.room && (
                                  <div className="text-[10px] text-slate-500 flex items-center gap-1 truncate">
                                    <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                                    <span className="truncate">{period.room}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        }

                        // Empty period: Clickable for managers to assign period
                        return (
                          <td
                            key={day}
                            className="p-1.5 border-r border-slate-100 text-center select-none"
                          >
                            {canManage && onCellClick ? (
                              <button
                                type="button"
                                id={`btn-assign-class-${day.toLowerCase()}-${slot.index}`}
                                onClick={() =>
                                  onCellClick(effectiveClassId, day, slot.startTime, slot.endTime)
                                }
                                title={`Assign Period for ${day} ${slot.label}`}
                                className="group w-full h-16 rounded-lg border border-dashed border-slate-200 bg-slate-50/40 p-2 flex flex-col items-center justify-center gap-1 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                <span className="text-[10px] font-medium text-slate-400 group-hover:text-indigo-700 transition-colors">
                                  Assign
                                </span>
                              </button>
                            ) : (
                              <div className="h-16 flex items-center justify-center text-[10px] text-slate-300">
                                —
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
