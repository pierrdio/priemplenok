import { getSession } from '@/lib/auth'
import nodemailer from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { email } = await request.json()
  if (!email) return Response.json({ error: 'Email не указан' }, { status: 400 })

  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) {
    return Response.json({ error: 'SMTP не настроен в .env.local' }, { status: 500 })
  }

  const port = parseInt(process.env.SMTP_PORT ?? '465')
  const options = {
    host, port,
    secure: port === 465,
    family: 4,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  } satisfies SMTPTransport.Options & { family?: number }

  try {
    const transporter = nodemailer.createTransport(options)
    await transporter.sendMail({
      from: `"Госфильмофонд" <${process.env.SMTP_FROM ?? user}>`,
      to: email,
      subject: 'Тест SMTP — Госфильмофонд',
      text: 'Это тестовое письмо. SMTP настроен корректно.',
    })
    return Response.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message }, { status: 500 })
  }
}
