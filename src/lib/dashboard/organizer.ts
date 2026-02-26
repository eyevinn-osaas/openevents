import { prisma } from '@/lib/db'
import { requireRole, hasRole } from '@/lib/auth'
import { Prisma } from '@prisma/client'

type OrganizerProfile = {
  id: string
  orgName: string
  description: string | null
  logo: string | null
  website: string | null
  socialLinks: Prisma.JsonValue
}

type RequireOrganizerResult = {
  user: Awaited<ReturnType<typeof requireRole>>
  organizerProfile: OrganizerProfile | null
  isSuperAdmin: boolean
}

export async function requireOrganizerProfile(): Promise<RequireOrganizerResult> {
  const user = await requireRole(['ORGANIZER', 'SUPER_ADMIN'])
  const isSuperAdmin = hasRole(user.roles, 'SUPER_ADMIN')

  const organizerProfile = await prisma.organizerProfile.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      orgName: true,
      description: true,
      logo: true,
      website: true,
      socialLinks: true,
    },
  })

  // Super admins don't need an organizer profile
  if (!organizerProfile && !isSuperAdmin) {
    throw new Error('Forbidden: Organizer profile not found')
  }

  return { user, organizerProfile, isSuperAdmin }
}

/**
 * Build a Prisma where clause for events that respects ownership.
 * Super admins can access all events, organizers only their own.
 */
export function buildEventWhereClause(
  organizerProfile: OrganizerProfile | null,
  isSuperAdmin: boolean,
  additionalWhere: Prisma.EventWhereInput = {}
): Prisma.EventWhereInput {
  const where: Prisma.EventWhereInput = {
    deletedAt: null,
    ...additionalWhere,
  }

  // Only filter by organizerId for non-super-admins
  if (!isSuperAdmin && organizerProfile) {
    where.organizerId = organizerProfile.id
  }

  return where
}

/**
 * Check if the current user can access an event.
 * Returns the event if access is granted, null otherwise.
 */
export async function canAccessEvent(eventId: string) {
  const { organizerProfile, isSuperAdmin } = await requireOrganizerProfile()

  const where = buildEventWhereClause(organizerProfile, isSuperAdmin, { id: eventId })

  const event = await prisma.event.findFirst({
    where,
    select: { id: true },
  })

  return { event, organizerProfile, isSuperAdmin }
}
