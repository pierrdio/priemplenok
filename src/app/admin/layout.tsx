import { getSession } from '@/lib/auth'
import { canCreateOrders } from '@/lib/roles'
import AdminNav from './AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  return (
    <div className="min-h-screen bg-gray-50">
      {session && <AdminNav username={session.username} isAdmin={session.role === 'admin'} canCreate={canCreateOrders(session.role)} />}
      <main>{children}</main>
    </div>
  )
}
