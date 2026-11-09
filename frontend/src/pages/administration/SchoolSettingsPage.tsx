import React, { useEffect, useState } from 'react';
import { Building, RefreshCw } from 'lucide-react';
import { administrationApi, SchoolSettings } from '../../api/administration';
import { ApiRequestError, ApiValidationIssue } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

export const SchoolSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<ApiValidationIssue[]>([]);

  // Form state
  const [formData, setFormData] = useState<Partial<SchoolSettings>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await administrationApi.getSchoolSettings();
      setFormData({
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
        address: data.address || '',
        website: data.website || '',
        motto: data.motto || '',
        principalName: data.principalName || '',
        registrationNum: data.registrationNum || '',
        establishedYear: data.establishedYear || undefined,
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value ? Number(value) : undefined) : value,
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      setValidationIssues([]);
      await administrationApi.updateSchoolSettings(formData);
      setSuccess('Settings updated successfully');
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      setValidationIssues(err instanceof ApiRequestError ? err.validationIssues : []);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  const isAdmin = user?.role === 'SCHOOL_ADMIN' || user?.role === 'HEADMASTER';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Building className="w-6 h-6 text-brand-500" />
          School Settings
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100">
          {error}
          {validationIssues.length > 0 && <ul className="mt-2 list-inside list-disc">{validationIssues.map((issue, index) => <li key={`${issue.field}-${index}`}><strong>{issue.field || 'input'}:</strong> {issue.message}</li>)}</ul>}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg border border-green-100">
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-medium text-slate-800">General Information</h2>
          <p className="text-sm text-slate-500">Manage your school's identity and contact details.</p>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Principal's Name
              </label>
              <input
                type="text"
                name="principalName"
                value={formData.principalName || ''}
                onChange={handleChange}
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                School Motto
              </label>
              <input
                type="text"
                name="motto"
                value={formData.motto || ''}
                onChange={handleChange}
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail || ''}
                onChange={handleChange}
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                name="contactPhone"
                value={formData.contactPhone || ''}
                onChange={handleChange}
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website || ''}
                onChange={handleChange}
                disabled={!isAdmin}
                placeholder="https://"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Registration Number
              </label>
              <input
                type="text"
                name="registrationNum"
                value={formData.registrationNum || ''}
                onChange={handleChange}
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Established Year
              </label>
              <input
                type="number"
                name="establishedYear"
                value={formData.establishedYear || ''}
                onChange={handleChange}
                disabled={!isAdmin}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                disabled={!isAdmin}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>
          </div>

          {isAdmin && (
            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                Save Settings
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
