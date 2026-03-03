'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toaster'
import { formatCurrency } from '@/lib/utils'

type TicketType = {
  id: string
  name: string
  price: number
  currency: string
  soldCount: number
  maxCapacity: number | null
  isVisible: boolean
}

type TicketTypeListProps = {
  ticketTypes: TicketType[]
  deleteAction: (formData: FormData) => Promise<void>
}

export function TicketTypeList({ ticketTypes, deleteAction }: TicketTypeListProps) {
  const showToast = useToast()
  const [pendingDelete, setPendingDelete] = useState<TicketType | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleConfirmDelete() {
    if (!pendingDelete) return
    const formData = new FormData()
    formData.append('ticketTypeId', pendingDelete.id)
    startTransition(async () => {
      try {
        await deleteAction(formData)
        showToast('Ticket type deleted')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not delete the ticket type. Please try again.'
        showToast(message, 'error')
      } finally {
        setPendingDelete(null)
      }
    })
  }

  return (
    <>
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Ticket Types</h2>
        {ticketTypes.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600">No ticket types configured.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {ticketTypes.map((ticketType) => (
              <div key={ticketType.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 p-3">
                <div>
                  <p className="font-medium text-gray-900">{ticketType.name}</p>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(ticketType.price, ticketType.currency)} · Sold: {ticketType.soldCount} · Capacity: {ticketType.maxCapacity ?? 'Unlimited'} · {ticketType.isVisible ? 'Visible' : 'Hidden'}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setPendingDelete(ticketType)}
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
        title={`Delete "${pendingDelete?.name}"?`}
        description="This will permanently delete the ticket type. This cannot be undone."
        confirmLabel="Delete Ticket Type"
        isLoading={isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </>
  )
}
