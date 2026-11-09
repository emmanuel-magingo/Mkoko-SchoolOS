import React from 'react';
import { TeacherAllocation } from '../../components/academics/structure/TeacherAllocation';
import { useAcademicContext } from '../../contexts/AcademicContext';

export const TeacherAllocationPage: React.FC<{
  initialClasses?: any[];
  initialSubjects?: any[];
  initialTeachers?: any[];
  initialAssignments?: any[];
}> = (props) => {
  useAcademicContext();

  return (
    <div className="space-y-6">
      <TeacherAllocation {...props} />
    </div>
  );
};
