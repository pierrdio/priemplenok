import React from 'react'
import path from 'path'
import fs from 'fs'
import QRCode from 'qrcode'
import { Document, Page, View, Text, Image, StyleSheet, Font, renderToBuffer } from '@react-pdf/renderer'
import { getOrderById } from '@/lib/db'
import type { Order } from '@/lib/order-types'

const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', 'Geist-Regular.ttf')

Font.register({
  family: 'Geist',
  fonts: [
    { src: FONT_PATH, fontWeight: 400 },
    { src: FONT_PATH, fontWeight: 700 },
  ],
})

const S = StyleSheet.create({
  page: { padding: 28, fontFamily: 'Geist', fontSize: 9, color: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderBottomWidth: 1.5,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    paddingBottom: 11,
    marginBottom: 14,
  },
  orgName: { fontWeight: 700, fontSize: 10 },
  orgSub: { fontSize: 8, color: '#555', marginTop: 2 },
  body: { flexDirection: 'row', gap: 20 },
  qrWrap: { width: 92, alignItems: 'center' },
  qrImg: { width: 91, height: 91 },
  qrCaption: { fontSize: 6, color: '#666', marginTop: 5, textAlign: 'center' },
  info: { flex: 1 },
  row: { flexDirection: 'row', marginBottom: 6 },
  label: { color: '#555', width: '36%' },
  value: { flex: 1 },
  orderNum: { fontWeight: 700, fontSize: 14 },
  item: { marginBottom: 3 },
  itemDesc: { color: '#777' },
  notes: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'solid',
    borderRadius: 2,
    padding: 6,
    fontSize: 8,
    color: '#555',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    borderTopStyle: 'solid',
    marginTop: 14,
    paddingTop: 5,
    fontSize: 6,
    color: '#aaa',
  },
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function OrderPdf({ order, qrDataUrl, publicUrl, logoDataUrl }: {
  order: Order
  qrDataUrl: string
  publicUrl: string
  logoDataUrl: string | null
}) {
  return (
    <Document>
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          {logoDataUrl && (
            <Image src={logoDataUrl} style={{ height: 57, width: 'auto' }} />
          )}
          <View>
            <Text style={S.orgName}>ГОСФИЛЬМОФОНД РОССИИ</Text>
            <Text style={S.orgSub}>Отдел проявки и сканирования киноматериалов</Text>
          </View>
        </View>

        <View style={S.body}>
          <View style={S.qrWrap}>
            <Image src={qrDataUrl} style={S.qrImg} />
            <Text style={S.qrCaption}>Сканируйте для статуса</Text>
          </View>

          <View style={S.info}>
            <View style={S.row}>
              <Text style={S.label}>Заказ №</Text>
              <Text style={[S.value, S.orderNum]}>{order.box_number}</Text>
            </View>
            <View style={S.row}>
              <Text style={S.label}>Заказчик</Text>
              <Text style={[S.value, { fontWeight: 700 }]}>{order.client_name}</Text>
            </View>
            {order.items.length > 0 && (
              <View style={S.row}>
                <Text style={S.label}>Позиции</Text>
                <View style={S.value}>
                  {order.items.map((it, i) => (
                    <Text key={it.id} style={S.item}>
                      {i + 1}. {it.film_title}
                      {it.description ? <Text style={S.itemDesc}> ({it.description})</Text> : null}
                    </Text>
                  ))}
                </View>
              </View>
            )}
            <View style={S.row}>
              <Text style={S.label}>Принято</Text>
              <Text style={S.value}>{formatDate(order.received_at)}</Text>
            </View>
            {order.notes && (
              <View style={S.notes}>
                <Text>{order.notes}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={S.footer}>
          <Text>{publicUrl}</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrderById(id)
  if (!order) return new Response('Not found', { status: 404 })
  if (order.status === 'coordinating') return new Response('Forbidden', { status: 403 })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const publicUrl = `${baseUrl}/order/${id}`

  const [qrDataUrl, logoDataUrl] = await Promise.all([
    QRCode.toDataURL(publicUrl, { width: 260, margin: 1, color: { dark: '#000000', light: '#ffffff' } }),
    (async () => {
      const logoPath = path.join(process.cwd(), 'public', 'logo.png')
      if (!fs.existsSync(logoPath)) return null
      const buf = fs.readFileSync(logoPath)
      return `data:image/png;base64,${buf.toString('base64')}`
    })(),
  ])

  const buffer = await renderToBuffer(
    <OrderPdf order={order} qrDataUrl={qrDataUrl} publicUrl={publicUrl} logoDataUrl={logoDataUrl} />
  )

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="order-${order.box_number}.pdf"`,
    },
  })
}
