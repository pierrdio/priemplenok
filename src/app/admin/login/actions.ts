'use server'

import { signIn } from '@/auth'

export async function loginAction(_prev: string, formData: FormData): Promise<string> {
  try {
    await signIn('credentials', {
      username: formData.get('username'),
      password: formData.get('password'),
      redirectTo: '/admin',
    })
  } catch (error) {
    const digest = (error as { digest?: string })?.digest ?? ''
    if (digest.startsWith('NEXT_REDIRECT')) {
      throw error
    }
    return 'Неверный логин или пароль'
  }
  return ''
}
