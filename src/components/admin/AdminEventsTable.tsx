'use client'

import Link from 'next/link'
import { EventStatus } from '@prisma/client'
import { EventStatusBadge } from '@/components/dashboard/EventStatusBadge'
import { formatDateTime } from '@/lib/utils'

type AdminEventsTableProps = {
  events: Array<{
    id: string
    slug: string
    title: string
    startDate: Date
    endDate: Date
    status: EventStatus
    visibility: 'PUBLIC' | 'PRIVATE'
    organizer: {
      orgName: string
      user: {
        email: string
      }
    }
    _count: {
      orders: number
      ticketTypes: number
    }
  }>
}

export function AdminEventsTable({ events }: AdminEventsTableProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
        No events match the current filters.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Event</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Organizer</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Orders</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events.map((event) => (
              <tr key={event.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{event.title}</p>
                  <p className="text-xs text-gray-500">{event.visibility}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{event.organizer.orgName}</p>
                  <p className="text-xs text-gray-500">{event.organizer.user.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-700">{formatDateTime(event.startDate)}</td>
                <td className="px-4 py-3">
                  <EventStatusBadge status={event.status} />
                </td>
                <td className="px-4 py-3 text-gray-700">{event._count.orders}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/events/${event.slug}`}
                      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
