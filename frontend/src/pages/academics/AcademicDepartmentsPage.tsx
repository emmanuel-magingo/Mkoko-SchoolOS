import React from 'react';
import { AcademicDepartments } from '../../components/academics/structure/AcademicDepartments';
import { useAcademicContext } from '../../contexts/AcademicContext';
import { AcademicDepartment, Teacher } from '../../types/academics.types';

export const AcademicDepartmentsPage: React.FC<{
  initialDepartments?: AcademicDepartment[];
  initialTeachers?: Teacher[];
}> = (props) => {
  useAcademicContext();

  return (
    <div className="space-y-6">
      <AcademicDepartments {...props} />
    </div>
  );
};

export default AcademicDepartmentsPage;
