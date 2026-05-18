import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getOrderById, getStatusHistory, getAllStatuses, getStatusLabel } from '@/lib/db'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function OrderStatusPage({ params }: PageProps<'/order/[id]'>) {
  const { id } = await params
  const [order, history, statuses] = await Promise.all([
    getOrderById(id),
    getStatusHistory(id),
    getAllStatuses(),
  ])
  if (!order) notFound()

  const currentIndex = statuses.findIndex((s) => s.code === order.status)

  const statusDates: Record<string, string> = { [statuses[0]?.code ?? '']: order.received_at }
  for (const entry of history) {
    statusDates[entry.status] = entry.updated_at
  }

  return (
    <div className="min-h-screen bg-[#f4f3f0]">

      {/* Шапка */}
      <div className="bg-slate-900 text-white px-5 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Image src="/logo-header.png" alt="Госфильмофонд" height={36} width={59} className="object-contain shrink-0 brightness-0 invert" />
          <p className="text-slate-300 text-sm">Проявка и сканирование киноматериалов</p>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-5 py-6 space-y-4">

        {/* Основная карточка */}
        <div className="bg-white border border-slate-200 rounded">
          <div className="px-4 py-4 border-b border-slate-100 flex items-baseline justify-between">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Заказ</p>
            <span className="font-mono text-2xl font-bold text-slate-900">{order.box_number}</span>
          </div>
          <div className="px-4 py-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Заказчик</span>
              <span className="text-slate-800 font-medium">{order.client_name}</span>
            </div>
            {order.items.length > 0 && (
              <div className="flex gap-4">
                <span className="text-slate-400 shrink-0">Позиции</span>
                <div className="text-right space-y-0.5">
                  {order.items.map((it, i) => (
                    <div key={it.id} className="text-slate-700">
                      {i + 1}. {it.film_title}
                      {it.description && <span className="text-slate-400"> ({it.description})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Принято</span>
              <span className="text-slate-600 tabular-nums">{formatDate(order.received_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Обновлено</span>
              <span className="text-slate-600 tabular-nums">{formatDate(order.updated_at)}</span>
            </div>
          </div>
        </div>

        {/* Этапы */}
        <div className="bg-white border border-slate-200 rounded p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Этапы обработки</p>
          <div className="space-y-0">
            {statuses.map((s, idx) => {
              const done = currentIndex >= 0 ? idx < currentIndex : false
              const active = idx === currentIndex
              return (
                <div key={s.code} className="flex items-stretch gap-3">
                  <div className="flex flex-col items-center w-5">
                    <div className={`w-2.5 h-2.5 rounded-full mt-3 shrink-0 ${
                      done ? 'bg-slate-400' : active ? s.step_color : 'bg-slate-200'
                    }`} />
                    {idx < statuses.length - 1 && (
                      <div className={`w-px flex-1 my-1 ${done ? 'bg-slate-300' : 'bg-slate-100'}`} />
                    )}
                  </div>
                  <div className={`py-1.5 pb-3 text-sm flex items-baseline justify-between gap-3 flex-1 ${
                    active ? 'font-semibold text-slate-900' : done ? 'text-slate-400' : 'text-slate-300'
                  }`}>
                    <span>
                      {s.label}
                      {active && <span className="ml-2 text-xs font-normal text-slate-400">— сейчас</span>}
                    </span>
                    {statusDates[s.code] && (
                      <span className="text-xs tabular-nums font-normal text-slate-400 shrink-0">
                        {formatDate(statusDates[s.code])}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* История */}
        {history.length > 0 && (
          <div className="bg-white border border-slate-200 rounded p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">История изменений</p>
            <div className="space-y-3">
              {history.map((entry) => (
                <div key={entry.id} className="flex gap-3 text-sm">
                  <time className="text-slate-400 tabular-nums shrink-0 w-28 text-xs pt-0.5">
                    {formatDate(entry.updated_at)}
                  </time>
                  <div>
                    <span className="text-slate-700 font-medium">{getStatusLabel(entry.status, statuses)}</span>
                    {entry.comment && (
                      <p className="text-slate-400 text-xs mt-0.5">{entry.comment}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {order.notes && (
          <div className="border-l-2 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-800 rounded-r">
            {order.notes}
          </div>
        )}
      </main>
    </div>
  )
}
