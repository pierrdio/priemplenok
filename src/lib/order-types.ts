export type OrderStatus = string

export interface OrderItem {
  id: number
  order_id: string
  film_title: string
  description: string | null
  sort_order: number
}

export interface Order {
  id: string
  box_number: string
  client_name: string
  client_email: string | null
  received_at: string
  status: OrderStatus
  updated_at: string
  notes: string | null
  is_delayed: boolean
  items: OrderItem[]
}

export interface StatusConfig {
  code: string
  label: string
  color: string
  step_color: string
  sort_order: number
  notify_client: boolean
}

export function getStatusLabel(code: string, statuses: StatusConfig[]): string {
  return statuses.find((s) => s.code === code)?.label ?? code
}

export function getStatusColor(code: string, statuses: StatusConfig[]): string {
  return (
    statuses.find((s) => s.code === code)?.color ??
    'bg-slate-50 text-slate-500 border border-slate-200'
  )
}

export function getStepColor(code: string, statuses: StatusConfig[]): string {
  return statuses.find((s) => s.code === code)?.step_color ?? 'bg-slate-400'
}
