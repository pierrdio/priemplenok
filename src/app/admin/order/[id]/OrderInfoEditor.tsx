'use client'

import { useState } from 'react'
import type { Order, StatusConfig } from '@/lib/order-types'
import { getStatusColor, getStatusLabel } from '@/lib/order-types'

interface Props {
  order: Order
  statuses: StatusConfig[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function OrderInfoEditor({ order: initial, statuses }: Props) {
  const [order, setOrder] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [draft, setDraft] = useState({
    client_name: initial.client_name,
    client_email: initial.client_email ?? '',
    notes: initial.notes ?? '',
  })

  const canEdit = order.status === 'coordinating'

  function startEdit() {
    setDraft({ client_name: order.client_name, client_email: order.client_email ?? '', notes: order.notes ?? '' })
    setError('')
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setError('')
  }

  async function save() {
    if (!draft.client_name.trim()) { setError('Заказчик обязателен'); return }
    setSaving(true)
    setError('')
    const res = await fetch(`/api/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: draft.client_name.trim(),
        client_email: draft.client_email.trim() || null,
        notes: draft.notes.trim() || null,
      }),
    })
    if (res.ok) {
      const updated: Order = await res.json()
      setOrder(updated)
      setEditing(false)
    } else {
      const json = await res.json()
      setError(json.error ?? 'Ошибка сохранения')
    }
    setSaving(false)
  }

  return (
    <div className="bg-white border border-slate-200 rounded p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Информация</p>
        {canEdit && !editing && (
          <button
            onClick={startEdit}
            className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
          >
            ✎ Редактировать
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Заказчик / Организация</label>
            <input
              autoFocus
              type="text"
              value={draft.client_name}
              onChange={(e) => setDraft((d) => ({ ...d, client_name: e.target.value }))}
              className="w-full border border-slate-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-slate-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Email</label>
            <input
              type="email"
              value={draft.client_email}
              onChange={(e) => setDraft((d) => ({ ...d, client_email: e.target.value }))}
              className="w-full border border-slate-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-slate-500"
              placeholder="client@example.com"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Примечания</label>
            <textarea
              rows={2}
              value={draft.notes}
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
              className="w-full border border-slate-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-slate-500 resize-none"
              placeholder="Страховой, ОТК, реставрация..."
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              disabled={saving}
              className="text-xs px-3 py-1.5 bg-slate-900 text-white rounded hover:bg-slate-700 disabled:bg-slate-300 transition-colors"
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
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
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="text-slate-400 w-32 shrink-0">Номер наряда</dt>
            <dd className="font-mono font-semibold text-slate-900">{order.box_number}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-slate-400 w-32 shrink-0">Заказчик</dt>
            <dd className="text-slate-800 wrap-break-word min-w-0">{order.client_name}</dd>
          </div>
          {order.client_email && (
            <div className="flex gap-2">
              <dt className="text-slate-400 w-32 shrink-0">Email</dt>
              <dd className="text-slate-600 break-all min-w-0">{order.client_email}</dd>
            </div>
          )}
          <div className="flex gap-2">
            <dt className="text-slate-400 w-32 shrink-0">Принято</dt>
            <dd className="text-slate-600 tabular-nums">{formatDate(order.received_at)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-slate-400 w-32 shrink-0">Обновлено</dt>
            <dd className="text-slate-600 tabular-nums">{formatDate(order.updated_at)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-slate-400 w-32 shrink-0">Статус</dt>
            <dd>
              <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(order.status, statuses)}`}>
                {getStatusLabel(order.status, statuses)}
              </span>
            </dd>
          </div>
          {order.notes && (
            <div className="mt-3 pt-3 border-t border-slate-100 text-sm text-slate-500">
              <span className="font-medium text-slate-600">Примечание: </span>{order.notes}
            </div>
          )}
        </dl>
      )}
    </div>
  )
}
