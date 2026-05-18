import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getOrderById, getStatusHistory, getAllStatuses, getStatusLabel, getStatusColor } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getAllowedStatuses } from '@/lib/roles'
import StatusChanger from './StatusChanger'
import DeleteOrderButton from './DeleteOrderButton'
import OrderItems from './OrderItems'
import OrderInfoEditor from './OrderInfoEditor'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function AdminOrderPage({ params }: PageProps<'/admin/order/[id]'>) {
  const { id } = await params
  const [order, history, statuses, session] = await Promise.all([
    getOrderById(id),
    getStatusHistory(id),
    getAllStatuses(),
    getSession(),
  ])
  if (!order) notFound()

  const role = session?.role ?? 'admin'
  const allowed = getAllowedStatuses(role, statuses.map((s) => s.code))
  const visibleStatuses = statuses.filter((s) => allowed.includes(s.code))

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-5 py-5 sm:py-6">

      {/* Шапка */}
      <div className="mb-5 pb-4 border-b border-slate-200">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 justify-between">
          <div className="flex items-baseline gap-3 min-w-0">
            <Link href="/admin" className="text-slate-400 hover:text-slate-700 text-sm transition-colors shrink-0">
              ← Назад
            </Link>
            <h1 className="text-lg font-semibold text-slate-900 truncate flex items-center gap-2">
              Заказ <span className="font-mono">№ {order.box_number}</span>
              {order.is_delayed && (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200 normal-case">
                  ⚠ Задержка
                </span>
              )}
            </h1>
          </div>
          {order.status !== 'coordinating' && (
            <a
              href={`/api/orders/${id}/pdf`}
              download={`order-${order.box_number}.pdf`}
              className="border border-slate-300 hover:bg-white text-slate-600 text-sm px-3 py-1.5 rounded transition-colors shrink-0"
            >
              Скачать PDF
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:items-start">

        {/* Смена статуса — первым на мобиле */}
        <div className="order-first sm:order-last sm:w-72 shrink-0 bg-white border border-slate-200 rounded p-4">
          <StatusChanger orderId={id} currentStatus={order.status} isDelayed={order.is_delayed} hasEmail={!!order.client_email} statuses={visibleStatuses} />
        </div>

        {/* Информация + история */}
        <div className="sm:order-first flex-1 min-w-0 space-y-4">
          <OrderInfoEditor order={order} statuses={statuses} />

          <OrderItems orderId={id} initialItems={order.items} />

          {/* История */}
          <div className="bg-white border border-slate-200 rounded p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">История</p>
            {history.length === 0 ? (
              <p className="text-sm text-slate-300">Нет записей</p>
            ) : (
              <div className="space-y-2.5">
                {history.map((entry) => (
                  <div key={entry.id} className="flex gap-3 text-sm">
                    <time className="text-slate-400 tabular-nums shrink-0 w-28 pt-0.5 text-xs">
                      {formatDate(entry.updated_at)}
                    </time>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(entry.status, statuses)}`}>
                          {getStatusLabel(entry.status, statuses)}
                        </span>
                        <span className="text-slate-300 text-xs">{entry.updated_by}</span>
                      </div>
                      {entry.comment && (
                        <p className="text-slate-500 mt-1">{entry.comment}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-1">
            <DeleteOrderButton orderId={id} boxNumber={order.box_number} />
          </div>
        </div>
      </div>
    </div>
  )
}
