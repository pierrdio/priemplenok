'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function DeleteOrderButton({
  orderId,
  boxNumber,
}: {
  orderId: string
  boxNumber: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/admin')
      router.refresh()
    } else {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger className="text-xs text-red-500 hover:text-red-700 underline underline-offset-2 transition-colors">
        Удалить заказ
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить заказ № {boxNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            Заказ и вся история изменений будут удалены безвозвратно.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
          >
            {loading ? 'Удаление...' : 'Удалить'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
