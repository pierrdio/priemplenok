'use client'

import { useState } from 'react'
import type { OrderItem } from '@/lib/order-types'
import FilmMaterialSelect from '@/components/FilmMaterialSelect'

interface Props {
  orderId: string
  initialItems: OrderItem[]
}

interface EditState {
  film_title: string
  description: string
}

export default function OrderItems({ orderId, initialItems }: Props) {
  const [items, setItems] = useState<OrderItem[]>(initialItems)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editState, setEditState] = useState<EditState>({ film_title: '', description: '' })
  const [addOpen, setAddOpen] = useState(false)
  const [addState, setAddState] = useState<EditState>({ film_title: '', description: '' })
  const [busy, setBusy] = useState(false)

  function startEdit(item: OrderItem) {
    setEditingId(item.id)
    setEditState({ film_title: item.film_title, description: item.description ?? '' })
    setAddOpen(false)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function saveEdit(itemId: number) {
    const title = editState.film_title.trim()
    if (!title) return
    setBusy(true)
    const res = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ film_title: title, description: editState.description.trim() }),
    })
    if (res.ok) {
      const updated: OrderItem = await res.json()
      setItems((prev) => prev.map((it) => (it.id === itemId ? updated : it)))
      setEditingId(null)
    }
    setBusy(false)
  }

  async function deleteItem(itemId: number) {
    setBusy(true)
    const res = await fetch(`/api/orders/${orderId}/items/${itemId}`, { method: 'DELETE' })
    if (res.ok) {
      setItems((prev) => prev.filter((it) => it.id !== itemId))
    }
    setBusy(false)
  }

  async function addItem() {
    const title = addState.film_title.trim()
    if (!title) return
    setBusy(true)
    const res = await fetch(`/api/orders/${orderId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ film_title: title, description: addState.description.trim() }),
    })
    if (res.ok) {
      const created: OrderItem = await res.json()
      setItems((prev) => [...prev, created])
      setAddState({ film_title: '', description: '' })
      setAddOpen(false)
    }
    setBusy(false)
  }

  return (
    <div className="bg-white border border-slate-200 rounded p-4">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
        Позиции {items.length > 0 && <span className="normal-case font-normal">({items.length})</span>}
      </p>

      {items.length === 0 && !addOpen && (
        <p className="text-sm text-slate-300 mb-3">Нет позиций</p>
      )}

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={item.id}>
            {editingId === item.id ? (
              <div className="border border-slate-200 rounded p-3 space-y-2">
                <input
                  autoFocus
                  type="text"
                  value={editState.film_title}
                  onChange={(e) => setEditState((s) => ({ ...s, film_title: e.target.value }))}
                  className="w-full border border-slate-300 px-2.5 py-1.5 text-sm rounded focus:outline-none focus:border-slate-500"
                  placeholder="Название фильма"
                />
                <FilmMaterialSelect
                  value={editState.description}
                  onChange={(v) => setEditState((s) => ({ ...s, description: v }))}
                  size="sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(item.id)}
                    disabled={busy || !editState.film_title.trim()}
                    className="text-xs px-3 py-1.5 bg-slate-900 text-white rounded hover:bg-slate-700 disabled:bg-slate-300 transition-colors"
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="text-xs px-3 py-1.5 border border-slate-300 text-slate-600 rounded hover:bg-slate-50 transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 group py-1">
                <span className="text-xs text-slate-300 tabular-nums mt-0.5 w-4 shrink-0">{idx + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800">{item.film_title}</p>
                  {item.description && (
                    <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => startEdit(item)}
                    className="text-xs text-slate-400 hover:text-slate-700 px-1.5 py-0.5 transition-colors"
                    title="Редактировать"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    disabled={busy}
                    className="text-xs text-slate-300 hover:text-red-400 px-1.5 py-0.5 transition-colors"
                    title="Удалить"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {addOpen ? (
        <div className="border border-slate-200 rounded p-3 space-y-2 mt-3">
          <input
            autoFocus
            type="text"
            value={addState.film_title}
            onChange={(e) => setAddState((s) => ({ ...s, film_title: e.target.value }))}
            className="w-full border border-slate-300 px-2.5 py-1.5 text-sm rounded focus:outline-none focus:border-slate-500"
            placeholder="Название фильма"
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
          />
          <FilmMaterialSelect
            value={addState.description}
            onChange={(v) => setAddState((s) => ({ ...s, description: v }))}
            size="sm"
          />
          <div className="flex gap-2">
            <button
              onClick={addItem}
              disabled={busy || !addState.film_title.trim()}
              className="text-xs px-3 py-1.5 bg-slate-900 text-white rounded hover:bg-slate-700 disabled:bg-slate-300 transition-colors"
            >
              Добавить
            </button>
            <button
              onClick={() => { setAddOpen(false); setAddState({ film_title: '', description: '' }) }}
              className="text-xs px-3 py-1.5 border border-slate-300 text-slate-600 rounded hover:bg-slate-50 transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => { setAddOpen(true); setEditingId(null) }}
          className="mt-3 text-xs text-slate-400 hover:text-slate-700 transition-colors"
        >
          + Добавить позицию
        </button>
      )}
    </div>
  )
}
