import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';

interface RolePermission { permission: string; baselineGranted: boolean; requiresResourceScope: boolean }
interface RoleEntry { role: string; permissions: RolePermission[] }
interface CustomRole { id: string; name: string; description: string | null; isActive: boolean; permissions: Array<{ permission: string }>; _count: { assignedUsers: number } }
interface RoleData { builtInRoles: RoleEntry[]; customRoles: CustomRole[]; assignablePermissions: string[] }

export const SchoolRolesPage: React.FC = () => {
  const { hasPermission } = usePermissions();
  const canManageRoles = hasPermission(Permissions.MANAGE_ROLES);
  const [data, setData] = useState<RoleData | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await api.get<RoleData>('/administration/roles');
      setData(response.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load school roles.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setSelected(new Set());
  };

  const editRole = (role: CustomRole) => {
    setEditingId(role.id);
    setName(role.name);
    setDescription(role.description ?? '');
    setSelected(new Set(role.permissions.map((entry) => entry.permission)));
  };

  const saveRole = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = { name: name.trim(), description: description.trim() || null, permissions: [...selected] };
    try {
      if (editingId) await api.patch(`/administration/roles/${editingId}`, payload);
      else await api.post('/administration/roles', payload);
      resetForm();
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save role.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (role: CustomRole) => {
    setError('');
    try {
      await api.patch(`/administration/roles/${role.id}`, { isActive: !role.isActive });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update role.');
    }
  };

  return <main className="space-y-6 p-4 sm:p-6">
    <header><h1 className="text-2xl font-bold text-slate-900">School Roles &amp; Permissions</h1><p className="mt-1 text-sm text-slate-600">Built-in roles are fixed. Custom roles add only eligible permissions and cannot grant platform or protected administrative capabilities.</p></header>
    {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    <section className="grid gap-4 xl:grid-cols-2">
      <div className="space-y-3">
        <h2 className="font-semibold text-slate-900">Custom roles</h2>
        {data?.customRoles.map((role) => <article key={role.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div><h3 className="font-semibold">{role.name} {!role.isActive && <span className="text-xs text-slate-500">(inactive)</span>}</h3><p className="text-sm text-slate-600">{role.description || 'No description'}</p><p className="mt-1 text-xs text-slate-500">{role._count.assignedUsers} assigned · {role.permissions.length} additional permissions</p></div>
            {canManageRoles && <div className="flex gap-3 text-sm"><button onClick={() => editRole(role)} className="font-semibold text-sky-700">Edit</button><button onClick={() => void toggleActive(role)} className="font-semibold text-rose-700">{role.isActive ? 'Disable' : 'Enable'}</button></div>}
          </div>
        </article>)}
        {data?.customRoles.length === 0 && <p className="rounded-lg border border-dashed p-4 text-sm text-slate-500">No custom roles have been created.</p>}
      </div>
      {canManageRoles && <form onSubmit={saveRole} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">{editingId ? 'Edit custom role' : 'Create custom role'}</h2>
        <input aria-label="Role name" required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="Role name" className="w-full rounded-lg border p-2 text-sm" />
        <textarea aria-label="Role description" maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="w-full rounded-lg border p-2 text-sm" />
        <fieldset className="max-h-80 space-y-2 overflow-y-auto rounded-lg border p-3">
          <legend className="px-1 text-sm font-medium">Additional permissions</legend>
          {data?.assignablePermissions.map((permission) => <label key={permission} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={selected.has(permission)} onChange={(event) => setSelected((current) => {
              const next = new Set(current);
              if (event.target.checked) next.add(permission); else next.delete(permission);
              return next;
            })} />
            <code>{permission}</code>
          </label>)}
          {data?.assignablePermissions.length === 0 && <p className="text-sm text-slate-500">Your built-in role cannot delegate any additional permissions.</p>}
        </fieldset>
        <div className="flex gap-2"><button disabled={saving} className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : editingId ? 'Save changes' : 'Create role'}</button>{editingId && <button type="button" onClick={resetForm} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>}</div>
      </form>}
    </section>
    <section className="space-y-3">
      <h2 className="font-semibold text-slate-900">Built-in role reference</h2>
      <div className="grid gap-3 xl:grid-cols-2">{data?.builtInRoles.map((role) => <article key={role.role} className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="font-semibold">{role.role.replace(/_/g, ' ')}</h3>
        <ul className="mt-2 flex flex-wrap gap-2">{role.permissions.map((entry) => <li key={entry.permission} className="rounded bg-slate-50 px-2 py-1 text-xs text-slate-600">{entry.permission}{entry.requiresResourceScope ? ' · scoped' : ''}</li>)}</ul>
      </article>)}</div>
    </section>
  </main>;
};
