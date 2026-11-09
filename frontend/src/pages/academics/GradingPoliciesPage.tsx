import React from 'react';
import { GradingPolicyLibrary } from '../../components/academics/assessments/GradingPolicyLibrary';
import { useAcademicContext } from '../../contexts/AcademicContext';

export const GradingPoliciesPage: React.FC = () => {
  useAcademicContext();

  return (
    <div className="space-y-6">
      <GradingPolicyLibrary />
    </div>
  );
};
