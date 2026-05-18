import { updateUserRole } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getRoles } from '@/lib/roles'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (session?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const { role } = body

  const validCodes = getRoles().map((r) => r.code)
  if (!role || !validCodes.includes(role)) {
    return Response.json({ error: 'Invalid role' }, { status: 400 })
  }

  const updated = await updateUserRole(Number(id), role)
  return Response.json(updated)
}
