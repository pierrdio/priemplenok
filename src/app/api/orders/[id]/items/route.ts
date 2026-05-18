import { NextRequest } from 'next/server'
import { addOrderItem, getOrderById } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const order = await getOrderById(id)
  if (!order) return Response.json({ error: 'Not found' }, { status: 404 })

  const { film_title, description } = await request.json()
  const title = String(film_title ?? '').trim()
  if (!title) return Response.json({ error: 'film_title обязателен' }, { status: 400 })

  const item = await addOrderItem(id, title, description ? String(description).trim() : undefined)
  return Response.json(item, { status: 201 })
}
