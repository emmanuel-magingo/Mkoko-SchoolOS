import React, { useState, useEffect } from 'react';
import { BookOpen, Layers } from 'lucide-react';
import { SubjectRegistry } from '../../components/academics/structure/SubjectRegistry';
import { SubjectCombinations } from '../../components/academics/structure/SubjectCombinations';
import { useAcademicContext } from '../../contexts/AcademicContext';
import { useAuth } from '../../contexts/AuthContext';
import { isLevelEnabled } from '../../utils/education-level.utils';
import { Subject } from '../../types/academics.types';

export const SubjectRegistryPage: React.FC<{ initialSubjects?: Subject[] }> = ({ initialSubjects }) => {
  const { selectedSchool } = useAcademicContext();
  const { tenant } = useAuth();
  const [activeTab, setActiveTab] = useState<'subjects' | 'combinations'>('subjects');

  const hasALevel = isLevelEnabled('A_LEVEL', tenant, selectedSchool);

  useEffect(() => {
    if (!hasALevel && activeTab === 'combinations') {
      setActiveTab('subjects');
    }
  }, [hasALevel, activeTab]);

  return (
    <div className="space-y-6">
      {/* Sub-navigation tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('subjects')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 -mb-1 ${
            activeTab === 'subjects'
              ? 'border-brand-600 text-brand-700 bg-brand-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Subjects Registry</span>
        </button>

        {hasALevel && (
          <button
            type="button"
            onClick={() => setActiveTab('combinations')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 -mb-1 ${
              activeTab === 'combinations'
                ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>A-Level Combinations</span>
          </button>
        )}
      </div>

      {activeTab === 'subjects' || !hasALevel ? (
        <SubjectRegistry initialSubjects={initialSubjects} />
      ) : (
        <SubjectCombinations />
      )}
    </div>
  );
};
