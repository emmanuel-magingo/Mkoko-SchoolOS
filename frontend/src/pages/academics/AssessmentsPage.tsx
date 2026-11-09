import React, { useState, useEffect } from 'react';
import { AcademicsApi } from '../../api/academics.api';
import { Assessment } from '../../types/academics.types';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import { Link } from 'react-router-dom';
import { FileText, Plus, Edit } from 'lucide-react';

export const AssessmentsPage: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  const isTeacher = user?.role === 'TEACHER';
  const canManage = hasPermission(Permissions.MANAGE_ACADEMICS);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const res = await AcademicsApi.getAssessments();
      setAssessments(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assessments & Marks</h1>
          <p className="text-slate-500 mt-1">Manage assessments and enter student marks.</p>
        </div>
        {canManage && (
          <button className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors bg-brand-600 text-white hover:bg-brand-700 px-4 py-2">
            <Plus size={16} className="mr-2" />
            New Assessment
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {assessments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <FileText size={32} />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No Assessments Found</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                {isTeacher 
                  ? "You haven't created any assessments yet, or you are not assigned to any subjects." 
                  : "No assessments have been created in the system yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                    <th className="py-3 px-4">Assessment Name</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Max Score</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                  {assessments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900">{a.name}</td>
                      <td className="py-3 px-4">{(a as any).subject?.name || 'Unknown'}</td>
                      <td className="py-3 px-4">{(a as any).class?.name || 'Unknown'}</td>
                      <td className="py-3 px-4">{a.maxScore}</td>
                      <td className="py-3 px-4">
                        {(() => {
                          const status = (a as any).status || 'DRAFT';
                          if (status === 'APPROVED') {
                            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Approved</span>;
                          }
                          if (status === 'LOCKED' || status === 'FINALIZED') {
                            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">Locked</span>;
                          }
                          if (status === 'SUBMITTED') {
                            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Submitted</span>;
                          }
                          if (status === 'UNDER_REVIEW') {
                            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Under Review</span>;
                          }
                          if (status === 'REJECTED') {
                            return (
                              <span
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 cursor-help"
                                title={(a as any).rejectionReason || 'Rejected by reviewer'}
                              >
                                Rejected
                              </span>
                            );
                          }
                          return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">Draft</span>;
                        })()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link to={`/academics/assessments/${a.id}/marks`}>
                          <button className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors border border-slate-300 bg-white hover:bg-slate-50 px-3 py-1.5">
                            {['LOCKED', 'FINALIZED', 'APPROVED'].includes((a as any).status) ? (
                              <>
                                <FileText size={14} className="mr-1" /> View Marks
                              </>
                            ) : (
                              <>
                                <Edit size={14} className="mr-1" /> Enter Marks
                              </>
                            )}
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
