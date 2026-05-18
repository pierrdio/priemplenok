import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

async function isAuthenticated(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET })
  return !!token
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!await isAuthenticated(request)) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  if (pathname.startsWith('/order/')) {
    if (await isAuthenticated(request)) {
      const id = pathname.replace('/order/', '').split('/')[0]
      return NextResponse.redirect(new URL(`/admin/order/${id}`, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/order/:path*'],
}
