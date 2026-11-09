import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export const ChangePasswordPage: React.FC = () => {
  const { user, tenant, login, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    if (newPassword !== confirmation) { setError('The new passwords do not match.'); return; }
    setSaving(true);
    try {
      const { data } = await api.post<{ token: string }>('/auth/change-password', { currentPassword, newPassword });
      if (user) login(data.token, { ...user, mustChangePassword: false }, tenant);
      navigate('/', { replace: true });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to change password.'); }
    finally { setSaving(false); }
  };

  return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4"><form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h1 className="text-xl font-bold text-slate-900">Set a new password</h1><p className="text-sm text-slate-600">A temporary password was used to sign in. Choose a unique password to continue.</p>
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <label className="block text-sm font-medium text-slate-700">Current temporary password<input autoComplete="current-password" type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
    <label className="block text-sm font-medium text-slate-700">New password<input autoComplete="new-password" type="password" minLength={12} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /><span className="mt-1 block text-xs text-slate-500">12+ characters with uppercase, lowercase, number, and symbol.</span></label>
    <label className="block text-sm font-medium text-slate-700">Confirm new password<input autoComplete="new-password" type="password" required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
    <div className="flex items-center justify-between"><button type="button" onClick={() => void logout()} className="text-sm text-slate-600 underline">Sign out</button><button type="submit" disabled={saving} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Change password'}</button></div>
  </form></main>;
};
