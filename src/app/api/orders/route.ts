import { NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { createOrder, getAllOrders, generateBoxNumber } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sendOrderCreatedEmail } from '@/lib/email'
import { canCreateOrders } from '@/lib/roles'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  return Response.json(await getAllOrders())
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canCreateOrders(session.role)) return Response.json({ error: 'Нет прав для создания заказов' }, { status: 403 })

  const body = await request.json()
  const { client_name, client_email, notes, items } = body

  if (!client_name) {
    return Response.json({ error: 'Заказчик обязателен' }, { status: 400 })
  }

  const email = client_email ? String(client_email).trim() : null
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Некорректный email' }, { status: 400 })
  }

  const parsedItems: { film_title: string; description?: string }[] = []
  if (Array.isArray(items)) {
    for (const it of items) {
      const title = String(it?.film_title ?? '').trim()
      if (title) {
        parsedItems.push({
          film_title: title,
          description: it?.description ? String(it.description).trim() : undefined,
        })
      }
    }
  }

  const box_number = await generateBoxNumber()

  const order = await createOrder(
    {
      id: uuidv4(),
      box_number,
      client_name: String(client_name).trim(),
      client_email: email,
      received_at: new Date().toISOString(),
      status: 'coordinating',
      notes: notes ? String(notes).trim() : null,
    },
    parsedItems,
  )

  sendOrderCreatedEmail(order)

  return Response.json(order, { status: 201 })
}
