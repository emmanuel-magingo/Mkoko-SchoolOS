import React from 'react';
import {
  Calendar,
  MapPin,
  User,
  AlertCircle,
} from 'lucide-react';
import {
  TeacherWeeklyScheduleResponse,
  MatrixSlot,
  STANDARD_TIMETABLE_SLOTS,
} from '../../../api/timetable.api';
import { getEducationLevelFromClass } from '../../../utils/education-level.utils';

export interface TeacherWeeklyViewProps {
  schedule: TeacherWeeklyScheduleResponse | null;
  slots?: MatrixSlot[];
  isLoading?: boolean;
  canManage?: boolean;
  teachers?: Array<{ id: string; firstName: string; lastName: string }>;
  selectedTeacherId?: string;
  onSelectTeacher?: (teacherId: string) => void;
  classes?: Array<{ id: string; name: string; level?: string; stream?: string }>;
  selectedClassId?: string;
  onSelectClass?: (classId: string) => void;
  selectedLevel?: string;
  onSelectLevel?: (level: string) => void;
  currentUserId?: string;
  error?: string | null;
}

const WEEK_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const;

export const TeacherWeeklyView: React.FC<TeacherWeeklyViewProps> = ({
  schedule,
  slots,
  isLoading = false,
  canManage = false,
  teachers = [],
  selectedTeacherId,
  onSelectTeacher,
  classes = [],
  selectedClassId = 'ALL',
  onSelectClass,
  selectedLevel = 'ALL',
  onSelectLevel,
  currentUserId: _currentUserId,
  error,
}) => {
  const standardSlots: MatrixSlot[] =
    slots && slots.length > 0
      ? slots
      : (schedule as any)?.slots && (schedule as any).slots.length > 0
      ? (schedule as any).slots
      : STANDARD_TIMETABLE_SLOTS;
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

  // Selected teacher display
  const activeTeacher = teachers.find((t) => t.id === selectedTeacherId);
  const teacherDisplayName =
    (schedule as any)?.teacherName ||
    (activeTeacher ? `${activeTeacher.firstName} ${activeTeacher.lastName}` : 'Assigned Teacher');

  // Compute weekly lesson load
  let totalLessonsThisWeek = schedule?.periods?.length || 0;
  if (!totalLessonsThisWeek && schedule?.scheduleByDay) {
    for (const day of schedule.scheduleByDay) {
      for (const slot of day.slots) {
        if (!slot.isBreak && slot.period) {
          totalLessonsThisWeek++;
        }
      }
    }
  }

  return (
    <div id="teacher-weekly-view" className="space-y-4">
      {error && (
        <div id="teacher-weekly-error-alert" role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}
      {/* Teacher Selection & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
            <User className="h-5 w-5" />
          </span>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              {`${teacherDisplayName}'s Weekly Schedule`}
            </h4>
            <p className="text-[11px] text-slate-500">
              Personal academic instructional timetable across Monday to Friday
            </p>
          </div>
        </div>

        {/* Filter Controls for Academic Masters */}
        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            {teachers.length > 0 && onSelectTeacher && (
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Teacher:</label>
                <select
                  id="select-teacher-schedule"
                  value={selectedTeacherId}
                  onChange={(e) => onSelectTeacher(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {onSelectLevel && (
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Level:</label>
                <select
                  id="select-teacher-level"
                  value={selectedLevel}
                  onChange={(e) => onSelectLevel(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                >
                  <option value="ALL">All Levels</option>
                  <option value="PRIMARY">Primary</option>
                  <option value="O_LEVEL">Secondary / O-Level</option>
                  <option value="A_LEVEL">Advanced / A-Level</option>
                </select>
              </div>
            )}

            {classes.length > 0 && onSelectClass && (
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Class:</label>
                <select
                  id="select-teacher-class"
                  value={selectedClassId}
                  onChange={(e) => onSelectClass(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                >
                  <option value="ALL">All Classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.stream ? `(${c.stream})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Metric Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 shadow-2xs">
          <span className="text-[11px] font-medium text-blue-700">Weekly Teaching Load</span>
          <div className="mt-1 text-xl font-bold text-blue-900">
            {`${totalLessonsThisWeek} Lessons`}
          </div>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 shadow-2xs">
          <span className="text-[11px] font-medium text-emerald-700">Active School Days</span>
          <div className="mt-1 text-xl font-bold text-emerald-900">5 Days</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500">Period Duration</span>
          <div className="mt-1 text-xl font-bold text-slate-900">{periodDurationLabel}</div>
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
            <p className="text-xs font-medium">Loading personal weekly schedule...</p>
          </div>
        ) : !schedule ? (
          <div className="p-16 text-center text-slate-500 space-y-2">
            <Calendar className="h-8 w-8 mx-auto text-slate-400" />
            <p className="text-xs font-semibold text-slate-700">No scheduled lessons found</p>
            <p className="text-[11px] text-slate-400">
              There are currently no active teaching assignments allocated to this instructor.
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
                        // Find scheduled slot for this day
                        const daySchedule = schedule.scheduleByDay?.find(
                          (d) => d.dayOfWeek?.toUpperCase() === day
                        );
                        const daySlot = daySchedule?.slots?.find(
                          (s) => s.startTime === slot.startTime || s.slotIndex === slot.index
                        );

                        // If break slot and no scheduled lesson during this slot
                        if (slot.isBreak && (!daySlot || !daySlot.period)) {
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
                        const slotPeriods =
                          (daySlot as any)?.periods && (daySlot as any).periods.length > 0
                            ? (daySlot as any).periods
                            : daySlot?.period
                            ? [daySlot.period]
                            : [];

                        let visiblePeriods = slotPeriods;
                        if (selectedClassId && selectedClassId !== 'ALL') {
                          visiblePeriods = visiblePeriods.filter((p: any) => p.classId === selectedClassId);
                        }
                        if (selectedLevel && selectedLevel !== 'ALL') {
                          visiblePeriods = visiblePeriods.filter((p: any) => {
                            const pLevel = getEducationLevelFromClass(p.classLevel, p.className);
                            return pLevel === selectedLevel;
                          });
                        }

                        if (visiblePeriods.length > 0) {
                          return (
                            <td
                              key={day}
                              className="p-1.5 border-r border-slate-100 align-top space-y-1"
                            >
                              {visiblePeriods.length > 1 && (
                                <div className="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 rounded px-1.5 py-0.5 mb-1 flex items-center gap-1 shadow-2xs">
                                  <span>⚠️ Conflict: {visiblePeriods.length} concurrent classes</span>
                                </div>
                              )}
                              {visiblePeriods.map((p: any) => (
                                <div
                                  key={p.id}
                                  className="rounded-lg border border-blue-200 bg-blue-50/70 p-2 shadow-2xs space-y-1 mb-1"
                                >
                                  <div className="font-bold text-blue-900 text-xs truncate">
                                    {p.className}
                                    {p.classStream ? ` (${p.classStream})` : ''}
                                  </div>
                                  {p.combination && (
                                    <div className="text-[10px] font-semibold text-indigo-700 truncate">
                                      {p.combination.name} ({p.combination.code})
                                    </div>
                                  )}
                                  <div className="text-[11px] font-medium text-slate-700 truncate">
                                    {p.subjectCode} — {p.subjectName}
                                  </div>
                                  {p.room && (
                                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                      <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                                      <span className="truncate">{p.room}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </td>
                          );
                        }

                        // Empty period: Free slot
                        return (
                          <td
                            key={day}
                            className="p-2 border-r border-slate-100 text-center text-slate-400"
                          >
                            <span className="text-[11px] italic font-normal text-slate-400">
                              Free Period
                            </span>
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
