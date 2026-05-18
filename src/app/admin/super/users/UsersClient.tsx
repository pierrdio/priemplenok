'use client'

import { useState } from 'react'
import type { UserRecord } from '@/lib/db'
import type { RoleConfig } from '@/lib/roles'

export default function UsersClient({
  initialUsers,
  roles,
}: {
  initialUsers: UserRecord[]
  roles: RoleConfig[]
}) {
  const [users, setUsers] = useState(initialUsers)
  const [saving, setSaving] = useState<number | null>(null)

  async function handleRoleChange(userId: number, role: string) {
    setSaving(userId)
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    if (res.ok) {
      const updated: UserRecord = await res.json()
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    }
    setSaving(null)
  }

  return (
    <div className="bg-white border border-slate-200 rounded overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide">Пользователь</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide">Роль</th>
            <th className="px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide text-right">Создан</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-4 py-3 font-medium text-slate-900">{user.username}</td>
              <td className="px-4 py-3">
                <select
                  value={user.role}
                  disabled={saving === user.id}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className="border border-slate-200 rounded px-2 py-1 text-sm text-slate-700 focus:outline-none focus:border-slate-400 disabled:opacity-50 bg-white"
                >
                  {roles.map((r) => (
                    <option key={r.code} value={r.code}>{r.label}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 text-slate-400 tabular-nums text-xs text-right">
                {new Date(user.created_at).toLocaleDateString('ru-RU')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
