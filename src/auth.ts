import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Логин', type: 'text' },
        password: { label: 'Пароль', type: 'password' },
      },
      async authorize(credentials) {
        const username = credentials.username as string
        const password = credentials.password as string
        if (!username || !password) return null

        const user = await prisma.user.findUnique({ where: { username } })
        if (!user) return null

        const valid = await bcrypt.compare(password, user.password_hash)
        if (!valid) return null

        return { id: String(user.id), name: user.username, role: user.role }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as { role?: string }).role ?? 'admin'
      return token
    },
    session({ session, token }) {
      if (session.user) (session.user as { role?: string }).role = (token.role as string) ?? 'admin'
      return session
    },
  },
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin/login' },
  trustHost: true,
})
