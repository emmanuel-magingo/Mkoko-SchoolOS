import React from 'react';
import { useAcademicContext } from '../../contexts/AcademicContext';
import { AcademicAnalyticsDashboard } from '../../components/academics/governance/AcademicAnalyticsDashboard';

export const AcademicAnalyticsPage: React.FC = () => {
  useAcademicContext();

  return (
    <div className="space-y-6">
      <AcademicAnalyticsDashboard />
    </div>
  );
};

export default AcademicAnalyticsPage;
