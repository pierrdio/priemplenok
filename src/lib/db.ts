import { cache } from 'react'
import { prisma } from './prisma'
import type { OrderStatus, StatusConfig, Order, OrderItem } from './order-types'

export type { OrderStatus, StatusConfig, Order, OrderItem }
export { getStatusLabel, getStatusColor, getStepColor } from './order-types'

export interface StatusHistoryEntry {
  id: number
  order_id: string
  status: OrderStatus
  comment: string | null
  updated_by: string
  updated_at: string
}

type PrismaOrderRow = {
  id: string
  box_number: string
  client_name: string
  client_email: string | null
  received_at: Date
  status: string
  updated_at: Date
  notes: string | null
  is_delayed: boolean
  items?: Array<{ id: number; order_id: string; film_title: string; description: string | null; sort_order: number }>
}

function toOrder(r: PrismaOrderRow): Order {
  return {
    id: r.id,
    box_number: r.box_number,
    client_name: r.client_name,
    client_email: r.client_email,
    received_at: r.received_at.toISOString(),
    status: r.status as OrderStatus,
    updated_at: r.updated_at.toISOString(),
    notes: r.notes,
    is_delayed: r.is_delayed,
    items: (r.items ?? []).map((i) => ({
      id: i.id,
      order_id: i.order_id,
      film_title: i.film_title,
      description: i.description,
      sort_order: i.sort_order,
    })),
  }
}

function toHistory(r: {
  id: number
  order_id: string
  status: string
  comment: string | null
  updated_by: string
  updated_at: Date
}): StatusHistoryEntry {
  return {
    ...r,
    status: r.status as OrderStatus,
    updated_at: r.updated_at.toISOString(),
  }
}

const ITEMS_ORDER = { orderBy: { sort_order: 'asc' } } as const

export const getAllStatuses = cache(async (): Promise<StatusConfig[]> => {
  const rows = await prisma.statusConfig.findMany({ orderBy: { sort_order: 'asc' } })
  return rows.map((r) => ({
    code: r.code,
    label: r.label,
    color: r.color,
    step_color: r.step_color,
    sort_order: r.sort_order,
    notify_client: r.notify_client,
  }))
})

export async function createOrder(
  order: Omit<Order, 'updated_at' | 'items' | 'is_delayed'>,
  items: { film_title: string; description?: string }[],
): Promise<Order> {
  const created = await prisma.order.create({
    data: {
      id: order.id,
      box_number: order.box_number,
      client_name: order.client_name,
      client_email: order.client_email,
      received_at: new Date(order.received_at),
      status: order.status,
      notes: order.notes,
      history: {
        create: {
          status: order.status,
          comment: 'Заказ принят',
          updated_by: 'system',
        },
      },
      items: {
        create: items.map((item, idx) => ({
          film_title: item.film_title,
          description: item.description ?? null,
          sort_order: idx,
        })),
      },
    },
    include: { items: ITEMS_ORDER },
  })
  return toOrder(created)
}

export async function getOrderById(id: string): Promise<Order | null> {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: ITEMS_ORDER },
  })
  return order ? toOrder(order) : null
}

export async function getAllOrders(): Promise<Order[]> {
  const orders = await prisma.order.findMany({
    orderBy: { received_at: 'desc' },
    include: { items: ITEMS_ORDER },
  })
  return orders.map(toOrder)
}

export async function updateOrderInfo(
  id: string,
  data: { client_name: string; client_email: string | null; notes: string | null },
): Promise<Order | null> {
  const current = await prisma.order.findUnique({ where: { id } })
  if (!current || current.status !== 'coordinating') return null
  const updated = await prisma.order.update({
    where: { id },
    data: {
      client_name: data.client_name,
      client_email: data.client_email,
      notes: data.notes,
    },
    include: { items: ITEMS_ORDER },
  })
  return toOrder(updated)
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  updatedBy: string,
  comment?: string
): Promise<Order | null> {
  const updated = await prisma.order.update({
    where: { id },
    data: {
      status,
      is_delayed: false,
      history: {
        create: {
          status,
          comment: comment ?? null,
          updated_by: updatedBy,
        },
      },
    },
    include: { items: ITEMS_ORDER },
  })
  return toOrder(updated)
}

export async function setOrderDelay(id: string, isDelayed: boolean): Promise<Order | null> {
  const updated = await prisma.order.update({
    where: { id },
    data: { is_delayed: isDelayed },
    include: { items: ITEMS_ORDER },
  })
  return toOrder(updated)
}

export async function getStatusHistory(orderId: string): Promise<StatusHistoryEntry[]> {
  const entries = await prisma.statusHistory.findMany({
    where: { order_id: orderId },
    orderBy: { updated_at: 'asc' },
  })
  return entries.map(toHistory)
}

export async function deleteOrder(id: string): Promise<void> {
  await prisma.order.delete({ where: { id } })
}

export async function addOrderItem(
  orderId: string,
  filmTitle: string,
  description?: string,
): Promise<OrderItem> {
  const last = await prisma.orderItem.findFirst({
    where: { order_id: orderId },
    orderBy: { sort_order: 'desc' },
  })
  const item = await prisma.orderItem.create({
    data: {
      order_id: orderId,
      film_title: filmTitle,
      description: description ?? null,
      sort_order: (last?.sort_order ?? -1) + 1,
    },
  })
  return item
}

export async function updateOrderItem(
  itemId: number,
  filmTitle: string,
  description?: string,
): Promise<OrderItem> {
  return prisma.orderItem.update({
    where: { id: itemId },
    data: { film_title: filmTitle, description: description ?? null },
  })
}

export async function deleteOrderItem(itemId: number): Promise<void> {
  await prisma.orderItem.delete({ where: { id: itemId } })
}

export interface ActivityLogEntry {
  id: number
  order_id: string
  box_number: string
  client_name: string
  status: OrderStatus
  comment: string | null
  updated_by: string
  updated_at: string
}

export async function getAllActivityLogs(limit = 200): Promise<ActivityLogEntry[]> {
  const entries = await prisma.statusHistory.findMany({
    orderBy: { updated_at: 'desc' },
    take: limit,
    include: { order: { select: { box_number: true, client_name: true } } },
  })
  return entries.map((e) => ({
    id: e.id,
    order_id: e.order_id,
    box_number: e.order.box_number,
    client_name: e.order.client_name,
    status: e.status as OrderStatus,
    comment: e.comment,
    updated_by: e.updated_by,
    updated_at: e.updated_at.toISOString(),
  }))
}

export async function getAllOrdersWithHistory() {
  const orders = await prisma.order.findMany({
    orderBy: { received_at: 'desc' },
    include: {
      history: { orderBy: { updated_at: 'asc' } },
      items: ITEMS_ORDER,
    },
  })
  return orders.map((o) => ({
    ...toOrder(o),
    history: o.history.map(toHistory),
  }))
}

export interface UserRecord {
  id: number
  username: string
  role: string
  created_at: string
}

export async function getAllUsers(): Promise<UserRecord[]> {
  const rows = await prisma.user.findMany({ orderBy: { id: 'asc' } })
  return rows.map((u) => ({ id: u.id, username: u.username, role: u.role, created_at: u.created_at.toISOString() }))
}

export async function updateUserRole(id: number, role: string): Promise<UserRecord> {
  const u = await prisma.user.update({ where: { id }, data: { role } })
  return { id: u.id, username: u.username, role: u.role, created_at: u.created_at.toISOString() }
}

export async function generateBoxNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const result = await prisma.$queryRaw<[{ last_number: number }]>`
    INSERT INTO order_counters (year, last_number)
    VALUES (${year}, 1)
    ON CONFLICT (year) DO UPDATE
      SET last_number = order_counters.last_number + 1
    RETURNING last_number
  `
  const num = result[0].last_number
  return `${year}-${String(num).padStart(3, '0')}`
}
