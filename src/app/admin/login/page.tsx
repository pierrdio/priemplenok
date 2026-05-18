'use client'

import { useActionState } from 'react'
import { loginAction } from './actions'

export default function LoginPage() {
  const [error, action, pending] = useActionState(loginAction, '')

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <div className="mb-8">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Госфильмофонд России</p>
          <h1 className="text-white text-2xl font-semibold">Учёт плёнок</h1>
        </div>

        <form action={action} className="space-y-3 dark-form">
          <input
            type="text"
            name="username"
            className="w-full bg-slate-800 border border-slate-600 text-white placeholder-slate-500 px-3 py-2.5 text-sm rounded focus:outline-none focus:border-slate-400"
            placeholder="Логин"
            required
            autoFocus
            autoComplete="username"
          />
          <input
            type="password"
            name="password"
            className="w-full bg-slate-800 border border-slate-600 text-white placeholder-slate-500 px-3 py-2.5 text-sm rounded focus:outline-none focus:border-slate-400"
            placeholder="Пароль"
            required
            autoComplete="current-password"
          />

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-white hover:bg-slate-100 disabled:bg-slate-700 disabled:text-slate-400 text-slate-900 font-medium py-2.5 text-sm rounded transition-colors"
          >
            {pending ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}
