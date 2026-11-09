import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createApplication, CreateAdmissionApplicationInput } from '../../api/admissionsApi';
import { api } from '../../api/client'; // For fetching classes/academic years

export const CreateApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string }[]>([]);

  const [formData, setFormData] = useState<CreateAdmissionApplicationInput>({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'MALE',
    previousSchool: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelationship: '',
    guardianEmail: '',
    appliedClassId: '',
    academicYearId: '',
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [classesRes, yearsRes] = await Promise.all([
          api.get<{ data?: any[], classes?: any[] }>('/api/classes'),
          api.get<{ data?: any[], academicYears?: any[] }>('/api/academics/years'),
        ]);
        setClasses(classesRes.data.data || classesRes.data.classes || []);
        setAcademicYears(yearsRes.data.data || yearsRes.data.academicYears || []);
      } catch (err) {
        console.error('Failed to fetch metadata', err);
      }
    };
    fetchMetadata();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createApplication(formData);
      navigate('/admissions');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">New Admission Application</h1>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Student Details</h3>
            <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                <div className="mt-1">
                  <input type="text" name="firstName" id="firstName" required value={formData.firstName} onChange={handleChange} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="middleName" className="block text-sm font-medium text-gray-700">Middle Name</label>
                <div className="mt-1">
                  <input type="text" name="middleName" id="middleName" value={formData.middleName || ''} onChange={handleChange} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                <div className="mt-1">
                  <input type="text" name="lastName" id="lastName" required value={formData.lastName} onChange={handleChange} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <div className="mt-1">
                  <input type="date" name="dateOfBirth" id="dateOfBirth" required value={formData.dateOfBirth || ''} onChange={handleChange} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
                <div className="mt-1">
                  <select id="gender" name="gender" required value={formData.gender} onChange={handleChange} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="previousSchool" className="block text-sm font-medium text-gray-700">Previous School</label>
                <div className="mt-1">
                  <input type="text" name="previousSchool" id="previousSchool" value={formData.previousSchool || ''} onChange={handleChange} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Application Details</h3>
            <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="academicYearId" className="block text-sm font-medium text-gray-700">Academic Year</label>
                <div className="mt-1">
                  <select id="academicYearId" name="academicYearId" required value={formData.academicYearId} onChange={handleChange} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                    <option value="">Select Year</option>
                    {academicYears.map(year => (
                      <option key={year.id} value={year.id}>{year.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="appliedClassId" className="block text-sm font-medium text-gray-700">Class to apply</label>
                <div className="mt-1">
                  <select id="appliedClassId" name="appliedClassId" required value={formData.appliedClassId || ''} onChange={handleChange} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Guardian Details</h3>
            <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="guardianName" className="block text-sm font-medium text-gray-700">Guardian Name</label>
                <div className="mt-1">
                  <input type="text" name="guardianName" id="guardianName" required value={formData.guardianName} onChange={handleChange} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                </div>
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="guardianRelationship" className="block text-sm font-medium text-gray-700">Relationship</label>
                <div className="mt-1">
                  <input type="text" name="guardianRelationship" id="guardianRelationship" required value={formData.guardianRelationship} onChange={handleChange} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                </div>
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="guardianPhone" className="block text-sm font-medium text-gray-700">Guardian Phone</label>
                <div className="mt-1">
                  <input type="text" name="guardianPhone" id="guardianPhone" required value={formData.guardianPhone} onChange={handleChange} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                </div>
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="guardianEmail" className="block text-sm font-medium text-gray-700">Guardian Email</label>
                <div className="mt-1">
                  <input type="email" name="guardianEmail" id="guardianEmail" value={formData.guardianEmail || ''} onChange={handleChange} className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-5">
            <div className="flex justify-end">
              <button type="button" onClick={() => navigate('/admissions')} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                {loading ? 'Saving...' : 'Create Application'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
