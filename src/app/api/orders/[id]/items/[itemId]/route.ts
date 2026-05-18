import { NextRequest } from 'next/server'
import { updateOrderItem, deleteOrderItem } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { itemId } = await params
  const { film_title, description } = await request.json()
  const title = String(film_title ?? '').trim()
  if (!title) return Response.json({ error: 'film_title обязателен' }, { status: 400 })

  const item = await updateOrderItem(
    Number(itemId),
    title,
    description ? String(description).trim() : undefined,
  )
  return Response.json(item)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { itemId } = await params
  await deleteOrderItem(Number(itemId))
  return new Response(null, { status: 204 })
}
