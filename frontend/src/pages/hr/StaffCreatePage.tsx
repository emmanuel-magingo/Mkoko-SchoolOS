import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  User,
  Plus,
  Trash2,
  Mail,
  KeyRound,
  Copy,
} from 'lucide-react';
import { staffApi, EmploymentType } from '../../api/hrApi';
import { PageHeader } from '../../components/common/PageHeader';
import { AcademicsApi } from '../../api/academics.api';
import { AcademicYear, Subject } from '../../types/academics.types';
import { UserRole } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import { TemporaryCredentialModal } from '../../components/hr/TemporaryCredentialModal';

export const StaffCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canManageUsers = hasPermission(Permissions.MANAGE_USERS) || hasPermission(Permissions.MANAGE_STAFF_ACCOUNTS);
  const canManageAcademics = hasPermission(Permissions.MANAGE_ACADEMICS);

  const availableRoles = useMemo<UserRole[]>(() => {
    return [
      'TEACHER',
      'SENIOR_ACADEMIC_MASTER',
      'SECOND_MASTER',
      'HEADMASTER',
      'BURSAR',
      'SECRETARY',
      'SCHOOL_MANAGER',
      'STAFF',
      ...(canManageUsers ? ['SCHOOL_ADMIN' as UserRole] : []),
    ];
  }, [canManageUsers]);

  const [category, setCategory] = useState<'TEACHER' | 'STAFF'>('TEACHER');
  const [role, setRole] = useState<UserRole>('TEACHER');
  const [provisionAccount, setProvisionAccount] = useState(true);

  // Academics data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string; level: string; stream: string }>>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [teachingAssignments, setTeachingAssignments] = useState<
    Array<{ subjectId: string; classId: string; academicYearId: string }>
  >([]);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);

  const [createdStaff, setCreatedStaff] = useState<{
    id: string;
    employeeNumber?: string;
    email?: string | null;
    deliveryNotice?: string;
    temporaryPassword?: string;
  } | null>(null);

  const [credentialModalData, setCredentialModalData] = useState<{
    staffName: string;
    staffEmail?: string;
    employeeNumber: string;
    temporaryPassword: string;
    staffProfileId: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationalId: '',
    gender: 'MALE',
    dateOfBirth: '',
    jobTitle: '',
    employmentType: 'FULL_TIME' as EmploymentType,
    hireDate: new Date().toISOString().split('T')[0],
    emergencyName: '',
    emergencyRelationship: '',
    emergencyPhone: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  // 4 clear steps: Official Designation and Responsibilities have been removed
  const steps = [
    'Personal & Employment',
    'Account & Role',
    'Academic Assignments',
    'Review & Register',
  ];

  useEffect(() => {
    if (provisionAccount && !availableRoles.includes(role)) {
      setRole(availableRoles[0] || 'STAFF');
    }
  }, [availableRoles, provisionAccount, role]);

  useEffect(() => {
    if (!canManageAcademics) return;

    let active = true;
    setSubjectsLoading(true);
    setSubjectsError(null);
    Promise.all([
      AcademicsApi.getSubjects(),
      AcademicsApi.getClasses(),
      AcademicsApi.getAcademicYears(),
    ])
      .then(([subjectResult, classResult, yearResult]) => {
        if (!active) return;
        setSubjects(subjectResult.data.filter((subject) => subject.status !== 'INACTIVE'));
        setClasses(classResult.data.filter((item: any) => item.isActive !== false));
        setAcademicYears(yearResult.data);
      })
      .catch((cause) => {
        if (active)
          setSubjectsError(
            cause?.response?.data?.error?.message ||
              'Unable to load school subjects, classes, and academic years.'
          );
      })
      .finally(() => {
        if (active) setSubjectsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [canManageAcademics]);

  const activeAcademicYear = academicYears.find((y) => y.isActive) || academicYears[0];

  const isLeadershipRole = ['HEADMASTER', 'SECOND_MASTER', 'SENIOR_ACADEMIC_MASTER'].includes(role);

  const filteredSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return subjects;
    const q = subjectSearch.toLowerCase().trim();
    return subjects.filter(
      (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
    );
  }, [subjects, subjectSearch]);

  const addAssignmentRow = () => {
    setTeachingAssignments((prev) => [
      ...prev,
      {
        subjectId: selectedSubjectIds[0] || subjects[0]?.id || '',
        classId: classes[0]?.id || '',
        academicYearId: activeAcademicYear?.id || '',
      },
    ]);
  };

  const removeAssignmentRow = (index: number) => {
    setTeachingAssignments((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAssignmentRow = (
    index: number,
    field: 'subjectId' | 'classId' | 'academicYearId',
    value: string
  ) => {
    setTeachingAssignments((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const validateStep = (currentStep: number): boolean => {
    setError(null);
    if (currentStep === 1) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setError('First Name and Last Name are required.');
        return false;
      }
      if (!formData.hireDate) {
        setError('Hire Date is required.');
        return false;
      }
    }

    if (currentStep === 2) {
      if (provisionAccount) {
        if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
          setError('A valid email address is required to provision the SchoolOS login account.');
          return false;
        }
      }
    }

    if (currentStep === 3) {
      // Check for duplicate assignments
      const keys = new Set<string>();
      for (const row of teachingAssignments) {
        if (!row.subjectId || !row.classId) {
          setError('Select both a subject and a class for each academic assignment row.');
          return false;
        }
        const key = `${row.subjectId}:${row.classId}:${row.academicYearId || ''}`;
        if (keys.has(key)) {
          setError('Duplicate academic assignment detected: a teacher cannot have duplicate periods for the same subject and class.');
          return false;
        }
        keys.add(key);
      }
    }

    return true;
  };

  const continueRegistration = () => {
    if (validateStep(step)) {
      setStep((curr) => Math.min(4, curr + 1));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 4) {
      continueRegistration();
      return;
    }

    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const allTeachingSubjectIds = [
        ...new Set([
          ...selectedSubjectIds,
          ...teachingAssignments.map((a) => a.subjectId).filter(Boolean),
        ]),
      ];

      const res = await staffApi.createStaff({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        category,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        nationalId: formData.nationalId.trim() || undefined,
        gender: formData.gender as any,
        dateOfBirth: formData.dateOfBirth || undefined,
        employmentType: formData.employmentType,
        hireDate: formData.hireDate,
        emergencyContact: formData.emergencyName
          ? {
              name: formData.emergencyName,
              relationship: formData.emergencyRelationship,
              phone: formData.emergencyPhone,
            }
          : undefined,
        provisionAccount,
        role: provisionAccount ? role : undefined,
        subjectIds: allTeachingSubjectIds.length > 0 ? allTeachingSubjectIds : undefined,
        teachingAssignments: teachingAssignments.length > 0 ? teachingAssignments : undefined,
      });

      if (res.data.temporaryPassword) {
        setCredentialModalData({
          staffName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          staffEmail: formData.email.trim() || undefined,
          employeeNumber: res.data.employeeNumber,
          temporaryPassword: res.data.temporaryPassword,
          staffProfileId: res.data.id,
        });
      }

      setCreatedStaff({
        id: res.data.id,
        employeeNumber: res.data.employeeNumber,
        email: res.data.email,
        deliveryNotice: res.data.deliveryNotice,
        temporaryPassword: res.data.temporaryPassword,
      });
    } catch (err: any) {
      const respData = err?.response?.data;
      const correlationId = respData?.error?.correlationId || err?.response?.headers?.['x-correlation-id'];

      let msg = respData?.error?.message || err?.message || 'Failed to complete staff registration.';

      if (respData?.error?.details && Array.isArray(respData.error.details) && respData.error.details.length > 0) {
        const detailMsgs = respData.error.details
          .map((d: any) => `${d.field ? `${d.field}: ` : ''}${d.message}`)
          .join(', ');
        msg = `${msg}: ${detailMsgs}`;
      } else if (typeof respData?.error?.details === 'string') {
        msg = `${msg} (${respData.error.details})`;
      }

      if (correlationId) {
        msg = `${msg} (Ref ID: ${correlationId})`;
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6">
      {credentialModalData && (
        <TemporaryCredentialModal
          isOpen={Boolean(credentialModalData)}
          onClose={() => {
            const profileId = credentialModalData.staffProfileId;
            setCredentialModalData(null);
            navigate(`/staff/${profileId}`);
          }}
          staffName={credentialModalData.staffName}
          staffEmail={credentialModalData.staffEmail}
          employeeNumber={credentialModalData.employeeNumber}
          temporaryPassword={credentialModalData.temporaryPassword}
        />
      )}

      <button
        onClick={() => navigate('/people')}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Staff Management
      </button>

      <PageHeader
        title="Register Staff Member"
        description="Register employee records, provision single-use temporary credentials, and set up teaching workloads."
      />

      {createdStaff && (
        <section
          className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-xs"
          aria-labelledby="staff-created-title"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600 text-white">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 id="staff-created-title" className="text-lg font-bold text-emerald-950">
                Staff Registration Successful
              </h2>
              <p className="text-xs text-emerald-800">
                Employee profile has been assigned unique number{' '}
                <strong className="font-mono">{createdStaff.employeeNumber}</strong>.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-white p-4 text-xs text-slate-700 space-y-3">
            <p>
              {createdStaff.email ? (
                <span>
                  Account created for <strong>{createdStaff.email}</strong>.
                </span>
              ) : (
                <span>
                  The staff profile was created without a login account. An authorized administrator can provision or link an account later.
                </span>
              )}
            </p>

            {createdStaff.temporaryPassword && (
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-900 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    Temporary Password / Single-Use Credential:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (createdStaff.temporaryPassword) {
                        navigator.clipboard.writeText(createdStaff.temporaryPassword);
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:text-brand-800"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <div className="font-mono font-bold text-sm text-slate-900 bg-white p-2 rounded-lg border border-amber-200/80 select-all">
                  {createdStaff.temporaryPassword}
                </div>
                <p className="text-[11px] text-amber-800">
                  Please securely share this temporary credential with the staff member. They must set their permanent password on first login.
                </p>
              </div>
            )}

            {createdStaff.deliveryNotice && (
              <p className="text-xs text-slate-600 font-medium">
                {createdStaff.deliveryNotice}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(`/staff/${createdStaff.id}`)}
              className="rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800 transition-all shadow-xs"
            >
              View Staff Profile
            </button>
            <button
              type="button"
              onClick={() => {
                setCreatedStaff(null);
                setStep(1);
                setFormData({
                  firstName: '',
                  lastName: '',
                  email: '',
                  phone: '',
                  nationalId: '',
                  gender: 'MALE',
                  dateOfBirth: '',
                  jobTitle: '',
                  employmentType: 'FULL_TIME',
                  hireDate: new Date().toISOString().split('T')[0],
                  emergencyName: '',
                  emergencyRelationship: '',
                  emergencyPhone: '',
                });
                setSelectedSubjectIds([]);
                setTeachingAssignments([]);
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
            >
              Register Another Staff
            </button>
          </div>
        </section>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!createdStaff && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step Indicator */}
          <nav aria-label="Staff registration wizard" className="flex gap-2 overflow-x-auto pb-1">
            {steps.map((label, index) => (
              <button
                key={label}
                type="button"
                aria-current={step === index + 1 ? 'step' : undefined}
                onClick={() => {
                  if (index + 1 < step || validateStep(step)) {
                    setStep(index + 1);
                  }
                }}
                className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                  step === index + 1
                    ? 'bg-brand-600 text-white shadow-xs'
                    : index + 1 < step
                    ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {index + 1}. {label}
              </button>
            ))}
          </nav>

          {/* STEP 1: Personal & Employment */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-brand-600" />
                Personal & Employment Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="e.g. Asha"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="e.g. Mushi"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee Number
                  </label>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value="Auto-generated by system (e.g. MWL-STAFF-0001)"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 font-mono italic cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Automatically assigned sequentially upon registration with school code prefix.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Staff Category <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        category === 'TEACHER'
                          ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="staffCategory"
                        value="TEACHER"
                        checked={category === 'TEACHER'}
                        onChange={() => {
                          setCategory('TEACHER');
                          if (role === 'STAFF') setRole('TEACHER');
                        }}
                        className="sr-only"
                      />
                      <span>Teaching Staff</span>
                    </label>
                    <label
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        category === 'STAFF'
                          ? 'border-brand-600 bg-brand-50 text-brand-700 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="staffCategory"
                        value="STAFF"
                        checked={category === 'STAFF'}
                        onChange={() => {
                          setCategory('STAFF');
                          if (role === 'TEACHER') setRole('STAFF');
                        }}
                        className="sr-only"
                      />
                      <span>Support / Operations</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Defines whether this staff member belongs to the teaching staff or support/operations staff.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employment Type
                  </label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as EmploymentType })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="TEMPORARY">Temporary</option>
                    <option value="VOLUNTEER">Volunteer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hire Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+255 7XX XXX XXX"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    National ID (NIDA)
                  </label>
                  <input
                    type="text"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    placeholder="e.g. 19900101-XXXXX-XXXXX-XX"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Account & Role */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-600" />
                Login Account Provisioning
              </h3>

              <div className="space-y-4">
                <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={provisionAccount}
                    onChange={(e) => setProvisionAccount(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 text-xs sm:text-sm block">
                      Provision a SchoolOS login account for this staff member
                    </span>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      When enabled, an activation invitation with a secure single-use OTP will be sent to the staff email. Password setup is required on first login.
                    </span>
                  </div>
                </label>

                {provisionAccount && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Staff Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="staff.name@school.test"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        System Access Role <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                      >
                        {availableRoles.map((r) => (
                          <option key={r} value={r}>
                            {r.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50 text-xs text-sky-900 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>
                        Security Protocol: No plaintext passwords will ever be displayed or stored. The staff member will receive a secure OTP and will be redirected to complete password setup before gaining system access.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Academic Assignments */}
          {step === 3 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-600" />
                  Academic Workload & Teaching Qualifications
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Configure qualified subjects and class/stream assignments.
                </p>
              </div>

              {isLeadershipRole && (
                <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/70 text-xs text-indigo-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    <strong>Leadership Role Note:</strong> Headmasters, Second Masters, and Academic Masters are not forced to select subjects by default. Teaching assignments can be added now or later in the staff profile if they teach.
                  </span>
                </div>
              )}

              {category === 'STAFF' && !isLeadershipRole && (
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>
                    <strong>Support / Non-Teaching Staff:</strong> Academic workloads are optional. If this employee does not teach, you can proceed directly to the next step without selecting subjects.
                  </span>
                </div>
              )}

              {/* Subject Qualifications Selection */}
              <div className="space-y-3">
                {subjectsError && (
                  <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                    {subjectsError}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    1. Select Qualified Teaching Subjects
                  </h4>
                  <input
                    type="text"
                    value={subjectSearch}
                    onChange={(e) => setSubjectSearch(e.target.value)}
                    placeholder="Filter subjects..."
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs sm:w-48"
                  />
                </div>

                {subjectsLoading ? (
                  <p className="text-xs text-slate-500">Loading curriculum subjects…</p>
                ) : filteredSubjects.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No matching curriculum subjects found.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-xl">
                    {filteredSubjects.map((s) => (
                      <label
                        key={s.id}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          selectedSubjectIds.includes(s.id)
                            ? 'bg-brand-50 border-brand-200 text-brand-900 font-semibold'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSubjectIds.includes(s.id)}
                          onChange={(e) =>
                            setSelectedSubjectIds((prev) =>
                              e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id)
                            )
                          }
                          className="rounded border-slate-300 text-brand-600"
                        />
                        <span>
                          {s.code} — {s.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Class & Stream Assignment Rows */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    2. Class & Stream Teaching Assignments
                  </h4>
                  <button
                    type="button"
                    onClick={addAssignmentRow}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Class
                  </button>
                </div>

                {teachingAssignments.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">
                    No specific class/stream assignments added. (Assignments can also be added anytime directly in the staff profile).
                  </p>
                ) : (
                  <div className="space-y-2">
                    {teachingAssignments.map((row, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/50 items-center text-xs"
                      >
                        <div className="sm:col-span-5">
                          <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                            Subject
                          </label>
                          <select
                            value={row.subjectId}
                            onChange={(e) => updateAssignmentRow(index, 'subjectId', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                          >
                            <option value="">Select Subject...</option>
                            {subjects.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.code} — {s.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                            Class / Stream
                          </label>
                          <select
                            value={row.classId}
                            onChange={(e) => updateAssignmentRow(index, 'classId', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                          >
                            <option value="">Select Class...</option>
                            {classes.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} {c.stream ? `(${c.stream})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                            Year
                          </label>
                          <select
                            value={row.academicYearId}
                            onChange={(e) => updateAssignmentRow(index, 'academicYearId', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                          >
                            {academicYears.map((y) => (
                              <option key={y.id} value={y.id}>
                                {y.name} {y.isActive ? '(Active)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => removeAssignmentRow(index)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Review & Register */}
          {step === 4 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <h3 className="font-bold text-slate-900 text-sm">Review Staff Registration Summary</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Staff Identity & Employment
                  </h4>
                  <p>
                    <span className="text-slate-500">Name:</span>{' '}
                    <strong>
                      {formData.firstName} {formData.lastName}
                    </strong>
                  </p>
                  <p>
                    <span className="text-slate-500">Employee Number:</span>{' '}
                    <span className="font-mono text-brand-700 font-semibold">
                      Auto-generated upon creation
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-500">Staff Category:</span>{' '}
                    <strong>{category === 'TEACHER' ? 'Teaching Staff' : 'Support / Operations Staff'}</strong>
                  </p>
                  <p>
                    <span className="text-slate-500">Employment Type:</span>{' '}
                    {formData.employmentType.replace('_', ' ')}
                  </p>
                  <p>
                    <span className="text-slate-500">Hire Date:</span> {formData.hireDate}
                  </p>
                  {formData.phone && (
                    <p>
                      <span className="text-slate-500">Phone:</span> {formData.phone}
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    SchoolOS Account
                  </h4>
                  {provisionAccount ? (
                    <>
                      <p>
                        <span className="text-slate-500">Email:</span> <strong>{formData.email}</strong>
                      </p>
                      <p>
                        <span className="text-slate-500">Assigned Role:</span>{' '}
                        <strong>{role.replace(/_/g, ' ')}</strong>
                      </p>
                      <p className="text-xs text-emerald-700 font-medium">
                        ✓ Single-use activation credential will be dispatched to staff email.
                      </p>
                    </>
                  ) : (
                    <p className="text-slate-500 italic">No login account requested for this profile.</p>
                  )}
                </div>
              </div>

              {canManageAcademics && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider">
                    Academic Configuration
                  </h4>
                  <p>
                    <span className="text-slate-500">Qualified Subjects:</span>{' '}
                    {selectedSubjectIds.length > 0
                      ? subjects
                          .filter((s) => selectedSubjectIds.includes(s.id))
                          .map((s) => s.code)
                          .join(', ')
                      : 'None selected'}
                  </p>
                  <p>
                    <span className="text-slate-500">Class Workloads:</span>{' '}
                    {teachingAssignments.length > 0
                      ? `${teachingAssignments.length} class/stream assignments configured`
                      : 'None configured (can be configured later in staff profile)'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Form Navigation Controls */}
          <div className="flex items-center justify-between pt-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((curr) => curr - 1)}
                className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
              >
                Previous
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={continueRegistration}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
              >
                Continue →
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2"
              >
                {submitting ? 'Registering Staff…' : 'Confirm & Register Staff'}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};
