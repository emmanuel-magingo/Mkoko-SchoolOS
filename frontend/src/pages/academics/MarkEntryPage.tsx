import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AcademicsApi } from '../../api/academics.api';
import { Assessment } from '../../types/academics.types';
import { useAcademicContext } from '../../contexts/AcademicContext';
import { AssessmentList } from '../../components/academics/assessments/AssessmentList';
import { MarksEntryGrid } from '../../components/academics/assessments/MarksEntryGrid';

export const MarkEntryPage: React.FC = () => {
  useAcademicContext();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState<boolean>(!!id);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setLoading(true);
      AcademicsApi.getMarks(id)
        .then((res) => {
          setSelectedAssessment(res.data.assessment);
        })
        .catch((err) => {
          setError(err?.response?.data?.error?.message || 'Failed to load assessment');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setSelectedAssessment(null);
      setLoading(false);
    }
  }, [id]);

  const handleSelectFromList = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
  };

  const handleBackToList = () => {
    setSelectedAssessment(null);
    if (id) {
      navigate('/academics/assessments/marks-entry');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs font-medium">Loading assessment mark sheet...</p>
      </div>
    );
  }

  if (selectedAssessment) {
    return (
      <div className="space-y-6">
        <MarksEntryGrid
          assessment={selectedAssessment as any}
          onBack={handleBackToList}
          onSuccess={() => {
            // Refetch assessment if needed
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
          {error}
        </div>
      )}
      <AssessmentList onSelectAssessment={handleSelectFromList} />
    </div>
  );
};
