import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Award,
  BookCheck,
  BookOpen,
  Calendar,
  CalendarOff,
  Users,
} from 'lucide-react';
import { api } from '../../api/client';
import { AnalyticsPanel, HorizontalBars, TrendLine } from '../../components/common/AnalyticsCharts';
import { StatCard } from '../../components/common/StatCard';
import { ReportCardsManager } from '../../components/academics/ReportCardsManager';
import { LessonLogsManager } from '../../components/academics/LessonLogsManager';
import { SchoolClosuresManager } from '../../components/academics/SchoolClosuresManager';

interface AcademicDashboardData {
  summary: {
    totalStudents: number;
    classCount: number;
    completedAssessments: number;
    averagePerformance: number | null;
  };
  performanceTrend: Array<{ label: string; period: string; average: number }>;
  gradeDistribution: Array<{ grade: string; count: number }>;
  classPerformance: Array<{ id: string; name: string; average: number }>;
  subjectPerformance: Array<{ id: string; name: string; average: number }>;
  filters: {
    academicYears: Array<{ id: string; name: string; active: boolean }>;
    terms: Array<{ id: string; name: string; academicYearId: string }>;
    classes: Array<{ id: string; name: string }>;
    subjects: Array<{ id: string; name: string }>;
  };
}

export const AcademicsDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'report_cards' | 'lesson_logs' | 'closures'>('analytics');
  const [data, setData] = useState<AcademicDashboardData | null>(null);
  const [academicYearId, setAcademicYearId] = useState('');
  const [termId, setTermId] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    const filters = new URLSearchParams();
    if (academicYearId) filters.set('academicYearId', academicYearId);
    if (termId) filters.set('termId', termId);
    if (classId) filters.set('classId', classId);
    if (subjectId) filters.set('subjectId', subjectId);

    setLoading(true);
    const query = filters.toString();
    api.get<AcademicDashboardData>(`/dashboard/academics${query ? `?${query}` : ''}`)
      .then((response) => {
        if (!current) return;
        setData(response.data);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!current) return;
        setError(cause instanceof Error ? cause.message : 'Unable to load academic analytics.');
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [academicYearId, termId, classId, subjectId]);

  const clearFilters = () => {
    setAcademicYearId('');
    setTermId('');
    setClassId('');
    setSubjectId('');
  };

  const filterClass =
    'min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20';

  return (
    <div className="min-w-0 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Academic Management v2</h1>
          <p className="mt-1 text-sm text-slate-500">
            Assessments, canonical NECTA divisions, teacher lesson logs, and school calendar
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/academics/assessments"
            className="rounded-lg bg-brand-600 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-brand-700"
          >
            Assessments &amp; marks
          </Link>
          <Link
            to="/classes"
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Classes
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'analytics'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Activity className="w-4 h-4" />
          Performance &amp; Analytics
        </button>
        <button
          onClick={() => setActiveTab('report_cards')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'report_cards'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Award className="w-4 h-4" />
          Report Cards &amp; Divisions
        </button>
        <button
          onClick={() => setActiveTab('lesson_logs')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'lesson_logs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookCheck className="w-4 h-4" />
          Teacher Lesson Logs
        </button>
        <button
          onClick={() => setActiveTab('closures')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'closures'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CalendarOff className="w-4 h-4" />
          School Closures
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading && activeTab === 'analytics' && (
        <div className="flex items-center gap-2 text-xs text-slate-500 p-2">
          <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <span>Updating academic analytics...</span>
        </div>
      )}

      {/* Tab 1: Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <section
            aria-label="Academic filters"
            className="grid min-w-0 grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5"
          >
            <select
              aria-label="Academic year"
              className={filterClass}
              value={academicYearId}
              onChange={(event) => {
                setAcademicYearId(event.target.value);
                setTermId('');
              }}
            >
              <option value="">All academic years</option>
              {data?.filters.academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                  {year.active ? ' (Active)' : ''}
                </option>
              ))}
            </select>
            <select
              aria-label="Term"
              className={filterClass}
              value={termId}
              onChange={(event) => setTermId(event.target.value)}
            >
              <option value="">All terms</option>
              {data?.filters.terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Class"
              className={filterClass}
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
            >
              <option value="">All assigned classes</option>
              {data?.filters.classes.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {schoolClass.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Subject"
              className={filterClass}
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
            >
              <option value="">All assigned subjects</option>
              {data?.filters.subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Clear filters
            </button>
          </section>

          <section
            aria-label="Academic overview"
            className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <StatCard
              title="Total students"
              value={data?.summary.totalStudents ?? 0}
              icon={Users}
              subtitle="Enrolled across scoped classes"
            />
            <StatCard
              title="Class count"
              value={data?.summary.classCount ?? 0}
              icon={BookOpen}
              subtitle="Active academic classes"
            />
            <StatCard
              title="Finalized assessments"
              value={data?.summary.completedAssessments ?? 0}
              icon={Calendar}
              subtitle="Assessments included in metrics"
            />
            <StatCard
              title="Average performance"
              value={data?.summary.averagePerformance != null ? `${data.summary.averagePerformance}%` : 'N/A'}
              icon={Activity}
              subtitle="Mean finalized assessment score"
            />
          </section>

          <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
            <AnalyticsPanel
              title="Performance trend"
              subtitle="Average percentage scores across finalized assessments."
            >
              <TrendLine
                points={(data?.performanceTrend || []).map((point) => ({
                  label: point.label,
                  value: point.average,
                  detail: `${point.period}: ${point.average}%`,
                }))}
              />
            </AnalyticsPanel>

            <AnalyticsPanel
              title="Grade distribution"
              subtitle="Aggregated letter-grade outcomes for finalized marks."
            >
              <HorizontalBars
                points={(data?.gradeDistribution || []).map((item) => ({
                  label: item.grade,
                  value: item.count,
                }))}
              />
            </AnalyticsPanel>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
            <AnalyticsPanel
              title="Performance by class"
              subtitle="Comparative mean scores across assigned student cohorts."
            >
              <HorizontalBars
                points={(data?.classPerformance || []).map((item) => ({
                  label: item.name,
                  value: item.average,
                }))}
                valueSuffix="%"
              />
            </AnalyticsPanel>

            <AnalyticsPanel
              title="Performance by subject"
              subtitle="Mean achievement across departments and subjects."
            >
              <HorizontalBars
                points={(data?.subjectPerformance || []).map((item) => ({
                  label: item.name,
                  value: item.average,
                }))}
                valueSuffix="%"
              />
            </AnalyticsPanel>
          </div>
        </div>
      )}

      {/* Tab 2: Report Cards & Divisions */}
      {activeTab === 'report_cards' && (
        <ReportCardsManager
          academicYears={data?.filters?.academicYears || []}
          terms={data?.filters?.terms || []}
          classes={data?.filters?.classes || []}
        />
      )}

      {/* Tab 3: Teacher Lesson Logs */}
      {activeTab === 'lesson_logs' && (
        <LessonLogsManager
          classes={data?.filters?.classes || []}
          subjects={data?.filters?.subjects || []}
        />
      )}

      {/* Tab 4: School Closures */}
      {activeTab === 'closures' && (
        <SchoolClosuresManager classes={data?.filters?.classes || []} />
      )}
    </div>
  );
};
