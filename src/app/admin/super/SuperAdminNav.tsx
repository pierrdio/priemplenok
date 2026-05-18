'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/admin/super', label: 'Обзор' },
  { href: '/admin/super/users', label: 'Пользователи' },
  { href: '/admin/super/logs', label: 'Логи' },
  { href: '/admin/super/backup', label: 'Резервная копия' },
]

export default function SuperAdminNav() {
  const pathname = usePathname()
  return (
    <div className="bg-slate-800 border-b border-slate-700">
      <div className="max-w-5xl mx-auto px-4 sm:px-5 flex h-10 items-stretch overflow-x-auto">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center px-4 text-xs whitespace-nowrap transition-colors border-b-2 ${
              pathname === link.href
                ? 'text-white border-white'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
