import React from 'react';
import { useAcademicContext } from '../../contexts/AcademicContext';
import { DisciplineAndWelfare } from '../../components/academics/support/DisciplineAndWelfare';

export const DisciplineAndWelfarePage: React.FC = () => {
  useAcademicContext();

  return (
    <div className="space-y-6">
      <DisciplineAndWelfare />
    </div>
  );
};

export default DisciplineAndWelfarePage;
