import React from 'react';
import { OfficialLessonLogbook } from '../../components/academics/lessons/OfficialLessonLogbook';

export const LogbookPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-2 sm:p-6">
      <OfficialLessonLogbook isOpen={true} />
    </div>
  );
};
