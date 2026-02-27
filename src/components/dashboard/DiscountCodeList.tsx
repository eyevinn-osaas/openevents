'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toaster'

type DiscountCode = {
  id: string
  code: string
  discountType: string
  discountValue: number
  usedCount: number
  maxUses: number | null
  isActive: boolean
}

type DiscountCodeListProps = {
  discountCodes: DiscountCode[]
  deleteAction: (formData: FormData) => Promise<void>
}

export function DiscountCodeList({ discountCodes, deleteAction }: DiscountCodeListProps) {
  const showToast = useToast()
  const [pendingDelete, setPendingDelete] = useState<DiscountCode | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleConfirmDelete() {
    if (!pendingDelete) return
    const formData = new FormData()
    formData.append('discountCodeId', pendingDelete.id)
    startTransition(async () => {
      try {
        await deleteAction(formData)
        showToast('Discount code deleted')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not delete the discount code. Please try again.'
        showToast(message, 'error')
      } finally {
        setPendingDelete(null)
      }
    })
  }

  return (
    <>
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Discount Codes</h2>
        {discountCodes.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600">No discount codes configured.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {discountCodes.map((discountCode) => (
              <div key={discountCode.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 p-3">
                <div>
                  <p className="font-medium text-gray-900">{discountCode.code}</p>
                  <p className="text-sm text-gray-600">
                    {discountCode.discountType} · Value: {discountCode.discountValue} · Tickets used: {discountCode.usedCount}/{discountCode.maxUses ?? 'Unlimited'} · {discountCode.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setPendingDelete(discountCode)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete discount code "${pendingDelete?.code}"?`}
        description="This will permanently delete the discount code. Any attendees who have already used it will not be affected."
        confirmLabel="Delete Code"
        isLoading={isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </>
  )
}
