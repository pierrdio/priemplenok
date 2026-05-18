import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    const form = await request.formData()
    const file = form.get('file') as File | null
    if (!file) return Response.json({ error: 'Файл не передан' }, { status: 400 })
    const text = await file.text()
    body = JSON.parse(text)
  } catch {
    return Response.json({ error: 'Некорректный JSON файл' }, { status: 400 })
  }

  const data = body as { orders?: unknown[] }
  if (!Array.isArray(data.orders)) {
    return Response.json({ error: 'Неверный формат: отсутствует поле orders' }, { status: 400 })
  }

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const raw of data.orders) {
    const o = raw as Record<string, unknown>
    if (!o.id || !o.box_number || !o.client_name) {
      errors.push(`Пропущена запись без обязательных полей`)
      continue
    }

    try {
      const existing = await prisma.order.findUnique({ where: { id: String(o.id) } })
      if (existing) { skipped++; continue }

      const history = Array.isArray(o.history) ? o.history as Record<string, unknown>[] : []

      const importItems = Array.isArray(o.items)
        ? (o.items as Record<string, unknown>[]).filter((it) => it?.film_title)
        : []

      await prisma.order.create({
        data: {
          id: String(o.id),
          box_number: String(o.box_number),
          client_name: String(o.client_name),
          client_email: o.client_email ? String(o.client_email) : null,
          notes: o.notes ? String(o.notes) : null,
          status: String(o.status ?? 'received'),
          received_at: new Date(String(o.received_at ?? new Date())),
          history: history.length > 0 ? {
            create: history.map((h) => ({
              status: String(h.status ?? 'received'),
              comment: h.comment ? String(h.comment) : null,
              updated_by: String(h.updated_by ?? 'import'),
              updated_at: new Date(String(h.updated_at ?? new Date())),
            })),
          } : {
            create: { status: String(o.status ?? 'received'), comment: 'Импорт', updated_by: 'import' },
          },
          items: importItems.length > 0 ? {
            create: importItems.map((it, idx) => ({
              film_title: String(it.film_title),
              description: it.description ? String(it.description) : null,
              sort_order: idx,
            })),
          } : undefined,
        },
      })
      imported++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`Заказ ${o.box_number}: ${msg}`)
    }
  }

  return Response.json({ imported, skipped, errors })
}
