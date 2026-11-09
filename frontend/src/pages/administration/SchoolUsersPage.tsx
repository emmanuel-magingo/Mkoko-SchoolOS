import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import { UserRole } from '../../types';

type SchoolRole = Exclude<UserRole, 'PLATFORM_ADMIN'>;
interface SchoolUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: SchoolRole;
  isActive: boolean;
  mustChangePassword: boolean;
  customRole?: { id: string; name: string; isActive: boolean } | null;
}
interface CustomRole {
  id: string;
  name: string;
  isActive: boolean;
}
interface ProvisionResult {
  user: SchoolUser;
  temporaryPassword: string;
  deliveryNotice: string;
}

const roles: SchoolRole[] = [
  'SCHOOL_ADMIN', 'HEADMASTER', 'SECOND_MASTER', 'SENIOR_ACADEMIC_MASTER',
  'SCHOOL_MANAGER', 'SECRETARY', 'BURSAR', 'TEACHER', 'STAFF',
];

export const SchoolUsersPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canManageUsers = hasPermission(Permissions.MANAGE_USERS);
  const canViewRoles = hasPermission(Permissions.VIEW_ROLES);
  const [users, setUsers] = useState<SchoolUser[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<SchoolRole>('TEACHER');
  const [credential, setCredential] = useState<ProvisionResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [userResult, roleResult] = await Promise.all([
        api.get<{ users: SchoolUser[] }>('/administration/users?page=1&limit=100'),
        canViewRoles
          ? api.get<{ customRoles: CustomRole[] }>('/administration/roles')
          : Promise.resolve({ data: { customRoles: [] as CustomRole[] } }),
      ]);
      setUsers(userResult.data.users);
      setCustomRoles(roleResult.data.customRoles.filter((item) => item.isActive));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load school users.');
    } finally {
      setLoading(false);
    }
  }, [canViewRoles]);

  useEffect(() => { void load(); }, [load]);

  const provision = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post<ProvisionResult>('/administration/users/provision', {
        email: email.trim(), firstName: firstName.trim(), lastName: lastName.trim(), role, linkStaffProfile: false,
      });
      setCredential(data);
      setEmail('');
      setFirstName('');
      setLastName('');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to provision school user.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateUser = async (user: SchoolUser, changes: { isActive?: boolean; customRoleId?: string | null }) => {
    setError('');
    try {
      await api.patch(`/administration/users/${user.id}`, changes);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update school user.');
    }
  };

  const resetPassword = async (user: SchoolUser) => {
    if (!window.confirm(`Generate a temporary password for ${user.email}? Existing sessions will be revoked.`)) return;
    try {
      const response = await api.post<{ temporaryPassword: string; deliveryNotice: string; mustChangePassword: boolean }>(`/administration/users/${user.id}/reset-password`, {});
      setCredential({ user, ...response.data });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
    }
  };

  return <main className="space-y-6 p-4 sm:p-6">
    <header>
      <h1 className="text-2xl font-bold text-slate-900">School Users</h1>
      <p className="mt-1 text-sm text-slate-600">Manage accounts for this school. Temporary passwords are displayed once; no email or SMS delivery is configured.</p>
    </header>
    {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {canManageUsers && <form onSubmit={provision} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-5">
      <h2 className="md:col-span-5 font-semibold">Provision a school user</h2>
      <input aria-label="Email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="rounded-lg border p-2 text-sm md:col-span-2" />
      <input aria-label="First name" required value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="First name" className="rounded-lg border p-2 text-sm" />
      <input aria-label="Last name" required value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Last name" className="rounded-lg border p-2 text-sm" />
      <select aria-label="Role" value={role} onChange={(event) => setRole(event.target.value as SchoolRole)} className="rounded-lg border p-2 text-sm">
        {roles.map((item) => <option key={item} value={item}>{item.replace(/_/g, ' ')}</option>)}
      </select>
      <button disabled={submitting} className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{submitting ? 'Creating…' : 'Create user'}</button>
    </form>}
    <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">User</th><th className="p-3">Built-in role</th><th className="p-3">Additional role</th><th className="p-3">Status</th><th className="p-3">First login</th><th className="p-3">Action</th></tr></thead>
        <tbody>
          {users.map((user) => <tr key={user.id} className="border-t border-slate-100">
            <td className="p-3"><div className="font-medium">{user.firstName} {user.lastName}</div><div className="text-xs text-slate-500">{user.email}</div></td>
            <td className="p-3">{user.role.replace(/_/g, ' ')}</td>
            <td className="p-3">{canViewRoles && canManageUsers ? <select aria-label={`Additional role for ${user.email}`} value={user.customRole?.id ?? ''} onChange={(event) => void updateUser(user, { customRoleId: event.target.value || null })} className="rounded border p-1" disabled={!user.isActive}>
              <option value="">None</option>{customRoles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select> : user.customRole?.name ?? '—'}</td>
            <td className="p-3">{user.isActive ? 'Active' : 'Inactive'}</td>
            <td className="p-3">{user.mustChangePassword ? 'Password change required' : 'Complete'}</td>
            <td className="flex items-center gap-3 p-3">
              {canManageUsers && <>
                <button onClick={() => void updateUser(user, { isActive: !user.isActive })} className="font-semibold text-sky-700">{user.isActive ? 'Deactivate' : 'Reactivate'}</button>
                <button onClick={() => void resetPassword(user)} className="font-semibold text-amber-700">Reset password</button>
              </>}
            </td>
          </tr>)}
          {!loading && users.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-500">No school users found.</td></tr>}
        </tbody>
      </table>
      {loading && <p role="status" className="p-5 text-sm text-slate-500">Loading users…</p>}
    </section>
    {credential && <div role="dialog" aria-modal="true" aria-labelledby="temp-password-title" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
      <section className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-xl">
        <h2 id="temp-password-title" className="text-lg font-bold">Temporary password — shown once</h2>
        <p className="text-sm text-slate-600">{credential.deliveryNotice}</p>
        <code className="block break-all rounded bg-slate-100 p-3 font-mono text-sm">{credential.temporaryPassword}</code>
        <div className="flex justify-end gap-2">
          <button onClick={() => void navigator.clipboard?.writeText(credential.temporaryPassword)} className="rounded border px-3 py-2 text-sm">Copy</button>
          <button onClick={() => setCredential(null)} className="rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Close</button>
        </div>
      </section>
    </div>}
  </main>;
};
