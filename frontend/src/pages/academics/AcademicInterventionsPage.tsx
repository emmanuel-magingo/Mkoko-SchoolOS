import React from 'react';
import { useAcademicContext } from '../../contexts/AcademicContext';
import { AcademicInterventions } from '../../components/academics/support/AcademicInterventions';

export const AcademicInterventionsPage: React.FC = () => {
  useAcademicContext();

  return (
    <div className="space-y-6">
      <AcademicInterventions />
    </div>
  );
};

export default AcademicInterventionsPage;
