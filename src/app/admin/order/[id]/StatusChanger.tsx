'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { StatusConfig } from '@/lib/order-types'

export default function StatusChanger({
  orderId,
  currentStatus,
  isDelayed: initialDelayed,
  hasEmail,
  statuses,
}: {
  orderId: string
  currentStatus: string
  isDelayed: boolean
  hasEmail: boolean
  statuses: StatusConfig[]
}) {
  const router = useRouter()
  const [selected, setSelected] = useState(currentStatus)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [delayed, setDelayed] = useState(initialDelayed)
  const [delayBusy, setDelayBusy] = useState(false)

  const currentLabel = statuses.find((s) => s.code === selected)?.label ?? selected

  async function handleSave() {
    if (selected === currentStatus) return
    setLoading(true)

    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: selected, comment: comment.trim() || undefined }),
    })

    if (res.ok) {
      const data = await res.json()
      toast.success(`Статус: ${currentLabel}`)
      if (data.emailSent) toast.info('Письмо отправлено клиенту')
      else if (data.emailError) toast.warning('Не удалось отправить письмо')
      else if (!hasEmail) toast.info('Email не указан — уведомление не отправлено')
      setComment('')
      setDelayed(false)
      router.refresh()
    } else {
      const data = await res.json()
      toast.error(data.error ?? 'Ошибка сохранения')
    }
    setLoading(false)
  }

  async function toggleDelay() {
    setDelayBusy(true)
    const next = !delayed
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_delayed: next }),
    })
    if (res.ok) {
      setDelayed(next)
      toast[next ? 'warning' : 'success'](next ? 'Задержка отмечена' : 'Задержка снята')
      router.refresh()
    } else {
      toast.error('Ошибка')
    }
    setDelayBusy(false)
  }

  const changed = selected !== currentStatus

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Сменить статус</p>

      <div className="flex flex-col gap-1">
        {statuses.map((s) => (
          <button
            key={s.code}
            onClick={() => setSelected(s.code)}
            className={`text-left px-3 py-2 text-sm rounded border transition-colors ${
              selected === s.code
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            } ${s.code === currentStatus && selected !== s.code ? 'opacity-50' : ''}`}
          >
            {s.label}
            {s.code === currentStatus && (
              <span className="ml-2 text-xs opacity-60">— текущий</span>
            )}
          </button>
        ))}
      </div>

      {changed && (
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Комментарий (необязательно)"
          className="w-full border border-slate-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-slate-500"
        />
      )}

      <button
        onClick={handleSave}
        disabled={!changed || loading}
        className="w-full bg-slate-900 hover:bg-slate-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-sm py-2 rounded transition-colors"
      >
        {loading ? 'Сохранение...' : changed ? `Сохранить → ${currentLabel}` : 'Выберите статус'}
      </button>

      {/* Задержка */}
      <div className="pt-2 border-t border-slate-100">
        <button
          onClick={toggleDelay}
          disabled={delayBusy}
          className={`w-full text-sm py-2 rounded border transition-colors ${
            delayed
              ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700'
          }`}
        >
          {delayed ? '⚠ Задержка на этапе — снять' : 'Отметить задержку'}
        </button>
      </div>
    </div>
  )
}
