import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import SuperAdminNav from './SuperAdminNav'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (session?.role !== 'admin') redirect('/admin')

  return (
    <div>
      <SuperAdminNav />
      {children}
    </div>
  )
}
