import Link from 'next/link'
import { getAllOrders, getAllStatuses, getStatusLabel, getStatusColor, type OrderItem } from '@/lib/db'
import { markDelayedOrders } from '@/lib/delays'
import { getSession } from '@/lib/auth'
import { canCreateOrders } from '@/lib/roles'
import OrderFilters from './OrderFilters'
import { Badge } from '@/components/ui/badge'

const BADGE_LIMIT = 3

function ItemBadges({ items }: { items: OrderItem[] }) {
  if (items.length === 0) return null
  const visible = items.slice(0, BADGE_LIMIT)
  const rest = items.length - BADGE_LIMIT
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {visible.map((it) => (
        <Badge key={it.id} variant="outline" className="text-slate-500 border-slate-200 font-normal max-w-40 truncate">
          {it.film_title}
        </Badge>
      ))}
      {rest > 0 && (
        <Badge variant="outline" className="text-slate-400 border-slate-200 font-normal">
          +{rest} ещё
        </Badge>
      )}
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const PER_PAGE = 25

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; delayed?: string }>
}) {
  const { q = '', status = 'all', page = '1', delayed: delayedParam = '' } = await searchParams
  const pageNum = Math.max(1, parseInt(page) || 1)
  const delayed = delayedParam === 'true'

  await markDelayedOrders()
  const [all, statuses, session] = await Promise.all([getAllOrders(), getAllStatuses(), getSession()])
  const canCreate = canCreateOrders(session?.role ?? '')

  const filtered = all.filter((order) => {
    const qLower = q.toLowerCase()
    const matchesQ =
      !q ||
      order.box_number.toLowerCase().includes(qLower) ||
      order.client_name.toLowerCase().includes(qLower) ||
      order.items.some((it) => it.film_title.toLowerCase().includes(qLower))
    const matchesStatus = status === 'all' || !status || order.status === status
    const matchesDelayed = !delayed || order.is_delayed
    return matchesQ && matchesStatus && matchesDelayed
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(pageNum, totalPages)
  const orders = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (status && status !== 'all') params.set('status', status)
    if (delayed) params.set('delayed', 'true')
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return qs ? `/admin?${qs}` : '/admin'
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-5 py-5 sm:py-6">

      {/* Шапка */}
      <div className="flex items-start sm:items-end justify-between mb-4 sm:mb-5 pb-4 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Журнал заказов</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {filtered.length === all.length
              ? `${all.length} записей`
              : `${filtered.length} из ${all.length}`}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/admin/order/new"
            className="bg-slate-900 hover:bg-slate-700 text-white text-sm px-4 py-2 rounded transition-colors shrink-0"
          >
            + Новый
          </Link>
        )}
      </div>

      {/* Фильтры */}
      <div className="mb-4">
        <OrderFilters q={q} status={status} delayed={delayed} statuses={statuses} />
      </div>

      {/* Список */}
      {orders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded p-12 text-center text-slate-400 text-sm">
          {all.length === 0 ? 'Заказов пока нет' : 'Ничего не найдено'}
        </div>
      ) : (
        <>
          {/* Карточки — мобиль */}
          <div className="sm:hidden bg-white border border-slate-200 rounded divide-y divide-slate-100">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/order/${order.id}`}
                className="block px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-900">{order.box_number}</span>
                    {order.is_delayed && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 border border-amber-200">⚠</span>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${getStatusColor(order.status, statuses)}`}>
                    {getStatusLabel(order.status, statuses)}
                  </span>
                </div>
                <div className="text-sm text-slate-700">{order.client_name}</div>
                <ItemBadges items={order.items} />
                <div className="text-xs text-slate-400 mt-1">{formatDateShort(order.received_at)}</div>
              </Link>
            ))}
          </div>

          {/* Таблица — десктоп */}
          <div className="hidden sm:block bg-white border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide">Заказ</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide">Клиент</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide">Статус</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide">Принято</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wide">Обновлено</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        {order.box_number}
                        {order.is_delayed && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 border border-amber-200 font-normal">⚠</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {order.client_name}
                      <ItemBadges items={order.items} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(order.status, statuses)}`}>
                        {getStatusLabel(order.status, statuses)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 tabular-nums">{formatDate(order.received_at)}</td>
                    <td className="px-4 py-3 text-slate-400 tabular-nums">{formatDate(order.updated_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/order/${order.id}`}
                        className="text-slate-400 hover:text-slate-900 transition-colors text-xs"
                      >
                        Открыть →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 gap-3 flex-wrap">
          <p className="text-xs text-slate-400">
            Страница {safePage} из {totalPages} · {filtered.length} записей
          </p>
          <div className="flex gap-1">
            {safePage > 1 && (
              <Link
                href={pageUrl(safePage - 1)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded hover:bg-white text-slate-600 transition-colors"
              >
                ← Назад
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - safePage) <= 2)
              .map((p) => (
                <Link
                  key={p}
                  href={pageUrl(p)}
                  className={`px-3 py-1.5 text-xs border rounded transition-colors ${
                    p === safePage
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'border-slate-300 text-slate-600 hover:bg-white'
                  }`}
                >
                  {p}
                </Link>
              ))}
            {safePage < totalPages && (
              <Link
                href={pageUrl(safePage + 1)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded hover:bg-white text-slate-600 transition-colors"
              >
                Вперёд →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
