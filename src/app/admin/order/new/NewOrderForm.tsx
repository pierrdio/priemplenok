'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface ItemDraft {
  film_title: string
  description: string
}

function mask(v: string) {
  return v.replace(/[^а-яёА-ЯЁa-zA-Z0-9 .,\-_()/:'"«»№]/g, '')
}

function maskKeyDown(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (e.key.length === 1 && mask(e.key) === '') e.preventDefault()
}

export default function NewOrderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [items, setItems] = useState<ItemDraft[]>([])
  const [draft, setDraft] = useState<ItemDraft>({ film_title: '', description: '' })
  const titleRef = useRef<HTMLInputElement>(null)

  function commitDraft() {
    const title = draft.film_title.trim()
    if (!title) return
    setItems((prev) => [...prev, { film_title: title, description: draft.description.trim() }])
    setDraft({ film_title: '', description: '' })
    titleRef.current?.focus()
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const pending = draft.film_title.trim()
      ? [{ film_title: draft.film_title.trim(), description: draft.description.trim() }]
      : []

    const data = {
      client_name:  (form.elements.namedItem('client_name')  as HTMLInputElement).value.trim(),
      client_email: (form.elements.namedItem('client_email') as HTMLInputElement).value.trim(),
      notes:        (form.elements.namedItem('notes')        as HTMLTextAreaElement).value.trim(),
      items: [...items, ...pending],
    }

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      const order = await res.json()
      router.push(`/admin/order/${order.id}`)
    } else {
      const json = await res.json()
      setError(json.error ?? 'Ошибка создания заказа')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-5 py-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
        <Link href="/admin" className="text-slate-400 hover:text-slate-700 text-sm transition-colors">
          ← Назад
        </Link>
        <h1 className="text-lg font-semibold text-slate-900">Новый заказ</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        <div className="bg-white border border-slate-200 rounded p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
              Номер наряда
            </label>
            <p className="text-sm text-slate-400 py-1">Присваивается автоматически при создании</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
              Заказчик / Организация <span className="text-red-400 normal-case">*</span>
            </label>
            <input
              name="client_name"
              type="text"
              required
              onKeyDown={maskKeyDown}
              onChange={(e) => { const v = mask(e.target.value); if (v !== e.target.value) e.target.value = v }}
              className="w-full border border-slate-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-slate-500"
              placeholder="Название организации или ФИО"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
              Email для уведомлений
            </label>
            <input
              name="client_email"
              type="email"
              className="w-full border border-slate-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-slate-500"
              placeholder="client@example.com"
            />
            <p className="text-xs text-slate-400 mt-1">Клиент получит письмо при смене статуса</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
              Примечания
            </label>
            <textarea
              name="notes"
              rows={2}
              className="w-full border border-slate-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-slate-500 resize-none"
              placeholder="Страховой, ОТК, реставрация..."
            />
          </div>
        </div>

        {/* Позиции */}
        <div className="bg-white border border-slate-200 rounded p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
            Позиции{items.length > 0 && <span className="normal-case font-normal ml-1">({items.length})</span>}
          </p>

          {/* Бейджи добавленных позиций */}
          {items.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-0.5">
                  <Badge
                    variant="outline"
                    className="text-slate-600 border-slate-300 font-normal max-w-52 truncate"
                    title={item.description || item.film_title}
                  >
                    {item.film_title}
                    {item.description && (
                      <span className="text-slate-400 ml-1">({item.description})</span>
                    )}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-slate-300 hover:text-red-400 transition-colors text-base leading-none px-0.5"
                    title="Удалить"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Поля новой позиции */}
          <div className="space-y-2">
            <input
              ref={titleRef}
              type="text"
              value={draft.film_title}
              onChange={(e) => setDraft((d) => ({ ...d, film_title: mask(e.target.value) }))}
              onKeyDown={(e) => { maskKeyDown(e); if (e.key === 'Enter') { e.preventDefault(); commitDraft() } }}
              className="w-full border border-slate-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-slate-500"
              placeholder="Название фильма"
            />
            <input
              type="text"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: mask(e.target.value) }))}
              onKeyDown={(e) => { maskKeyDown(e); if (e.key === 'Enter') { e.preventDefault(); commitDraft() } }}
              className="w-full border border-slate-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-slate-500"
              placeholder="Исходные материалы (н/ф, кинофоно...)"
            />
          </div>

          <button
            type="button"
            onClick={commitDraft}
            disabled={!draft.film_title.trim()}
            className="mt-3 text-sm text-slate-500 hover:text-slate-800 disabled:text-slate-300 disabled:cursor-default transition-colors"
          >
            + Добавить позицию
          </button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-slate-900 hover:bg-slate-700 disabled:bg-slate-300 text-white text-sm px-5 py-2 rounded transition-colors"
          >
            {loading ? 'Создание...' : 'Создать'}
          </button>
          <Link
            href="/admin"
            className="border border-slate-300 hover:bg-slate-50 text-slate-600 text-sm px-5 py-2 rounded transition-colors"
          >
            Отмена
          </Link>
        </div>
      </form>
    </div>
  )
}
