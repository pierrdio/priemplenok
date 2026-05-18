'use client'

import Link from 'next/link'
import Image from 'next/image'
import { signOut } from 'next-auth/react'

export default function AdminNav({ username, isAdmin, canCreate }: { username: string; isAdmin: boolean; canCreate: boolean }) {
  async function handleLogout() {
    await signOut({ callbackUrl: '/admin/login' })
  }

  return (
    <header className="bg-slate-900 text-white px-4 py-0">
      <div className="max-w-5xl mx-auto flex items-stretch justify-between h-16">
        <div className="flex items-stretch min-w-0">
          <Link
            href="/admin"
            className="flex items-center pr-4 sm:pr-6 border-r border-slate-700 shrink-0"
          >
            <Image src="/logo-header.png" alt="Госфильмофонд" height={40} width={66} className="object-contain brightness-0 invert" />
          </Link>
          <nav className="flex items-stretch">
            <Link
              href="/admin"
              className="flex items-center px-3 sm:px-5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Заказы
            </Link>
            {canCreate && (
              <Link
                href="/admin/order/new"
                className="flex items-center px-3 sm:px-5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <span className="hidden sm:inline">Новый заказ</span>
                <span className="sm:hidden">+ Новый</span>
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin/super"
                className="flex items-center px-3 sm:px-5 text-sm text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <span className="hidden sm:inline">Система</span>
                <span className="sm:hidden">⚙</span>
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs text-slate-400">{username}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Выйти
          </button>
        </div>
      </div>
    </header>
  )
}
