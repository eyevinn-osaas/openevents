'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type EventStatusActionsProps = {
  eventId: string
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED'
}

export function EventStatusActions({ eventId, status }: EventStatusActionsProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loadingAction, setLoadingAction] = useState<'unpublish' | 'cancel' | 'delete' | null>(null)

  async function runAction(action: 'unpublish' | 'cancel' | 'delete') {
    setLoadingAction(action)
    setError(null)

    try {
      if (action === 'unpublish') {
        const res = await fetch(`/api/events/${eventId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'DRAFT' }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to unpublish event')
      }

      if (action === 'cancel') {
        const confirmed = window.confirm('Cancel this event? This will notify ticket holders.')
        if (!confirmed) {
          setLoadingAction(null)
          return
        }

        const res = await fetch(`/api/events/${eventId}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to cancel event')
      }

      if (action === 'delete') {
        const confirmed = window.confirm('Delete this event? This action cannot be undone.')
        if (!confirmed) {
          setLoadingAction(null)
          return
        }

        const res = await fetch(`/api/events/${eventId}`, {
          method: 'DELETE',
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to delete event')

        router.push('/dashboard/events')
        return
      }

      router.refresh()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Action failed')
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-gray-900">Publish Controls</h3>
      <p className="mt-1 text-sm text-gray-600">Current status: {status}</p>
      {status === 'DRAFT' ? (
        <p className="mt-1 text-sm text-blue-700">
          Use the <span className="font-semibold">Save and Publish</span> button in the form below.
        </p>
      ) : null}
      {error ? <p className="mt-2 whitespace-pre-line text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {status === 'PUBLISHED' ? (
          <Button variant="outline" isLoading={loadingAction === 'unpublish'} onClick={() => runAction('unpublish')}>
            Unpublish
          </Button>
        ) : null}
        {status === 'PUBLISHED' ? (
          <Button variant="destructive" isLoading={loadingAction === 'cancel'} onClick={() => runAction('cancel')}>
            Cancel Event
          </Button>
        ) : null}
        {status === 'DRAFT' || status === 'CANCELLED' ? (
          <Button variant="destructive" isLoading={loadingAction === 'delete'} onClick={() => runAction('delete')}>
            Delete Event
          </Button>
        ) : null}
      </div>
    </section>
  )
}
