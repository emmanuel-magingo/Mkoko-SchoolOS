import React from 'react';
import { ModerationQueue } from '../../components/academics/assessments/ModerationQueue';
import { useAcademicContext } from '../../contexts/AcademicContext';

export const AssessmentModerationPage: React.FC = () => {
  useAcademicContext();

  return (
    <div className="space-y-6">
      <ModerationQueue />
    </div>
  );
};
