import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Clock, ArrowRight, CheckCircle2, FileSpreadsheet, BookMarked, Sparkles } from 'lucide-react';
import { useAcademicContext } from '../../contexts/AcademicContext';
import { Badge } from '../../components/common/Badge';

export const MyTasksPage: React.FC = () => {
  const { currentTerm } = useAcademicContext();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('PENDING');

  const tasks = [
    {
      id: 'task-1',
      title: 'Submit Form 1 - A Mathematics Mid-Term Marks',
      description: 'Scores for 10 enrolled students are pending final entry and verification before assessment lock.',
      category: 'MARKS',
      priority: 'HIGH',
      status: 'PENDING',
      dueDate: 'Today, 17:00',
      actionUrl: '/academics/assessments',
      actionLabel: 'Enter Marks',
      icon: FileSpreadsheet,
    },
    {
      id: 'task-2',
      title: 'Sign Off Today\'s Lesson Execution Logs',
      description: 'Record lesson execution summary, topic coverage, and participation notes for Periods 3 and 4.',
      category: 'LESSONS',
      priority: 'MEDIUM',
      status: 'PENDING',
      dueDate: 'Today, 16:30',
      actionUrl: '/academics/operations/lesson-logs',
      actionLabel: 'Log Lessons',
      icon: BookMarked,
    },
    {
      id: 'task-3',
      title: 'Review Physics Academic Improvement Plan',
      description: 'Follow-up on student intervention milestone for Daudi Peter (Form 2 - A) following Mid-Term diagnostic.',
      category: 'SUPPORT',
      priority: 'MEDIUM',
      status: 'PENDING',
      dueDate: 'Tomorrow',
      actionUrl: '/academics/support/interventions',
      actionLabel: 'View Plan',
      icon: Sparkles,
    },
    {
      id: 'task-4',
      title: 'Submit Morning Class Attendance Register',
      description: 'Daily attendance manifest for Form 1 - A morning session marked and submitted.',
      category: 'ATTENDANCE',
      priority: 'LOW',
      status: 'COMPLETED',
      dueDate: 'Completed at 08:30 AM',
      actionUrl: '/academics/operations/attendance',
      actionLabel: 'View Register',
      icon: CheckCircle2,
    },
  ];

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'ALL') return true;
    return t.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">My Academic Tasks</h1>
              <p className="text-xs text-slate-500">
                Action items, pending log submissions, assessment grading duties, and student welfare follow-ups.
              </p>
            </div>
          </div>
        </div>

        {currentTerm && (
          <span className="px-3 py-1.5 text-xs font-bold bg-brand-50 border border-brand-100 text-brand-700 rounded-xl">
            {currentTerm.name} Active Duties
          </span>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              filter === 'PENDING'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Pending Action (3)
          </button>
          <button
            onClick={() => setFilter('COMPLETED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              filter === 'COMPLETED'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Completed (1)
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              filter === 'ALL'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Tasks
          </button>
        </div>

        <span className="text-xs text-slate-400 px-3">
          Showing {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Task Cards */}
      <div className="space-y-3">
        {filteredTasks.map((t) => {
          const IconComponent = t.icon;
          return (
            <div
              key={t.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-brand-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 flex-1">
                <div className={`p-2.5 rounded-xl border shrink-0 ${
                  t.status === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    : t.priority === 'HIGH'
                    ? 'bg-rose-50 text-rose-600 border-rose-100'
                    : 'bg-brand-50 text-brand-600 border-brand-100'
                }`}>
                  <IconComponent className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{t.title}</h3>
                    {t.priority === 'HIGH' && (
                      <Badge variant="danger" size="sm">Urgent</Badge>
                    )}
                    {t.status === 'COMPLETED' && (
                      <Badge variant="success" size="sm">Completed</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{t.description}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Due: {t.dueDate}</span>
                  </div>
                </div>
              </div>

              <div className="sm:text-right shrink-0">
                <Link
                  to={t.actionUrl}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors"
                >
                  <span>{t.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyTasksPage;
