import React from 'react';
import { useAcademicContext } from '../../contexts/AcademicContext';
import { ReportCardManager } from '../../components/academics/assessments/ReportCardManager';

export const ReportCardsPage: React.FC = () => {
  useAcademicContext();

  return (
    <div className="space-y-6">
      <ReportCardManager />
    </div>
  );
};

export default ReportCardsPage;
