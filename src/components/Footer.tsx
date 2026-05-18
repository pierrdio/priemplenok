export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-auto">
      <div className="max-w-5xl mx-auto px-5 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Госфильмофонд России</p>
        <p>Система учёта и отслеживания заказов</p>
      </div>
    </footer>
  )
}
