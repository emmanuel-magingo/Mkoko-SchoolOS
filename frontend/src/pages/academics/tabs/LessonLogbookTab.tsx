import React from 'react';
import { OfficialLessonLogbook } from '../../../components/academics/lessons/OfficialLessonLogbook';

export interface LessonLogbookTabProps {
  subjectId: string;
  classId: string;
  subjectName: string;
  className: string;
  lessonDate?: string;
  teacherId?: string;
  teacherName?: string;
}

/**
 * Contextual Logbook tab rendered inside the Lesson Execution page.
 * Embeds the OfficialLessonLogbook component scoped to the lesson's context.
 */
export const LessonLogbookTab: React.FC<LessonLogbookTabProps> = ({
  subjectId: _subjectId,
  classId: _classId,
  subjectName,
  className,
  lessonDate,
  teacherId,
  teacherName,
}) => {
  return (
    <div className="space-y-4">
      {/* Context header */}
      <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-slate-50 p-4">
        <div className="flex items-center gap-2 text-xs text-amber-800">
          <span className="font-bold">📋 Logbook Scope:</span>
          <span className="font-semibold text-slate-900">{subjectName}</span>
          <span className="text-slate-400">—</span>
          <span className="font-semibold text-slate-900">{className}</span>
          {lessonDate && (
            <>
              <span className="text-slate-400">|</span>
              <span className="font-mono text-slate-600">{lessonDate}</span>
            </>
          )}
        </div>
      </div>

      <OfficialLessonLogbook
        isOpen={true}
        initialStartDate={lessonDate}
        initialEndDate={lessonDate}
        initialTeacherId={teacherId}
        initialTeacherName={teacherName}
      />
    </div>
  );
};
