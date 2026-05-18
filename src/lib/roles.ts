import fs from 'fs'
import path from 'path'

export interface RoleConfig {
  code: string
  label: string
  can_create_orders: boolean
  statuses: string[]
}

export function canCreateOrders(role: string): boolean {
  const cfg = getRoles().find((r) => r.code === role)
  return cfg?.can_create_orders ?? false
}

export function getRoles(): RoleConfig[] {
  const file = path.join(process.cwd(), 'config', 'roles.json')
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as RoleConfig[]
}

export function getAllowedStatuses(role: string, allStatusCodes: string[]): string[] {
  const cfg = getRoles().find((r) => r.code === role)
  if (!cfg) return []
  if (cfg.statuses.includes('*')) return allStatusCodes
  return allStatusCodes.filter((s) => cfg.statuses.includes(s))
}

export function canChangeToStatus(role: string, status: string, allStatusCodes: string[]): boolean {
  return getAllowedStatuses(role, allStatusCodes).includes(status)
}
