import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Shield,
  Briefcase,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Lock,
  BookOpen,
  Plus,
  Trash2,
  KeyRound,
} from 'lucide-react';
import { staffApi, StaffProfile, EmploymentStatus } from '../../api/hrApi';
import { AcademicsApi } from '../../api/academics.api';
import { Subject, AcademicYear } from '../../types/academics.types';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import { Badge } from '../../components/common/Badge';
import { PageHeader } from '../../components/common/PageHeader';
import { TemporaryCredentialModal } from '../../components/hr/TemporaryCredentialModal';

export const StaffDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const canManageStatus = hasPermission(Permissions.MANAGE_STAFF_STATUS) || hasPermission(Permissions.MANAGE_STAFF);
  const canManageAcademics = hasPermission(Permissions.MANAGE_ACADEMICS);
  const canViewSensitive = hasPermission(Permissions.VIEW_STAFF_SENSITIVE);
  const canResendInvitation =
    hasPermission(Permissions.MANAGE_STAFF_ACCOUNTS) ||
    hasPermission(Permissions.UPDATE_STAFF) ||
    hasPermission(Permissions.MANAGE_USERS);

  const [staff, setStaff] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status transition state
  const [statusReason, setStatusReason] = useState('');
  const [newStatus, setNewStatus] = useState<EmploymentStatus | ''>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);

  // Resend invitation state
  const [resendingInvite, setResendingInvite] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<{ message: string; isError?: boolean } | null>(null);
  const [credentialModalData, setCredentialModalData] = useState<{
    staffName: string;
    staffEmail?: string;
    employeeNumber: string;
    temporaryPassword: string;
  } | null>(null);

  // Academic Assignments state inside Profile
  const [assignments, setAssignments] = useState<
    Array<{
      id: string;
      subject: { id: string; name: string; code: string; level: string };
      class: { id: string; name: string; level: string; stream: string };
      academicYear: { id: string; name: string; isActive: boolean };
    }>
  >([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [availableClasses, setAvailableClasses] = useState<Array<{ id: string; name: string; level: string; stream: string }>>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedYearId, setSelectedYearId] = useState('');
  const [addingAssignment, setAddingAssignment] = useState(false);
  const [assignmentFeedback, setAssignmentFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  const fetchStaffDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await staffApi.getStaffById(id);
      setStaff(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load staff profile details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchAcademicData = useCallback(async () => {
    if (!id || !canManageAcademics) return;
    try {
      const [assignRes, subjRes, classRes, yearRes] = await Promise.all([
        staffApi.getAcademicAssignments(id).catch(() => ({ data: { assignments: [] } })),
        AcademicsApi.getSubjects().catch(() => ({ data: [] })),
        AcademicsApi.getClasses().catch(() => ({ data: [] })),
        AcademicsApi.getAcademicYears().catch(() => ({ data: [] })),
      ]);

      setAssignments(assignRes.data.assignments || []);
      setAvailableSubjects(subjRes.data.filter((s: Subject) => s.status !== 'INACTIVE'));
      setAvailableClasses(classRes.data.filter((c: any) => c.isActive !== false));
      setAcademicYears(yearRes.data);

      const activeYear = yearRes.data.find((y: AcademicYear) => y.isActive) || yearRes.data[0];
      if (activeYear) {
        setSelectedYearId(activeYear.id);
      }
    } catch {
      // Ignored non-critical academic load failure
    }
  }, [id, canManageAcademics]);

  useEffect(() => {
    void fetchStaffDetail();
    void fetchAcademicData();
  }, [fetchStaffDetail, fetchAcademicData]);

  const handleStatusTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newStatus) return;

    try {
      setUpdatingStatus(true);
      setError(null);
      setStatusSuccess(null);
      const res = await staffApi.updateStaffStatus(id, newStatus as EmploymentStatus, statusReason.trim() || undefined);
      setStaff(res.data);
      setStatusSuccess(`Staff status updated to ${newStatus}`);
      setNewStatus('');
      setStatusReason('');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Status transition rejected');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleResendInvitation = async () => {
    if (!id) return;
    try {
      setResendingInvite(true);
      setInviteFeedback(null);
      const res = await staffApi.resendInvitation(id);
      if (res.data.temporaryPassword) {
        setCredentialModalData({
          staffName: `${staff?.firstName || ''} ${staff?.lastName || ''}`.trim() || res.data.recipient,
          staffEmail: res.data.recipient,
          employeeNumber: staff?.employeeNumber || '—',
          temporaryPassword: res.data.temporaryPassword,
        });
      }
      setInviteFeedback({
        message: `New temporary credential generated for ${res.data.recipient}. Previous credential has been invalidated.`,
      });
    } catch (err: any) {
      setInviteFeedback({
        message: err?.response?.data?.error?.message || 'Failed to generate temporary credential. Please wait 60 seconds between resend attempts.',
        isError: true,
      });
    } finally {
      setResendingInvite(false);
    }
  };

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedSubjectId || !selectedClassId) return;

    // Check client-side duplicate
    const isDuplicate = assignments.some(
      (a) =>
        a.subject.id === selectedSubjectId &&
        a.class.id === selectedClassId &&
        (!selectedYearId || a.academicYear?.id === selectedYearId)
    );
    if (isDuplicate) {
      setAssignmentFeedback({
        message: 'This staff member is already assigned to this subject and class for this academic period.',
        isError: true,
      });
      return;
    }

    try {
      setAddingAssignment(true);
      setAssignmentFeedback(null);
      await staffApi.assignAcademicWorkload(id, {
        subjectId: selectedSubjectId,
        classId: selectedClassId,
        academicYearId: selectedYearId || undefined,
      });
      setAssignmentFeedback({ message: 'Academic class assignment successfully added.' });
      setSelectedSubjectId('');
      setSelectedClassId('');
      await fetchAcademicData();
      await fetchStaffDetail();
    } catch (err: any) {
      setAssignmentFeedback({
        message: err?.response?.data?.error?.message || 'Failed to assign class workload.',
        isError: true,
      });
    } finally {
      setAddingAssignment(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!id || !window.confirm('Are you sure you want to remove this teaching assignment?')) return;
    try {
      setAssignmentFeedback(null);
      await staffApi.removeAcademicWorkload(id, assignmentId);
      setAssignmentFeedback({ message: 'Teaching assignment removed.' });
      await fetchAcademicData();
      await fetchStaffDetail();
    } catch (err: any) {
      setAssignmentFeedback({
        message: err?.response?.data?.error?.message || 'Failed to remove teaching assignment.',
        isError: true,
      });
    }
  };

  const getStatusBadgeVariant = (status: EmploymentStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'ON_LEAVE':
        return 'info';
      case 'SUSPENDED':
        return 'warning';
      case 'TERMINATED':
      case 'INACTIVE':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Loading staff profile...
      </div>
    );
  }

  if (error && !staff) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto p-4 sm:p-6">
        <button
          onClick={() => navigate('/people')}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Staff Management
        </button>
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!staff) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      <button
        onClick={() => navigate('/people')}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Staff Management
      </button>

      <PageHeader
        title={`${staff.firstName} ${staff.lastName}`}
        description={`Employee #${staff.employeeNumber} — ${staff.jobTitle}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {staff.user?.role && <Badge variant="info" size="md">{staff.user.role.replace(/_/g, ' ')}</Badge>}
            <Badge variant={getStatusBadgeVariant(staff.employmentStatus)} size="md" dot>
              {staff.employmentStatus.replace('_', ' ')}
            </Badge>
          </div>
        }
      />

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs sm:text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {statusSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{statusSuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: General Info & In-Profile Academic Assignments */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-600" />
              General Employment Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <p className="text-xs text-slate-400 font-medium">Full Name</p>
                <p className="font-semibold text-slate-800">
                  {staff.firstName} {staff.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Employee Number</p>
                <p className="font-mono font-semibold text-slate-800">{staff.employeeNumber}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Staff Category</p>
                <p className="font-semibold text-slate-800">
                  {staff.user?.role === 'TEACHER' || (staff.jobTitle && /teacher/i.test(staff.jobTitle))
                    ? 'Teaching Staff'
                    : 'Support / Operations Staff'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Department</p>
                <p className="font-semibold text-slate-800">
                  {staff.department?.name || 'Unassigned'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Employment Type</p>
                <p className="font-semibold text-slate-800">
                  {staff.employmentType.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Hire Date</p>
                <p className="font-semibold text-slate-800">
                  {new Date(staff.hireDate).toLocaleDateString()}
                </p>
              </div>
              {staff.terminationDate && (
                <div>
                  <p className="text-xs text-slate-400 font-medium">Termination Date</p>
                  <p className="font-semibold text-rose-600">
                    {new Date(staff.terminationDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </p>
                <p className="font-medium text-slate-800">{staff.email || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> Phone Number
                </p>
                <p className="font-medium text-slate-800">{staff.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Academic Assignments Configured Inside Profile */}
          <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-600" />
                  Academic Responsibilities & Teaching Assignments
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Classes and subjects officially allocated to this staff member.
                </p>
              </div>
            </div>

            {assignmentFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  assignmentFeedback.isError
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                {assignmentFeedback.isError ? (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>{assignmentFeedback.message}</span>
              </div>
            )}

            {/* Qualified Subjects Tag List */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Qualified Teaching Subjects:</p>
              <div className="flex flex-wrap gap-2">
                {(staff.user?.subjectQualifications || []).length > 0 ? (
                  staff.user?.subjectQualifications?.map(({ subject }) => (
                    <span
                      key={subject.id}
                      className="rounded-lg bg-sky-50 border border-sky-200 px-2.5 py-1 text-xs font-semibold text-sky-900"
                    >
                      {subject.code} — {subject.name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">No specific subject qualifications assigned.</span>
                )}
              </div>
            </div>

            {/* Current Teaching Assignments Table */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Assigned Class Workloads ({assignments.length})
              </h4>

              {assignments.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-3 border border-dashed border-slate-200 rounded-xl text-center">
                  No active class/subject assignments configured for this staff member.
                </p>
              ) : (
                <div className="border border-slate-200/80 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold text-slate-600 uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Subject</th>
                        <th className="py-2.5 px-3">Class / Stream</th>
                        <th className="py-2.5 px-3">Academic Year</th>
                        {canManageAcademics && <th className="py-2.5 px-3 text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {assignments.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {item.subject.name}{' '}
                            <span className="text-xs font-normal text-slate-500">({item.subject.code})</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            {item.class.name} {item.class.stream ? `(${item.class.stream})` : ''}
                          </td>
                          <td className="py-2.5 px-3 text-xs text-slate-600">
                            {item.academicYear?.name || 'Active Year'}
                          </td>
                          {canManageAcademics && (
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveAssignment(item.id)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                title="Remove assignment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Add Teaching Assignment Form (for authorized admins) */}
            {canManageAcademics && staff.userId && (
              <form
                onSubmit={handleAddAssignment}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide">
                  <Plus className="w-3.5 h-3.5 text-brand-600" />
                  Assign New Class Workload
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Subject <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
                    >
                      <option value="">Select Subject...</option>
                      {availableSubjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.code} — {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Class / Stream <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
                    >
                      <option value="">Select Class...</option>
                      {availableClasses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.stream ? `(${c.stream})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Academic Year
                    </label>
                    <select
                      value={selectedYearId}
                      onChange={(e) => setSelectedYearId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
                    >
                      {academicYears.map((y) => (
                        <option key={y.id} value={y.id}>
                          {y.name} {y.isActive ? '(Active)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={addingAssignment || !selectedSubjectId || !selectedClassId}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {addingAssignment ? 'Assigning…' : 'Add Assignment'}
                  </button>
                </div>
              </form>
            )}

            {!staff.userId && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-xl">
                A linked user account is required to assign academic class workloads. Link or provision an account for this staff profile first.
              </p>
            )}
          </section>

          {/* Sensitive HR Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-600" />
                Sensitive HR & Identity Records
              </h3>
              {!canViewSensitive && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Protected Field
                </span>
              )}
            </div>

            {canViewSensitive ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">National Identification (NIDA)</p>
                    <p className="font-mono font-semibold text-slate-800">
                      {staff.nationalId || 'Not registered'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Date of Birth</p>
                    <p className="font-medium text-slate-800">
                      {staff.dateOfBirth ? new Date(staff.dateOfBirth).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400 font-medium mb-2">Emergency Contact</p>
                  {staff.emergencyContact ? (
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-xs sm:text-sm space-y-1">
                      <p className="font-semibold text-slate-800">
                        {staff.emergencyContact.name}{' '}
                        <span className="text-xs font-normal text-slate-500">
                          ({staff.emergencyContact.relationship})
                        </span>
                      </p>
                      <p className="text-slate-600">Phone: {staff.emergencyContact.phone}</p>
                      {staff.emergencyContact.email && (
                        <p className="text-slate-600">Email: {staff.emergencyContact.email}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No emergency contact recorded.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center">
                <Lock className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-600">Restricted Field Projection</p>
                <p className="text-[11px] text-slate-400">
                  National ID and Emergency Contact details are protected. Caller requires VIEW_STAFF_SENSITIVE clearance.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Account & Employment Lifecycle */}
        <div className="space-y-6">
          {/* Linked System User Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              SchoolOS Login Account
            </h3>

            {staff.user ? (
              <div className="bg-indigo-50/60 border border-indigo-100 p-4 rounded-xl text-xs space-y-2">
                <div>
                  <span className="text-slate-500 block text-[11px]">Email:</span>
                  <span className="font-bold text-indigo-900 text-sm">{staff.user.email}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Role:</span>
                  <span className="text-indigo-800 font-semibold">{staff.user.role.replace(/_/g, ' ')}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[11px]">Account Status:</span>
                  <div className="mt-0.5">
                    {!staff.user.isActive ? (
                      <span className="font-semibold text-rose-700">Inactive / Suspended</span>
                    ) : (staff.user as any).mustChangePassword ? (
                      <span className="font-semibold text-amber-700">Pending First Login (Setup Required)</span>
                    ) : (
                      <span className="font-semibold text-emerald-700">Active (Password Configured)</span>
                    )}
                  </div>
                </div>

                {/* Reset / Generate Temporary Credential Button */}
                {staff.user.isActive && (staff.user as any).mustChangePassword && canResendInvitation && (
                  <div className="pt-2 border-t border-indigo-100">
                    <button
                      type="button"
                      onClick={handleResendInvitation}
                      disabled={resendingInvite}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      {resendingInvite ? 'Generating Credential…' : 'Generate New Temporary Credential'}
                    </button>
                    <p className="text-[11px] text-slate-400 mt-1 text-center">
                      Invalidates previous temporary credential. Respects 60-second cooldown.
                    </p>
                  </div>
                )}

                {inviteFeedback && (
                  <p
                    className={`text-[11px] p-2 rounded-lg ${
                      inviteFeedback.isError
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {inviteFeedback.message}
                  </p>
                )}

                {credentialModalData && (
                  <TemporaryCredentialModal
                    isOpen={Boolean(credentialModalData)}
                    onClose={() => setCredentialModalData(null)}
                    staffName={credentialModalData.staffName}
                    staffEmail={credentialModalData.staffEmail}
                    employeeNumber={credentialModalData.employeeNumber}
                    temporaryPassword={credentialModalData.temporaryPassword}
                    isReset={true}
                  />
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <p>No SchoolOS login account is currently linked to this staff profile.</p>
                <p className="text-[11px] text-slate-400">
                  Accounts can be linked or created by administrators from the Staff Directory.
                </p>
              </div>
            )}
          </div>

          {/* Lifecycle Status Management */}
          {canManageStatus && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-600" />
                Employment Lifecycle
              </h3>

              {staff.employmentStatus === 'TERMINATED' ? (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs">
                  <p className="font-bold">Terminated Record</p>
                  <p className="mt-1">
                    This staff profile is permanently terminated. In accordance with governance policy, terminated profiles cannot be reinstated.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleStatusTransition} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Transition Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as EmploymentStatus)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                    >
                      <option value="">Select Target Status...</option>
                      {staff.employmentStatus !== 'ACTIVE' && (
                        <option value="ACTIVE">ACTIVE (Resume/Reinstate)</option>
                      )}
                      {staff.employmentStatus === 'ACTIVE' && (
                        <>
                          <option value="ON_LEAVE">ON LEAVE</option>
                          <option value="SUSPENDED">SUSPENDED</option>
                          <option value="INACTIVE">INACTIVE</option>
                          <option value="TERMINATED">TERMINATED (Terminal)</option>
                        </>
                      )}
                      {staff.employmentStatus === 'ON_LEAVE' && (
                        <option value="ACTIVE">ACTIVE</option>
                      )}
                      {staff.employmentStatus === 'SUSPENDED' && (
                        <>
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="TERMINATED">TERMINATED (Terminal)</option>
                        </>
                      )}
                      {staff.employmentStatus === 'INACTIVE' && (
                        <option value="ACTIVE">ACTIVE</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reason / Notes (Optional)
                    </label>
                    <textarea
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      placeholder="e.g. Approved leave, contract renewal..."
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!newStatus || updatingStatus}
                    className="w-full py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                  >
                    {updatingStatus ? 'Updating Status...' : 'Apply Status Transition'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
