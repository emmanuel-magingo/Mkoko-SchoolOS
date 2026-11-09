import React from 'react';
import { SchemeOfWorkDashboard } from '../../../components/academics/lessons/SchemeOfWorkDashboard';

export interface SchemeOfWorkTabProps {
  subjectId: string;
  classId: string;
  subjectName?: string;
  className?: string;
}

export const SchemeOfWorkTab: React.FC<SchemeOfWorkTabProps> = ({
  subjectId,
  classId,
}) => {
  return (
    <SchemeOfWorkDashboard
      initialSubjectId={subjectId}
      initialClassId={classId}
    />
  );
};

export default SchemeOfWorkTab;
