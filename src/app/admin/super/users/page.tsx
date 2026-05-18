import { getAllUsers } from '@/lib/db'
import { getRoles } from '@/lib/roles'
import UsersClient from './UsersClient'

export default async function UsersPage() {
  const [users, roles] = await Promise.all([getAllUsers(), Promise.resolve(getRoles())])

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-5 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Пользователи</h1>
        </div>
      </div>

      <UsersClient initialUsers={users} roles={roles} />

      <div className="bg-slate-50 border border-slate-200 rounded p-4 text-xs text-slate-500 space-y-1.5">
        <p className="font-medium text-slate-700">Доступные роли</p>
        {roles.map((r) => (
          <div key={r.code} className="flex gap-2">
            <span className="font-medium text-slate-600 w-28 shrink-0">{r.label}</span>
            <span className="text-slate-400">
              {r.statuses.includes('*') ? 'все статусы' : r.statuses.join(', ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
