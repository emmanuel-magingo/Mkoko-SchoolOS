import React from 'react';
import { useAcademicContext } from '../../contexts/AcademicContext';
import { AuditHistoryLog } from '../../components/academics/governance/AuditHistoryLog';

export const AcademicAuditPage: React.FC = () => {
  useAcademicContext();

  return (
    <div className="space-y-6">
      <AuditHistoryLog />
    </div>
  );
};

export default AcademicAuditPage;
