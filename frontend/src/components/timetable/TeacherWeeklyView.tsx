import React, { useState } from 'react';
import { Coffee, Utensils, CheckCircle2, BookOpen, ShieldAlert } from 'lucide-react';
import {
  TeacherWeeklyScheduleResponse,
  STANDARD_TIMETABLE_SLOTS,
} from '../../api/timetableApi';
import { LessonSignOffModal } from './LessonSignOffModal';

interface TeacherWeeklyViewProps {
  schedule: TeacherWeeklyScheduleResponse | null;
  isLoading: boolean;
  canManage: boolean;
  teachers: Array<{ id: string; firstName: string; lastName: string }>;
  selectedTeacherId?: string;
  onSelectTeacher?: (teacherId: string) => void;
  onRefresh: () => void;
}

export const TeacherWeeklyView: React.FC<TeacherWeeklyViewProps> = ({
  schedule,
  isLoading,
  canManage,
  teachers,
  selectedTeacherId,
  onSelectTeacher,
  onRefresh,
}) => {
  const [selectedPeriodForSignOff, setSelectedPeriodForSignOff] = useState<{
    id: string;
    classId?: string;
    className: string;
    subjectId?: string;
    subjectName: string;
    startTime: string;
    endTime: string;
  } | null>(null);

  const [signOffSuccessMsg, setSignOffSuccessMsg] = useState<string | null>(null);

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  // Standard matrix slots
  const standardSlots = STANDARD_TIMETABLE_SLOTS;

  return (
    <div className="space-y-4">
      {/* Header bar: Teacher selector if authorized manager */}
      {canManage && teachers.length > 0 && onSelectTeacher && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-slate-700">Inspect Teacher Schedule:</label>
            <select
              value={selectedTeacherId}
              onChange={(e) => onSelectTeacher(e.target.value)}
              className="p-2 border border-slate-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-brand-500"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-slate-500">
            Authorized view for Academic Master / Administrators
          </div>
        </div>
      )}

      {signOffSuccessMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{signOffSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSignOffSuccessMsg(null)}
            className="text-xs text-emerald-700 hover:underline font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Grid: 5 Days columns, period rows */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500">
            <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm">Loading weekly teacher schedule...</p>
          </div>
        ) : !schedule ? (
          <div className="p-16 text-center text-slate-500">
            <p className="text-sm">No schedule assignments found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs font-semibold">
                  <th className="px-3 py-3 border-r border-slate-200 w-28 text-center bg-slate-50">
                    Slot / Time
                  </th>
                  {days.map((day) => (
                    <th key={day} className="px-4 py-3 border-r border-slate-200 text-center font-bold">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {standardSlots.map((slot) => {
                  if (slot.isBreak) {
                    return (
                      <tr key={slot.index} className="bg-amber-50/40">
                        <td className="px-3 py-2 border-r border-slate-200 text-center font-bold text-amber-900 bg-amber-50/60">
                          <div className="flex items-center justify-center gap-1">
                            {slot.breakType === 'LUNCH_BREAK' ? (
                              <Utensils size={13} className="text-amber-600" />
                            ) : (
                              <Coffee size={13} className="text-amber-600" />
                            )}
                            <span>{slot.label}</span>
                          </div>
                          <div className="text-[10px] text-amber-700 font-mono font-normal">
                            {slot.startTime} - {slot.endTime}
                          </div>
                        </td>
                        <td
                          colSpan={days.length}
                          className="px-4 py-2 text-center text-amber-800/80 font-medium tracking-wider uppercase text-[11px]"
                        >
                          Official School {slot.label} ({slot.startTime} – {slot.endTime})
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={slot.index} className="hover:bg-slate-50/50">
                      {/* Slot Header */}
                      <td className="px-3 py-3 border-r border-slate-200 text-center bg-slate-50/80">
                        <div className="font-bold text-slate-800">{slot.label}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {slot.startTime} - {slot.endTime}
                        </div>
                      </td>

                      {/* Day Columns */}
                      {days.map((day) => {
                        const daySchedule = schedule.scheduleByDay.find((d) => d.dayOfWeek === day);
                        const daySlot = daySchedule?.slots.find((s) => s.slotIndex === slot.index);

                        if (daySlot?.period) {
                          const period = daySlot.period;
                          return (
                            <td key={day} className="p-2 border-r border-slate-200">
                              <div
                                className={`rounded-lg p-2.5 border transition-all ${
                                  period.isDoublePeriod
                                    ? 'bg-indigo-50/90 border-indigo-200'
                                    : 'bg-blue-50/70 border-blue-200'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="font-bold text-slate-900 text-xs">
                                    {period.className}
                                  </span>
                                  {period.isDoublePeriod && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-indigo-200 text-indigo-800">
                                      2x Block
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] font-semibold text-slate-800 truncate">
                                  {period.subjectName} ({period.subjectCode})
                                </div>
                                {period.room && (
                                  <div className="text-[10px] text-slate-500 mt-1">
                                    Room: {period.room}
                                  </div>
                                )}

                                {/* Sign off lesson action button */}
                                <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedPeriodForSignOff({
                                        id: period.id,
                                        classId: period.classId,
                                        className: period.className,
                                        subjectId: period.subjectId,
                                        subjectName: period.subjectName,
                                        startTime: period.startTime,
                                        endTime: period.endTime,
                                      })
                                    }
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 bg-white px-2 py-1 rounded border border-indigo-200 hover:border-indigo-300 transition-colors shadow-2xs"
                                  >
                                    <BookOpen size={12} />
                                    Sign Off Lesson
                                  </button>
                                </div>
                              </div>
                            </td>
                          );
                        }

                        // Supervised Duty assignment (distinct visual style from academic lessons)
                        if (daySlot?.isDuty && daySlot?.duty) {
                          const duty = daySlot.duty;
                          return (
                            <td key={day} className="p-2 border-r border-slate-200">
                              <div className="rounded-lg p-2.5 border bg-amber-50/90 border-amber-300 shadow-2xs">
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="font-bold text-amber-900 text-xs flex items-center gap-1">
                                    <ShieldAlert size={12} className="text-amber-700" />
                                    Duty
                                  </span>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-200 text-amber-900 uppercase">
                                    {duty.dutyType.replace('_', ' ')}
                                  </span>
                                </div>
                                <div className="text-[11px] font-bold text-slate-900 truncate">
                                  {duty.title}
                                </div>
                                <div className="text-[10px] text-slate-600 mt-1">
                                  Location: {duty.location}
                                </div>
                                <div className="mt-1 text-[10px] text-amber-800 font-mono">
                                  {duty.startTime} – {duty.endTime}
                                </div>
                              </div>
                            </td>
                          );
                        }

                        // Free period
                        return (
                          <td
                            key={day}
                            className="p-2 border-r border-slate-200 text-center text-slate-400 select-none bg-slate-50/20"
                          >
                            <span className="text-[11px] font-medium text-slate-400">
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

      {/* Lesson Sign-Off Modal */}
      <LessonSignOffModal
        isOpen={!!selectedPeriodForSignOff}
        onClose={() => setSelectedPeriodForSignOff(null)}
        period={selectedPeriodForSignOff}
        onSuccess={() => {
          setSignOffSuccessMsg('Lesson log successfully recorded and signed off.');
          onRefresh();
        }}
      />
    </div>
  );
};
