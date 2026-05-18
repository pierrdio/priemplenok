import { getSession } from '@/lib/auth'
import { getAllOrdersWithHistory } from '@/lib/db'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') ?? 'json'
  const orders = await getAllOrdersWithHistory()
  const date = new Date().toISOString().slice(0, 10)

  if (format === 'csv') {
    const header = ['ID', 'Номер', 'Клиент', 'Email', 'Позиции', 'Статус', 'Принято', 'Обновлено', 'Примечание']
    const rows = orders.map((o) => [
      o.id, o.box_number, o.client_name, o.client_email ?? '',
      o.items.map((it) => it.film_title + (it.description ? ` (${it.description})` : '')).join('; '),
      o.status, o.received_at, o.updated_at, o.notes ?? '',
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    return new Response('﻿' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="orders-${date}.csv"`,
      },
    })
  }

  const json = JSON.stringify({ exported_at: new Date().toISOString(), count: orders.length, orders }, null, 2)
  return new Response(json, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="backup-${date}.json"`,
    },
  })
}
