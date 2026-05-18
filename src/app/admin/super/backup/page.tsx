'use client'

import { useState, useRef } from 'react'

export default function SuperAdminBackupPage() {
  const [smtpEmail, setSmtpEmail] = useState('')
  const [smtpStatus, setSmtpStatus] = useState<{ ok?: boolean; error?: string } | null>(null)
  const [smtpLoading, setSmtpLoading] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<{
    imported?: number; skipped?: number; errors?: string[]; error?: string
  } | null>(null)
  const [importLoading, setImportLoading] = useState(false)

  async function handleSmtpTest(e: React.FormEvent) {
    e.preventDefault()
    setSmtpLoading(true)
    setSmtpStatus(null)
    try {
      const res = await fetch('/api/admin/smtp-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: smtpEmail }),
      })
      const data = await res.json()
      setSmtpStatus(res.ok ? { ok: true } : { error: data.error })
    } catch {
      setSmtpStatus({ error: 'Сетевая ошибка' })
    } finally {
      setSmtpLoading(false)
    }
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setImportLoading(true)
    setImportStatus(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/import', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) {
        setImportStatus({ error: data.error })
      } else {
        setImportStatus(data)
        if (fileRef.current) fileRef.current.value = ''
      }
    } catch {
      setImportStatus({ error: 'Сетевая ошибка' })
    } finally {
      setImportLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-5 py-6 space-y-6">

      {/* Экспорт */}
      <div className="bg-white border border-slate-200 rounded p-5">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Экспорт</p>
        <p className="text-sm text-slate-500 mb-4">Скачать все заказы и историю изменений.</p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/api/admin/backup?format=json"
            download
            className="bg-slate-900 hover:bg-slate-700 text-white text-sm px-4 py-2 rounded transition-colors"
          >
            Скачать JSON
          </a>
          <a
            href="/api/admin/backup?format=csv"
            download
            className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm px-4 py-2 rounded transition-colors"
          >
            Скачать CSV
          </a>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          JSON — полный архив с историей. CSV — только заказы, подходит для Excel.
        </p>
      </div>

      {/* Импорт */}
      <div className="bg-white border border-slate-200 rounded p-5">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Импорт</p>
        <p className="text-sm text-slate-500 mb-4">
          Восстановление из JSON-резервной копии. Существующие заказы не перезаписываются.
        </p>
        <form onSubmit={handleImport} className="flex gap-2 flex-wrap items-center">
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            required
            className="text-sm text-slate-600 file:mr-3 file:border-0 file:bg-slate-100 file:hover:bg-slate-200 file:text-slate-700 file:text-xs file:px-3 file:py-1.5 file:rounded file:cursor-pointer"
          />
          <button
            type="submit"
            disabled={importLoading}
            className="bg-slate-900 hover:bg-slate-700 disabled:bg-slate-300 text-white text-sm px-4 py-2 rounded transition-colors"
          >
            {importLoading ? 'Импорт...' : 'Загрузить'}
          </button>
        </form>
        {importStatus?.error && (
          <p className="text-sm text-red-500 mt-2">{importStatus.error}</p>
        )}
        {importStatus?.imported !== undefined && (
          <div className="mt-3 space-y-1">
            <p className="text-sm text-emerald-600">
              Импортировано: {importStatus.imported} · Пропущено: {importStatus.skipped}
            </p>
            {importStatus.errors && importStatus.errors.length > 0 && (
              <div className="text-xs text-red-400 space-y-0.5">
                {importStatus.errors.map((e, i) => <p key={i}>{e}</p>)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Тест SMTP */}
      <div className="bg-white border border-slate-200 rounded p-5">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Тест почты</p>
        <p className="text-sm text-slate-500 mb-4">Отправить тестовое письмо для проверки SMTP настроек.</p>
        <form onSubmit={handleSmtpTest} className="flex gap-2 flex-wrap">
          <input
            type="email"
            value={smtpEmail}
            onChange={(e) => setSmtpEmail(e.target.value)}
            placeholder="Куда отправить"
            required
            className="border border-slate-300 px-3 py-2 text-sm rounded focus:outline-none focus:border-slate-500 w-64"
          />
          <button
            type="submit"
            disabled={smtpLoading}
            className="bg-slate-900 hover:bg-slate-700 disabled:bg-slate-300 text-white text-sm px-4 py-2 rounded transition-colors"
          >
            {smtpLoading ? 'Отправка...' : 'Отправить'}
          </button>
        </form>
        {smtpStatus?.ok && (
          <p className="text-sm text-emerald-600 mt-2">Письмо отправлено успешно</p>
        )}
        {smtpStatus?.error && (
          <p className="text-sm text-red-500 mt-2">{smtpStatus.error}</p>
        )}
      </div>

    </div>
  )
}
