import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client.ts'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const STATUSES = [
  {
    code: 'coordinating',
    label: 'Согласование',
    color: 'bg-slate-50 text-slate-700 border border-slate-200',
    step_color: 'bg-slate-600',
    sort_order: 1,
    notify_client: false,
  },
  {
    code: 'accepted',
    label: 'Принятие',
    color: 'bg-sky-50 text-sky-800 border border-sky-200',
    step_color: 'bg-sky-600',
    sort_order: 2,
    notify_client: true,
  },
  {
    code: 'in_lab',
    label: 'Материал в лаборатории',
    color: 'bg-blue-50 text-blue-800 border border-blue-200',
    step_color: 'bg-blue-600',
    sort_order: 3,
    notify_client: false,
  },
  {
    code: 'developing',
    label: 'Передан на проявку',
    color: 'bg-amber-50 text-amber-800 border border-amber-200',
    step_color: 'bg-amber-500',
    sort_order: 4,
    notify_client: false,
  },
  {
    code: 'inspection',
    label: 'Просмотр на дефекты',
    color: 'bg-orange-50 text-orange-800 border border-orange-200',
    step_color: 'bg-orange-500',
    sort_order: 5,
    notify_client: false,
  },
  {
    code: 'defect_report',
    label: 'Дефектная ведомость',
    color: 'bg-red-50 text-red-800 border border-red-200',
    step_color: 'bg-red-500',
    sort_order: 6,
    notify_client: false,
  },
  {
    code: 'ultrasonic',
    label: 'Ультразвуковая чистка',
    color: 'bg-purple-50 text-purple-800 border border-purple-200',
    step_color: 'bg-purple-500',
    sort_order: 7,
    notify_client: false,
  },
  {
    code: 'order_desk',
    label: 'Стол заказов',
    color: 'bg-indigo-50 text-indigo-800 border border-indigo-200',
    step_color: 'bg-indigo-500',
    sort_order: 8,
    notify_client: false,
  },
  {
    code: 'scanning',
    label: 'Сканирование',
    color: 'bg-teal-50 text-teal-800 border border-teal-200',
    step_color: 'bg-teal-500',
    sort_order: 9,
    notify_client: false,
  },
  {
    code: 'ready_download',
    label: 'Готов к скачиванию',
    color: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    step_color: 'bg-emerald-600',
    sort_order: 10,
    notify_client: true,
  },
  {
    code: 'ready_pickup',
    label: 'Готов к выдаче',
    color: 'bg-green-100 text-green-800 border border-green-300',
    step_color: 'bg-green-600',
    sort_order: 11,
    notify_client: true,
  },
]

const USERS = [
  { username: 'admin',       password: 'admin123',       role: 'admin' },
  { username: 'coordinator', password: 'coordinator123', role: 'coordinator' },
  { username: 'lab',         password: 'lab123',         role: 'lab' },
  { username: 'scanner',     password: 'scanner123',     role: 'scanner' },
]

async function main() {
  for (const status of STATUSES) {
    await prisma.statusConfig.upsert({
      where: { code: status.code },
      update: status,
      create: status,
    })
  }
  console.log(`Seeded ${STATUSES.length} statuses`)

  for (const u of USERS) {
    const hash = await bcrypt.hash(u.password, 12)
    await prisma.user.upsert({
      where: { username: u.username },
      update: { password_hash: hash, role: u.role },
      create: { username: u.username, password_hash: hash, role: u.role },
    })
    console.log(`Upserted user: ${u.username} (${u.role}) — password: ${u.password}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
