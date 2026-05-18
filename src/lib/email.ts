import nodemailer from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'
import { Order } from './db'

function getTransporter() {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) return null

  const port = parseInt(process.env.SMTP_PORT ?? '465')
  const options = {
    host,
    port,
    secure: port === 465,
    family: 4,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  } satisfies SMTPTransport.Options & { family?: number }
  return nodemailer.createTransport(options)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export async function sendOrderCreatedEmail(order: Order): Promise<{ sent: boolean; error?: string }> {
  if (!order.client_email) return { sent: false }

  const transporter = getTransporter()
  if (!transporter) return { sent: false, error: 'SMTP не настроен' }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const statusUrl = `${baseUrl}/order/${order.id}`
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER

  const html = `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f3f0;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e2e0;">

        <!-- Шапка -->
        <tr>
          <td style="background:#1e293b;padding:20px 28px;">
            <p style="margin:0;color:#94a3b8;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Госфильмофонд России</p>
            <p style="margin:4px 0 0;color:#ffffff;font-size:13px;">Проявка и сканирование киноматериалов</p>
          </td>
        </tr>

        <!-- Основное -->
        <tr>
          <td style="padding:28px;">
            <p style="margin:0 0 4px;color:#64748b;font-size:12px;">Заказ принят</p>
            <h1 style="margin:0 0 24px;font-size:22px;color:#0f172a;">
              Заказ&nbsp;<span style="font-family:monospace;">№&nbsp;${order.box_number}</span>
            </h1>

            <!-- Статус -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0 0 6px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Статус</p>
                  <p style="margin:0;font-size:18px;font-weight:bold;color:#0f172a;">Принято</p>
                  <p style="margin:8px 0 0;font-size:13px;color:#64748b;">Ваши материалы приняты в обработку. Вы получите уведомление при смене статуса.</p>
                </td>
              </tr>
            </table>

            <!-- Детали -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f1f5f9;margin-bottom:24px;">
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;width:140px;">Организация</td>
                <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;">${order.client_name}</td>
              </tr>
              ${order.items.length > 0 ? `
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;vertical-align:top;">Позиции</td>
                <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;">
                  ${order.items.map((it, i) => `<div style="margin-bottom:4px;">${i + 1}. ${it.film_title}${it.description ? ` <span style="color:#64748b;">(${it.description})</span>` : ''}</div>`).join('')}
                </td>
              </tr>` : ''}
              <tr>
                <td style="padding:10px 0;color:#64748b;font-size:13px;">Принято</td>
                <td style="padding:10px 0;font-size:13px;color:#0f172a;">${formatDate(order.received_at)}</td>
              </tr>
            </table>

            <!-- Кнопка -->
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#1e293b;">
                  <a href="${statusUrl}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:13px;font-weight:bold;text-decoration:none;">
                    Отслеживать статус заказа →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Подвал -->
        <tr>
          <td style="padding:16px 28px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;color:#94a3b8;font-size:11px;">
              Это автоматическое уведомление. Отвечать на это письмо не нужно.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`

  try {
    await transporter.sendMail({
      from: `"Госфильмофонд" <${from}>`,
      to: order.client_email,
      subject: `Заказ принят — Заказ № ${order.box_number}`,
      html,
    })
    return { sent: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[email] Ошибка отправки:', message)
    return { sent: false, error: message }
  }
}

export async function sendStatusEmail(order: Order, comment?: string, statusLabel?: string): Promise<{ sent: boolean; error?: string }> {
  if (!order.client_email) return { sent: false }

  const transporter = getTransporter()
  if (!transporter) return { sent: false, error: 'SMTP не настроен' }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const statusUrl = `${baseUrl}/order/${order.id}`
  const label = statusLabel ?? order.status
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER

  const html = `
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f3f0;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e2e0;">

        <!-- Шапка -->
        <tr>
          <td style="background:#1e293b;padding:20px 28px;">
            <p style="margin:0;color:#94a3b8;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Госфильмофонд России</p>
            <p style="margin:4px 0 0;color:#ffffff;font-size:13px;">Проявка и сканирование киноматериалов</p>
          </td>
        </tr>

        <!-- Основное -->
        <tr>
          <td style="padding:28px;">
            <p style="margin:0 0 4px;color:#64748b;font-size:12px;">Уведомление о смене статуса</p>
            <h1 style="margin:0 0 24px;font-size:22px;color:#0f172a;">
              Заказ&nbsp;<span style="font-family:monospace;">№&nbsp;${order.box_number}</span>
            </h1>

            <!-- Статус -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0 0 6px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Текущий статус</p>
                  <p style="margin:0;font-size:18px;font-weight:bold;color:#0f172a;">${label}</p>
                  ${comment ? `<p style="margin:8px 0 0;font-size:13px;color:#64748b;">${comment}</p>` : ''}
                </td>
              </tr>
            </table>

            <!-- Детали -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f1f5f9;margin-bottom:24px;">
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;width:140px;">Организация</td>
                <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;">${order.client_name}</td>
              </tr>
              ${order.items.length > 0 ? `
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:13px;vertical-align:top;">Позиции</td>
                <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;">
                  ${order.items.map((it, i) => `<div style="margin-bottom:4px;">${i + 1}. ${it.film_title}${it.description ? ` <span style="color:#64748b;">(${it.description})</span>` : ''}</div>`).join('')}
                </td>
              </tr>` : ''}
              <tr>
                <td style="padding:10px 0;color:#64748b;font-size:13px;">Обновлено</td>
                <td style="padding:10px 0;font-size:13px;color:#0f172a;">${formatDate(order.updated_at)}</td>
              </tr>
            </table>

            <!-- Кнопка -->
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#1e293b;">
                  <a href="${statusUrl}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:13px;font-weight:bold;text-decoration:none;">
                    Открыть страницу заказа →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Подвал -->
        <tr>
          <td style="padding:16px 28px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;color:#94a3b8;font-size:11px;">
              Это автоматическое уведомление. Отвечать на это письмо не нужно.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`

  try {
    await transporter.sendMail({
      from: `"Госфильмофонд" <${from}>`,
      to: order.client_email,
      subject: `Статус заказа обновлён — Заказ № ${order.box_number}`,
      html,
    })
    return { sent: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[email] Ошибка отправки:', message)
    return { sent: false, error: message }
  }
}
