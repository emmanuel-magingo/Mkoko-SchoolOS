import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { api } from '../../api/client';
import { SchoolClass, Student } from '../../types';
import { UserPlus, AlertCircle, HeartPulse, UserCheck, Shield } from 'lucide-react';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newStudent: Student) => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [previewAdmissionNumber, setPreviewAdmissionNumber] = useState('');
  const [premNumber, setPremNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [classId, setClassId] = useState('');
  const [address, setAddress] = useState('');

  // Guardian State
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('Father');

  // Health & Medical State
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [specialNeeds, setSpecialNeeds] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.get<SchoolClass[]>('/classes')
        .then((res) => {
          setClasses(res.data);
          if (res.data.length > 0 && !classId) {
            setClassId(res.data[0].id);
          }
        })
        .catch(() => {});

      api.get<{ admissionNumber: string }>('/students/next-admission-number')
        .then((res) => {
          setPreviewAdmissionNumber(res.data.admissionNumber);
        })
        .catch(() => {
          setPreviewAdmissionNumber('');
        });
    }
  }, [isOpen]);

  const resetForm = () => {
    setPremNumber('');
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setDateOfBirth('');
    setAddress('');
    setGuardianName('');
    setGuardianPhone('');
    setGuardianRelationship('Father');
    setBloodGroup('');
    setAllergies('');
    setMedicalConditions('');
    setSpecialNeeds('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        firstName: firstName.trim(),
        middleName: middleName.trim() || null,
        lastName: lastName.trim(),
        gender,
        dateOfBirth: dateOfBirth ? dateOfBirth : null,
        classId: classId || null,
        address: address.trim() || null,
        premNumber: premNumber.trim() ? premNumber.trim().toUpperCase() : null,
        bloodGroup: bloodGroup.trim() || null,
        allergies: allergies.trim() || null,
        medicalConditions: medicalConditions.trim() || null,
        specialNeeds: specialNeeds.trim() || null,
        guardian: guardianName.trim()
          ? {
              name: guardianName.trim(),
              phone: guardianPhone.trim(),
              relationship: guardianRelationship,
            }
          : null,
      };

      const res = await api.post<Student>('/students', payload);
      onSuccess(res.data);
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enroll New Student"
      description="Add a student record into the school registry with academic and medical baseline."
      maxWidth="lg"
    >
      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {/* Identifiers: Server-Allocated School Number & PREM Number */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  School Number (Admission No.)
                </label>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  Preview
                </span>
              </div>
              <input
                type="text"
                readOnly
                value={previewAdmissionNumber || 'Allocating on save...'}
                className="w-full px-3 py-2 text-xs bg-slate-100/90 border border-slate-200 rounded-lg text-slate-700 font-mono font-semibold cursor-not-allowed select-all"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Generated automatically by the server during registration.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  PREM Number
                </label>
                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  Optional
                </span>
              </div>
              <input
                type="text"
                placeholder="e.g. 2026-1234-5678"
                value={premNumber}
                onChange={(e) => setPremNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono uppercase"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Government/TAMISEMI identifier. Can be added or updated later.
              </p>
            </div>
          </div>
        </div>

        {/* Core Identity */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
            <UserCheck className="w-4 h-4 text-brand-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Student Identity & Enrollment
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Juma"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ally"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Middle Name
              </label>
              <input
                type="text"
                placeholder="Optional"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Class
              </label>
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Residential Address
            </label>
            <input
              type="text"
              placeholder="e.g. Kasulu Mjini, Mwilamvya Street"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Health & Medical Details Section */}
        <div className="p-3 bg-emerald-50/50 border border-emerald-200/60 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-emerald-600" />
            <p className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
              Health & Medical Baseline
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Blood Group
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Allergies
              </label>
              <input
                type="text"
                placeholder="e.g. Penicillin, Peanuts, Dust, Sulfa drugs"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Chronic Medical Conditions / Notes
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Asthma (inhaler carried), Epilepsy, Sickle Cell trait..."
                value={medicalConditions}
                onChange={(e) => setMedicalConditions(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Special Educational Needs (SEN)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Front row seating for mild visual impairment, auditory accommodations..."
                value={specialNeeds}
                onChange={(e) => setSpecialNeeds(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Parent / Guardian Section */}
        <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-600" />
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Parent / Guardian Information (Emergency Contact)
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Guardian Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Salum Bakari"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Guardian Emergency Phone *
              </label>
              <input
                type="tel"
                placeholder="+255 7XX XXX XXX"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Relationship
              </label>
              <select
                value={guardianRelationship}
                onChange={(e) => setGuardianRelationship(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
                <option value="Sibling">Sibling</option>
                <option value="Uncle">Uncle</option>
                <option value="Aunt">Aunt</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-white bg-brand-600 rounded-xl shadow-sm hover:brightness-105 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{loading ? 'Registering...' : 'Save Student'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
