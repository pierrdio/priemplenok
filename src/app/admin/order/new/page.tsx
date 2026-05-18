import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { canCreateOrders } from '@/lib/roles'
import NewOrderForm from './NewOrderForm'

export default async function NewOrderPage() {
  const session = await getSession()
  if (!canCreateOrders(session?.role ?? '')) redirect('/admin')
  return <NewOrderForm />
}
