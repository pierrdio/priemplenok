import { getAllUsers } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (session?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 })
  const users = await getAllUsers()
  return Response.json(users)
}
