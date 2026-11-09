import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApplications } from '../../api/admissionsApi';
import { AdmissionApplication } from '../../api/admissionsApi';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';

export const AdmissionsListPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const data = await getApplications();
      // Assuming paginated response with applications property
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Failed to fetch applications', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading applications...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Admissions</h1>
        {hasPermission(Permissions.MANAGE_ADMISSIONS) && (
          <button id="new-admission-app-btn" onClick={() => navigate('/admissions/new')} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
            New Application
          </button>
        )}
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {applications.length === 0 ? (
            <li className="p-4 text-gray-500 text-center">No applications found.</li>
          ) : (
            applications.map((app) => (
              <li key={app.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      {app.firstName} {app.lastName}
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {app.status}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        Class: {app.appliedClass?.name || 'N/A'}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        Year: {app.academicYear?.name || 'N/A'}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>
                        Submitted on{' '}
                        <time dateTime={app.submissionDate || app.createdAt}>
                          {new Date(app.submissionDate || app.createdAt).toLocaleDateString()}
                        </time>
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};
