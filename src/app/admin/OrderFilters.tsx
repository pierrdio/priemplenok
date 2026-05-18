'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useRef } from 'react'
import type { StatusConfig } from '@/lib/order-types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function OrderFilters({
  q,
  status,
  delayed,
  statuses,
}: {
  q: string
  status: string
  delayed: boolean
  statuses: StatusConfig[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams()
    const merged = {
      q,
      status: status || 'all',
      delayed: delayed ? 'true' : '',
      page: '1',
      ...overrides,
    }
    if (merged.q) params.set('q', merged.q)
    if (merged.status && merged.status !== 'all') params.set('status', merged.status)
    if (merged.delayed === 'true') params.set('delayed', 'true')
    if (merged.page && merged.page !== '1') params.set('page', merged.page)
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  function handleSearch(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl({ q: value }))
    }, 300)
  }

  function handleStatus(value: string | null) {
    router.push(buildUrl({ status: value ?? 'all' }))
  }

  function toggleDelayed() {
    router.push(buildUrl({ delayed: delayed ? '' : 'true' }))
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <input
        type="search"
        defaultValue={q}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Поиск по номеру или клиенту..."
        className="w-full sm:w-56 border border-input bg-white px-3 py-1.5 text-sm rounded-lg focus:outline-none focus:border-ring h-8"
      />

      <Select value={status || 'all'} onValueChange={handleStatus}>
        <SelectTrigger size="default" className="min-w-44 bg-white">
          <SelectValue>
            {!status || status === 'all'
              ? 'Все статусы'
              : (statuses.find((s) => s.code === status)?.label ?? status)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value="all">Все статусы</SelectItem>
          {statuses.map((s) => (
            <SelectItem key={s.code} value={s.code}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <button
        onClick={toggleDelayed}
        className={`h-8 px-3 text-xs rounded-lg border transition-colors whitespace-nowrap ${
          delayed
            ? 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200'
            : 'bg-white text-slate-500 border-input hover:border-slate-400 hover:text-slate-700'
        }`}
      >
        ⚠ С задержкой
      </button>
    </div>
  )
}
