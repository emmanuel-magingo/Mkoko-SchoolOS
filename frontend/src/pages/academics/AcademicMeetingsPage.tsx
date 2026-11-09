import React from 'react';
import { useAcademicContext } from '../../contexts/AcademicContext';
import { AcademicMeetings } from '../../components/academics/governance/AcademicMeetings';

export const AcademicMeetingsPage: React.FC = () => {
  useAcademicContext();

  return (
    <div className="space-y-6">
      <AcademicMeetings />
    </div>
  );
};

export default AcademicMeetingsPage;
