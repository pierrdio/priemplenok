import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f4f3f0] flex flex-col">
      <div className="bg-slate-900 text-white px-5 py-4 text-center">
        <div className="max-w-lg mx-auto">
          <p className="text-slate-400 text-xs uppercase tracking-widest">Госфильмофонд России</p>
          <p className="text-white text-sm mt-0.5">Проявка и сканирование киноматериалов</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <p className="text-8xl font-bold text-slate-200 tabular-nums mb-4">404</p>
          <h1 className="text-xl font-semibold text-slate-800 mb-2">Страница не найдена</h1>
          <p className="text-sm text-slate-500 mb-8">
            Запрошенная страница не существует или была удалена.
          </p>
          <Link
            href="/"
            className="inline-block bg-slate-900 hover:bg-slate-700 text-white text-sm px-5 py-2.5 rounded transition-colors"
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  )
}
