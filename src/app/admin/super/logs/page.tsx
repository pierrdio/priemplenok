import Link from 'next/link'
import { getAllActivityLogs, getAllStatuses, getStatusLabel, getStatusColor } from '@/lib/db'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const PER_PAGE = 50

export default async function SuperAdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page = '1' } = await searchParams
  const pageNum = Math.max(1, parseInt(page) || 1)

  const [all, statuses] = await Promise.all([getAllActivityLogs(1000), getAllStatuses()])
  const totalPages = Math.max(1, Math.ceil(all.length / PER_PAGE))
  const safePage = Math.min(pageNum, totalPages)
  const logs = all.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  function pageUrl(p: number) {
    return p === 1 ? '/admin/super/logs' : `/admin/super/logs?page=${p}`
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-5 py-6">
      <div className="flex items-end justify-between mb-5 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Лог активности</h1>
          <p className="text-sm text-slate-400 mt-0.5">{all.length} событий</p>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded p-12 text-center text-slate-400 text-sm">
          Событий нет
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded divide-y divide-slate-100">
          {logs.map((entry) => (
            <div key={entry.id} className="flex gap-3 sm:gap-5 px-4 py-3 text-sm">
              <time className="text-slate-400 tabular-nums text-xs shrink-0 w-28 pt-0.5">
                {formatDate(entry.updated_at)}
              </time>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <Link
                    href={`/admin/order/${entry.order_id}`}
                    className="font-mono font-semibold text-slate-800 hover:text-slate-900 transition-colors"
                  >
                    {entry.box_number}
                  </Link>
                  <span className="text-slate-300 text-xs hidden sm:inline">{entry.client_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(entry.status, statuses)}`}>
                    {getStatusLabel(entry.status, statuses)}
                  </span>
                </div>
                {entry.comment && (
                  <p className="text-slate-400 text-xs truncate">{entry.comment}</p>
                )}
              </div>
              <span className="text-slate-300 text-xs shrink-0 hidden sm:block">{entry.updated_by}</span>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 gap-3 flex-wrap">
          <p className="text-xs text-slate-400">
            Страница {safePage} из {totalPages}
          </p>
          <div className="flex gap-1">
            {safePage > 1 && (
              <Link href={pageUrl(safePage - 1)} className="px-3 py-1.5 text-xs border border-slate-300 rounded hover:bg-white text-slate-600 transition-colors">
                ← Назад
              </Link>
            )}
            {safePage < totalPages && (
              <Link href={pageUrl(safePage + 1)} className="px-3 py-1.5 text-xs border border-slate-300 rounded hover:bg-white text-slate-600 transition-colors">
                Вперёд →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
