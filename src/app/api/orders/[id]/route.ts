import { NextRequest } from 'next/server'
import { getOrderById, updateOrderStatus, updateOrderInfo, setOrderDelay, getStatusHistory, deleteOrder, getAllStatuses, getStatusLabel } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sendStatusEmail } from '@/lib/email'
import { canChangeToStatus } from '@/lib/roles'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const order = await getOrderById(id)
  if (!order) return Response.json({ error: 'Not found' }, { status: 404 })
  const history = await getStatusHistory(id)
  return Response.json({ order, history })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const order = await getOrderById(id)
  if (!order) return Response.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()

  // Delay toggle
  if ('is_delayed' in body) {
    const updated = await setOrderDelay(id, Boolean(body.is_delayed))
    if (!updated) return Response.json({ error: 'Update failed' }, { status: 500 })
    return Response.json(updated)
  }

  // Info update (only during 'coordinating' status)
  if (!('status' in body)) {
    const { client_name, client_email, notes } = body
    if (!client_name || typeof client_name !== 'string') {
      return Response.json({ error: 'Заказчик обязателен' }, { status: 400 })
    }
    if (order.status !== 'coordinating') {
      return Response.json({ error: 'Редактирование доступно только на этапе согласования' }, { status: 403 })
    }
    const email = client_email ? String(client_email).trim() : null
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Некорректный email' }, { status: 400 })
    }
    const updated = await updateOrderInfo(id, {
      client_name: String(client_name).trim(),
      client_email: email,
      notes: notes ? String(notes).trim() : null,
    })
    if (!updated) return Response.json({ error: 'Update failed' }, { status: 500 })
    return Response.json(updated)
  }

  // Status update
  const { status, comment } = body
  if (!status || typeof status !== 'string') {
    return Response.json({ error: 'Invalid status' }, { status: 400 })
  }

  const statuses = await getAllStatuses()
  if (!statuses.some((s) => s.code === status)) {
    return Response.json({ error: 'Invalid status' }, { status: 400 })
  }

  if (!canChangeToStatus(session.role, status, statuses.map((s) => s.code))) {
    return Response.json({ error: 'Нет прав для установки этого статуса' }, { status: 403 })
  }

  const updated = await updateOrderStatus(id, status, session.username, comment)
  if (!updated) return Response.json({ error: 'Update failed' }, { status: 500 })

  const statusLabel = getStatusLabel(status, statuses)
  const statusConfig = statuses.find((s) => s.code === status)

  let emailSent = false
  let emailError: string | null = null

  if (statusConfig?.notify_client) {
    const emailResult = await sendStatusEmail(updated, comment, statusLabel)
    emailSent = emailResult.sent
    emailError = emailResult.error ?? null
  }

  return Response.json({ ...updated, emailSent, emailError })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const order = await getOrderById(id)
  if (!order) return Response.json({ error: 'Not found' }, { status: 404 })

  await deleteOrder(id)
  return new Response(null, { status: 204 })
}
