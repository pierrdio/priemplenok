import { auth } from '@/auth'

export interface Session {
  username: string
  role: string
}

export async function getSession(): Promise<Session | null> {
  const session = await auth()
  if (!session?.user?.name) return null
  return {
    username: session.user.name,
    role: ((session.user as { role?: string }).role) ?? 'admin',
  }
}
