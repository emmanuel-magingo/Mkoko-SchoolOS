import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  FileSpreadsheet,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';
import { api } from '../../api/client';
import { useAcademicContext } from '../../contexts/AcademicContext';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import { EnrolledStudent, AcademicClass } from '../../types/academic.types';
import { StudentBulkImportModal } from '../../components/academics/StudentBulkImportModal';
import { AddStudentModal } from '../students/AddStudentModal';

export const StudentEnrolments: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedSchool } = useAcademicContext();
  const { hasPermission } = usePermissions();

  const initialClassId = searchParams.get('classId') || '';

  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [maleCount, setMaleCount] = useState(0);
  const [femaleCount, setFemaleCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState(initialClassId);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

  // 1. Fetch available classes for filtering
  useEffect(() => {
    api.get<AcademicClass[]>('/classes')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setClasses(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Fetch students based on filters and pagination
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: searchQuery.trim(),
        classId: classFilter,
        ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
      });

      const res = await api.get<any>(`/students?${params.toString()}`);
      const studentData: EnrolledStudent[] = Array.isArray(res.data) ? res.data : res.data?.students || [];
      setStudents(studentData);

      const metaTotal = Number(res.meta?.total || res.data?.total || studentData.length);
      const metaPages = Number(res.meta?.totalPages || res.data?.totalPages || 1);
      setTotalStudents(metaTotal);
      setTotalPages(metaPages);

      if (res.meta?.activeCount !== undefined) {
        setActiveCount(Number(res.meta.activeCount));
      } else {
        const activeInPage = studentData.filter((s) => s.studentStatus === 'ACTIVE').length;
        setActiveCount(metaTotal > studentData.length && activeInPage === studentData.length ? metaTotal : activeInPage);
      }

      if (res.meta?.maleCount !== undefined) {
        setMaleCount(Number(res.meta.maleCount));
      } else {
        setMaleCount(studentData.filter((s) => s.gender === 'MALE').length);
      }

      if (res.meta?.femaleCount !== undefined) {
        setFemaleCount(Number(res.meta.femaleCount));
      } else {
        setFemaleCount(studentData.filter((s) => s.gender === 'FEMALE').length);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load enrolled students');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, classFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchStudents]);

  // Keep classFilter in URL query param
  const handleClassFilterChange = (newClassId: string) => {
    setClassFilter(newClassId);
    setCurrentPage(1);
    if (newClassId) {
      setSearchParams({ classId: newClassId });
    } else {
      setSearchParams({});
    }
  };

  // Filter in-memory for gender filter
  const displayedStudents = useMemo(() => {
    if (genderFilter === 'ALL') return students;
    return students.filter((s) => s.gender === genderFilter);
  }, [students, genderFilter]);

  return (
    <div className="space-y-6">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-50 p-1.5 text-blue-600">
              <Users className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Student Enrolments
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Official student roll, registration status, stream allocations, and PREM tracking for{' '}
            <span className="font-semibold text-slate-900">{selectedSchool?.name || 'School'}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchStudents}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>

          {hasPermission(Permissions.CREATE_STUDENTS) && (
            <>
              <button
                type="button"
                id="btn-bulk-import"
                onClick={() => setIsBulkImportOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 shadow-xs hover:bg-blue-100 transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                <span>Bulk Import</span>
              </button>

              <button
                type="button"
                id="btn-add-student"
                onClick={() => setIsAddStudentOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add Student</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500">Total Enrolled</span>
          <div className="mt-1 text-xl font-bold tracking-tight text-slate-900">
            {totalStudents}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500">Active Students</span>
          <div className="mt-1 text-xl font-bold tracking-tight text-emerald-700">
            {activeCount}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500">Male Students</span>
          <div className="mt-1 text-xl font-bold tracking-tight text-blue-700">
            {maleCount}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500">Female Students</span>
          <div className="mt-1 text-xl font-bold tracking-tight text-violet-700">
            {femaleCount}
          </div>
        </div>
      </div>

      {/* 3. Search & Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="search-students-input"
            type="text"
            placeholder="Search by student name, admission no., or PREM..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />

          {/* Class Filter */}
          <select
            id="filter-class"
            aria-label="Filter by class"
            value={classFilter}
            onChange={(e) => handleClassFilterChange(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="">All Classes &amp; Streams</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            id="filter-status"
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="TRANSFERRED">Transferred</option>
            <option value="GRADUATED">Graduated</option>
          </select>

          {/* Gender Filter */}
          <select
            id="filter-gender"
            aria-label="Filter by gender"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Genders</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>
      </div>

      {/* 4. Enrolled Students Data Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs">
        {error && (
          <div className="flex items-center gap-2 bg-rose-50 p-4 text-xs font-medium text-rose-700 border-b border-rose-100">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table id="enrolments-table" className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Admission No.</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Gender</th>
                <th className="py-3 px-4">Class / Stream</th>
                <th className="py-3 px-4">PREM No.</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                      <span>Loading student enrolments...</span>
                    </div>
                  </td>
                </tr>
              ) : displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <GraduationCap className="h-8 w-8 text-slate-300" />
                      <span className="font-semibold text-slate-700">No student enrolments found</span>
                      <p className="text-xs text-slate-400">
                        {searchQuery || classFilter || statusFilter !== 'ALL'
                          ? 'Try adjusting your search criteria or resetting filters.'
                          : 'Enroll new students manually or use the bulk import spreadsheet.'}
                      </p>
                      {hasPermission(Permissions.CREATE_STUDENTS) && (
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsBulkImportOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                            <span>Bulk Import</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAddStudentOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            <span>Add Student</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                displayedStudents.map((student) => {
                  const fullName = [student.firstName, student.middleName, student.lastName]
                    .filter(Boolean)
                    .join(' ');

                  const initials = `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase();

                  const statusStyles = {
                    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    INACTIVE: 'bg-slate-100 text-slate-600 border-slate-200',
                    TRANSFERRED: 'bg-amber-50 text-amber-700 border-amber-200',
                    GRADUATED: 'bg-blue-50 text-blue-700 border-blue-200',
                    WITHDRAWN: 'bg-rose-50 text-rose-700 border-rose-200',
                  }[student.studentStatus] || 'bg-slate-100 text-slate-600 border-slate-200';

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-800 rounded bg-slate-100 px-2 py-0.5 text-[11px] border border-slate-200/80">
                          {student.admissionNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-800">
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900">{fullName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                            student.gender === 'MALE'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : student.gender === 'FEMALE'
                              ? 'bg-violet-50 text-violet-700 border-violet-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {student.gender}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {student.class?.name || (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {student.premNumber || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyles}`}
                        >
                          {student.studentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer">
                          View Roll
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{displayedStudents.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalStudents}</span> students
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>
            <span className="text-xs font-semibold text-slate-700">
              Page {currentPage} of {Math.max(1, totalPages)}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. Bulk Import Modal */}
      <StudentBulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        selectedClassId={classFilter || undefined}
        onSuccess={() => {
          fetchStudents();
        }}
      />

      {/* 7. Add Student Modal */}
      <AddStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        onSuccess={() => {
          setIsAddStudentOpen(false);
          fetchStudents();
        }}
      />
    </div>
  );
};
