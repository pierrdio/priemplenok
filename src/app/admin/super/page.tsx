import { getAllOrders, getAllActivityLogs, getAllStatuses, getStatusLabel } from '@/lib/db'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function SuperAdminPage() {
  const [orders, logs, statuses] = await Promise.all([getAllOrders(), getAllActivityLogs(8), getAllStatuses()])

  const total = orders.length
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const thisMonth = orders.filter((o) => new Date(o.received_at) >= thisMonthStart).length
  const lastMonth = orders.filter(
    (o) => new Date(o.received_at) >= lastMonthStart && new Date(o.received_at) < thisMonthStart
  ).length
  const DELIVERED = ['ready_pickup', 'completed']
  const EXCLUDED = [...DELIVERED, 'coordinating']
  const deliveredTotal = orders.filter((o) => DELIVERED.includes(o.status)).length
  const inProgress = orders.filter((o) => !EXCLUDED.includes(o.status)).length

  const byStatus = statuses.map((s) => ({
    status: s,
    count: orders.filter((o) => o.status === s.code).length,
  }))

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-5 py-6 space-y-6">

      {/* Сводка */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Всего заказов', value: total },
          { label: 'Этот месяц', value: thisMonth, sub: lastMonth ? `${lastMonth > thisMonth ? '↓' : '↑'} прошлый: ${lastMonth}` : undefined },
          { label: 'Выдано', value: deliveredTotal },
          { label: 'В работе', value: inProgress },
        ].map((item) => (
          <div key={item.label} className="bg-white border border-slate-200 rounded p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{item.label}</p>
            <p className="text-3xl font-bold text-slate-900 tabular-nums">{item.value}</p>
            {item.sub && <p className="text-xs text-slate-400 mt-1">{item.sub}</p>}
          </div>
        ))}
      </div>

      {/* По статусам */}
      <div className="bg-white border border-slate-200 rounded p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-4">По статусам</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            {byStatus.map(({ status, count }) => (
              <div key={status.code}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{status.label}</span>
                  <span className="tabular-nums font-medium text-slate-900">{count}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${status.step_color}`}
                    style={{ width: total ? `${(count / total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      {/* Последние события */}
      <div className="bg-white border border-slate-200 rounded p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Последние события</p>
          <a href="/admin/super/logs" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
            Все логи →
          </a>
        </div>
        {logs.length === 0 ? (
          <p className="text-sm text-slate-300">Нет событий</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {logs.map((entry) => (
              <div key={entry.id} className="flex gap-4 py-2.5 text-sm">
                <time className="text-slate-400 tabular-nums text-xs shrink-0 w-28 pt-0.5">
                  {formatDate(entry.updated_at)}
                </time>
                <div className="min-w-0">
                  <span className="font-mono text-slate-700 font-medium">{entry.box_number}</span>
                  <span className="text-slate-400 mx-2">·</span>
                  <span className="text-slate-600">{getStatusLabel(entry.status, statuses)}</span>
                  {entry.comment && (
                    <p className="text-slate-400 text-xs mt-0.5 truncate">{entry.comment}</p>
                  )}
                </div>
                <span className="text-slate-300 text-xs shrink-0 ml-auto">{entry.updated_by}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
