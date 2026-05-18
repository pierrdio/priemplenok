import fs from 'fs'
import path from 'path'
import { prisma } from './prisma'

interface DelayConfig {
  default_hours: number
  statuses: Record<string, number | null>
}

function getConfig(): DelayConfig {
  const file = path.join(process.cwd(), 'config', 'delays.json')
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as DelayConfig
}

export async function markDelayedOrders(): Promise<void> {
  const config = getConfig()

  const orders = await prisma.order.findMany({
    where: { is_delayed: false },
    include: { history: { orderBy: { updated_at: 'desc' }, take: 1 } },
  })

  const now = Date.now()
  const toMark: string[] = []

  for (const order of orders) {
    const last = order.history[0]
    if (!last) continue

    const thresholdHours = order.status in config.statuses
      ? config.statuses[order.status]
      : config.default_hours
    if (thresholdHours === null || thresholdHours <= 0) continue

    const elapsedHours = (now - last.updated_at.getTime()) / 3_600_000

    if (elapsedHours >= thresholdHours) {
      toMark.push(order.id)
    }
  }

  if (toMark.length > 0) {
    await prisma.order.updateMany({
      where: { id: { in: toMark } },
      data: { is_delayed: true },
    })
  }
}
