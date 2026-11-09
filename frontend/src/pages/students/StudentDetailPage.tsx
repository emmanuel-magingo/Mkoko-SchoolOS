import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { Student, SchoolClass, StudentStatus, StudentExamRegistration, ExamType, CandidateType } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  ArrowLeft,
  GraduationCap,
  Phone,
  User,
  ShieldCheck,
  Edit2,
  AlertCircle,
  HeartPulse,
  Award,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';

import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';

export const StudentDetailPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const canAccessFinance = hasPermission(Permissions.VIEW_FINANCE);
  const canManageStudents = hasPermission(Permissions.MANAGE_STUDENTS);

  const [student, setStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(searchParams.get('edit') === 'true');

  // Edit form state
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [classId, setClassId] = useState('');
  const [studentStatus, setStudentStatus] = useState<StudentStatus>('ACTIVE');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [specialNeeds, setSpecialNeeds] = useState('');
  const [premNumber, setPremNumber] = useState('');

  // Examination Registrations state
  const [examRegistrations, setExamRegistrations] = useState<StudentExamRegistration[]>([]);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examType, setExamType] = useState<ExamType>('CSEE');
  const [examYear, setExamYear] = useState<number>(new Date().getFullYear());
  const [candidateType, setCandidateType] = useState<CandidateType>('SCHOOL');
  const [candidateNumber, setCandidateNumber] = useState('');
  const [customCentreNumber, setCustomCentreNumber] = useState('');
  const [generatingCandidateNumber, setGeneratingCandidateNumber] = useState(false);
  const [examError, setExamError] = useState<string | null>(null);
  const [examLoading, setExamLoading] = useState(false);

  const fetchExamRegistrations = async () => {
    if (!id) return;
    try {
      const res = await api.get<StudentExamRegistration[]>(`/students/${id}/exam-registrations`);
      setExamRegistrations(res.data);
    } catch {
      // Ignore if unpermitted or empty
    }
  };

  const fetchStudent = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get<Student>(`/students/${id}`);
      setStudent(res.data);
      // Pre-fill edit fields
      setFirstName(res.data.firstName);
      setMiddleName(res.data.middleName || '');
      setLastName(res.data.lastName);
      setClassId(res.data.classId || '');
      setStudentStatus(res.data.studentStatus);
      setPhone(res.data.phone || '');
      setAddress(res.data.address || '');
      setBloodGroup(res.data.bloodGroup || '');
      setAllergies(res.data.allergies || '');
      setMedicalConditions(res.data.medicalConditions || '');
      setSpecialNeeds(res.data.specialNeeds || '');
      setPremNumber(res.data.premNumber || '');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Student not found in this school');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
    fetchExamRegistrations();
    api.get<SchoolClass[]>('/classes')
      .then((res) => setClasses(res.data))
      .catch(() => {});
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      const res = await api.patch<Student>(`/students/${id}`, {
        firstName: firstName.trim(),
        middleName: middleName.trim() || null,
        lastName: lastName.trim(),
        classId: classId || null,
        studentStatus,
        phone: phone.trim() || null,
        address: address.trim() || null,
        bloodGroup: bloodGroup.trim() || null,
        allergies: allergies.trim() || null,
        medicalConditions: medicalConditions.trim() || null,
        specialNeeds: specialNeeds.trim() || null,
        premNumber: premNumber.trim() ? premNumber.trim().toUpperCase() : null,
      });
      setStudent(res.data);
      setIsEditModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleStatusChange = async (newStatus: StudentStatus) => {
    if (!id || !student) return;
    try {
      const res = await api.patch<Student>(`/students/${id}`, {
        studentStatus: newStatus,
      });
      setStudent(res.data);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleAutoGenerateCandidateNumber = async () => {
    setExamError(null);
    setGeneratingCandidateNumber(true);
    try {
      const params = new URLSearchParams({
        examType,
        examYear: String(examYear),
        candidateType,
      });
      if (candidateType === 'PRIVATE' && customCentreNumber.trim()) {
        params.append('customCentreNumber', customCentreNumber.trim());
      }
      const res = await api.get<{ candidateNumber: string }>(`/students/next-candidate-number?${params.toString()}`);
      setCandidateNumber(res.data.candidateNumber);
    } catch (err) {
      setExamError(err instanceof Error ? err.message : 'Failed to generate next candidate number');
    } finally {
      setGeneratingCandidateNumber(false);
    }
  };

  const handleCreateExamRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setExamError(null);
    setExamLoading(true);
    try {
      await api.post(`/students/${id}/exam-registrations`, {
        examType,
        examYear: Number(examYear),
        candidateType,
        candidateNumber: candidateNumber.trim() ? candidateNumber.trim().toUpperCase() : undefined,
        customCentreNumber: candidateType === 'PRIVATE' && customCentreNumber.trim() ? customCentreNumber.trim() : undefined,
        status: 'REGISTERED',
      });
      setIsExamModalOpen(false);
      setCandidateNumber('');
      setCandidateType('SCHOOL');
      setCustomCentreNumber('');
      fetchExamRegistrations();
    } catch (err) {
      setExamError(err instanceof Error ? err.message : 'Failed to register student for examination');
    } finally {
      setExamLoading(false);
    }
  };

  const handleDeleteExamRegistration = async (registrationId: string) => {
    if (!id || !confirm('Are you sure you want to remove this examination registration?')) return;
    try {
      await api.delete(`/students/${id}/exam-registrations/${registrationId}`);
      fetchExamRegistrations();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove examination registration');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        Loading student profile...
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error || 'Student record not found in this school tenant.'}</span>
        </div>
        <Link
          to="/students"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Registry</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/students"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Students Registry</span>
        </Link>

        <div className="flex items-center gap-2">
          {canAccessFinance && student && (
            <Link
              to={`/finance/students/${student.id}`}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Financial Profile</span>
            </Link>
          )}
          {canManageStudents && (
            <button
              id="student-edit-profile-btn"
              onClick={() => setIsEditModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Student Header Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-md">
              {student.firstName[0]}
              {student.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {student.firstName} {student.middleName ? `${student.middleName} ` : ''}
                  {student.lastName}
                </h2>
                <Badge
                  variant={
                    student.studentStatus === 'ACTIVE'
                      ? 'success'
                      : student.studentStatus === 'GRADUATED'
                      ? 'info'
                      : student.studentStatus === 'TRANSFERRED'
                      ? 'warning'
                      : 'neutral'
                  }
                  size="md"
                  dot
                >
                  {student.studentStatus}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
                <span>
                  School No:{' '}
                  <strong className="text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                    {student.admissionNumber}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  PREM No:{' '}
                  {student.premNumber ? (
                    <strong className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-mono">
                      {student.premNumber}
                    </strong>
                  ) : (
                    <span className="text-slate-400 font-normal">Not Provided</span>
                  )}
                </span>
                <span>•</span>
                <span>Enrolled: {new Date(student.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Quick Status Selector */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200/60 self-start sm:self-auto">
            {(['ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED'] as StudentStatus[]).map((st) => (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  student.studentStatus === st
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic & Identity Info */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-brand-600" />
            <span>Academic & Personal Information</span>
          </h3>

          <dl className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <dt className="text-slate-400 font-medium">Assigned Class</dt>
              <dd className="font-bold text-slate-800 mt-0.5">
                {student.class ? student.class.name : 'Unassigned'}
              </dd>
            </div>

            <div>
              <dt className="text-slate-400 font-medium">Gender</dt>
              <dd className="font-bold text-slate-800 mt-0.5 capitalize">
                {student.gender.toLowerCase()}
              </dd>
            </div>

            <div>
              <dt className="text-slate-400 font-medium">School Number (Permanent)</dt>
              <dd className="font-bold text-slate-800 font-mono mt-0.5">{student.admissionNumber}</dd>
            </div>

            <div>
              <dt className="text-slate-400 font-medium">PREM Number (TAMISEMI)</dt>
              <dd className="font-bold text-slate-800 font-mono mt-0.5">
                {student.premNumber ? (
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {student.premNumber}
                  </span>
                ) : (
                  <span className="text-slate-400 italic font-normal">Pending registration</span>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-slate-400 font-medium">Date of Birth</dt>
              <dd className="font-bold text-slate-800 mt-0.5">
                {student.dateOfBirth
                  ? new Date(student.dateOfBirth).toLocaleDateString()
                  : 'Not provided'}
              </dd>
            </div>

            <div>
              <dt className="text-slate-400 font-medium">Student Contact</dt>
              <dd className="font-bold text-slate-800 mt-0.5">
                {student.phone || 'Not provided'}
              </dd>
            </div>

            <div className="col-span-2">
              <dt className="text-slate-400 font-medium">Residential Address</dt>
              <dd className="font-bold text-slate-800 mt-0.5">
                {student.address || 'Kasulu, Kigoma'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Parent / Guardian Information */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-sky-600" />
            <span>Parent / Guardian Information</span>
          </h3>

          {student.guardians && student.guardians.length > 0 ? (
            <div className="space-y-3">
              {student.guardians.map((g) => (
                <div key={g.id} className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{g.name}</span>
                    <Badge variant="brand" size="sm">
                      {g.relationship}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{g.phone}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-slate-50 border border-slate-200/60 rounded-xl text-center text-xs text-slate-400">
              No parent/guardian recorded for this student yet.
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span>Guardian record belongs to this school tenant and is protected by RLS.</span>
          </div>
        </div>

        {/* Health & Medical Information */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4 md:col-span-2">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-emerald-600" />
            <span>Health & Medical Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-medium block">Blood Group</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block font-mono">
                {student.bloodGroup || 'Not specified'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-medium block">Allergies</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {student.allergies || 'None recorded'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-medium block">Chronic Conditions</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {student.medicalConditions || 'None recorded'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-medium block">Special Educational Needs</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {student.specialNeeds || 'None recorded'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* National Examination Registrations Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">National Examination Registrations</h3>
              <p className="text-xs text-slate-500">
                Official NECTA registrations (FTNA, CSEE, ACSEE) managed separately from school admission.
              </p>
            </div>
          </div>
          {canManageStudents && (
            <button
              onClick={() => {
                setExamError(null);
                setCandidateNumber('');
                setIsExamModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register for Exam</span>
            </button>
          )}
        </div>

        {examRegistrations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-4">Exam Type</th>
                  <th className="py-2.5 px-4">Year</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Candidate Number</th>
                  <th className="py-2.5 px-4">Status</th>
                  {canManageStudents && <th className="py-2.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {examRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <span className="px-2 py-0.5 rounded bg-purple-100/70 text-purple-800 text-[11px] font-mono">
                        {reg.examType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{reg.examYear}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          reg.candidateType === 'PRIVATE'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {reg.candidateType === 'PRIVATE' ? 'Private (P)' : 'School (S)'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{reg.candidateNumber}</td>
                    <td className="py-3 px-4">
                      <Badge variant="success" size="sm">
                        {reg.status}
                      </Badge>
                    </td>
                    {canManageStudents && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteExamRegistration(reg.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Remove registration"
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
        ) : (
          <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
            No examination registration recorded for this student. Use "Register for Exam" when preparing candidates for FTNA, CSEE, or ACSEE.
          </div>
        )}
      </div>

      {/* Edit Student Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Student Record"
        description="Update student details, PREM identifier, and class stream assignment."
        maxWidth="lg"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                School Number (Admission No.)
              </label>
              <input
                type="text"
                readOnly
                disabled
                value={student.admissionNumber}
                className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-mono cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-400">Permanent identifier allocated by SchoolOS.</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PREM Number (TAMISEMI)
              </label>
              <input
                type="text"
                placeholder="e.g. 2026-1234-5678"
                value={premNumber}
                onChange={(e) => setPremNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono uppercase"
              />
              <span className="text-[11px] text-slate-500">Government education identifier. Optional.</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Middle Name</label>
              <input
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Class</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- Unassigned --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lifecycle Status</label>
              <select
                value={studentStatus}
                onChange={(e) => setStudentStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="GRADUATED">GRADUATED</option>
                <option value="TRANSFERRED">TRANSFERRED</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- Not Specified --</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Allergies</label>
              <input
                type="text"
                placeholder="Known allergies"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Chronic Conditions</label>
              <textarea
                rows={2}
                value={medicalConditions}
                onChange={(e) => setMedicalConditions(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Special Educational Needs</label>
              <textarea
                rows={2}
                value={specialNeeds}
                onChange={(e) => setSpecialNeeds(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-brand-600 rounded-xl shadow-sm hover:brightness-105"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Register for Examination Modal */}
      <Modal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        title="Register for National Examination"
        description="Assign verified candidate number for official NECTA examination registration."
        maxWidth="md"
      >
        {examError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{examError}</span>
          </div>
        )}
        <form onSubmit={handleCreateExamRegistration} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Examination Type *</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value as ExamType)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            >
              <option value="FTNA">FTNA (Form 2 National Assessment)</option>
              <option value="CSEE">CSEE (Form 4 Certificate Examination)</option>
              <option value="ACSEE">ACSEE (Form 6 Advanced Certificate Examination)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Examination Year *</label>
            <input
              type="number"
              required
              min={2000}
              max={2100}
              value={examYear}
              onChange={(e) => setExamYear(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Candidate Type *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCandidateType('SCHOOL')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border text-left flex flex-col transition-all ${
                  candidateType === 'SCHOOL'
                    ? 'border-brand-500 bg-brand-50/50 text-brand-900 ring-1 ring-brand-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>School Candidate (S)</span>
                <span className="text-[10px] font-normal text-slate-500 mt-0.5">
                  Official school candidate under this centre
                </span>
              </button>
              <button
                type="button"
                onClick={() => setCandidateType('PRIVATE')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border text-left flex flex-col transition-all ${
                  candidateType === 'PRIVATE'
                    ? 'border-brand-500 bg-brand-50/50 text-brand-900 ring-1 ring-brand-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Private Candidate (P)</span>
                <span className="text-[10px] font-normal text-slate-500 mt-0.5">
                  Private candidate sitting for exam
                </span>
              </button>
            </div>
          </div>

          {candidateType === 'PRIVATE' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Private Centre Number <span className="font-normal text-slate-400">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="Defaults to this school's centre number if blank"
                value={customCentreNumber}
                onChange={(e) => setCustomCentreNumber(e.target.value)}
                maxLength={4}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Candidate Number <span className="font-normal text-slate-400">(Optional — auto-generated if left blank)</span>
              </label>
              <button
                type="button"
                onClick={handleAutoGenerateCandidateNumber}
                disabled={generatingCandidateNumber}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                <span>{generatingCandidateNumber ? 'Generating...' : 'Auto-Generate'}</span>
              </button>
            </div>
            <input
              type="text"
              placeholder={candidateType === 'SCHOOL' ? 'e.g. S0108-0001 (or leave blank to auto-generate)' : 'e.g. P0108-0001 (or leave blank to auto-generate)'}
              value={candidateNumber}
              onChange={(e) => setCandidateNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono uppercase"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              {candidateType === 'SCHOOL'
                ? 'School candidate numbers use prefix S + official school centre number + index. If left blank, the next sequential number will be generated automatically.'
                : 'Private candidate numbers use prefix P + centre number + index.'}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsExamModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={examLoading}
              className="px-4 py-2 text-xs font-bold text-white bg-purple-600 rounded-xl shadow-sm hover:brightness-105 disabled:opacity-50"
            >
              {examLoading ? 'Saving...' : 'Register Candidate'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
