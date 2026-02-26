import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/auth'

const roleUpdateSchema = z.object({
  action: z.enum(['promote', 'demote']),
})

// POST: Update user role (promote to ORGANIZER or demote)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole('SUPER_ADMIN')

    const { id } = await params
    const body = await request.json()

    // Validate input
    const validationResult = roleUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'Please provide a valid action (promote or demote).',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { action } = validationResult.data

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: {
        roles: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Not found', message: 'User not found.' },
        { status: 404 }
      )
    }

    // Prevent self-modification
    if (user.id === admin.id) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You cannot modify your own role.' },
        { status: 403 }
      )
    }

    const hasOrganizerRole = user.roles.some((r) => r.role === 'ORGANIZER')

    if (action === 'promote') {
      if (hasOrganizerRole) {
        return NextResponse.json(
          { error: 'Already organizer', message: 'User is already an organizer.' },
          { status: 400 }
        )
      }

      // Promote user to ORGANIZER in a transaction
      await prisma.$transaction(async (tx) => {
        // Grant ORGANIZER role
        await tx.userRole.create({
          data: {
            userId: user.id,
            role: 'ORGANIZER',
            grantedBy: admin.id,
          },
        })

        // Check if organizer profile exists
        const existingProfile = await tx.organizerProfile.findUnique({
          where: { userId: user.id },
        })

        // Create organizer profile if it doesn't exist
        if (!existingProfile) {
          const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
          await tx.organizerProfile.create({
            data: {
              userId: user.id,
              orgName: userName || user.email,
              description: '',
            },
          })
        }
      })

      return NextResponse.json({
        success: true,
        message: 'User promoted to organizer successfully.',
      })
    } else {
      // Demote: remove ORGANIZER role
      if (!hasOrganizerRole) {
        return NextResponse.json(
          { error: 'Not an organizer', message: 'User is not an organizer.' },
          { status: 400 }
        )
      }

      // Remove ORGANIZER role (keep profile for data retention)
      await prisma.userRole.deleteMany({
        where: {
          userId: user.id,
          role: 'ORGANIZER',
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Organizer role removed successfully.',
      })
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Please sign in to continue.' },
          { status: 401 }
        )
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'You do not have permission.' },
          { status: 403 }
        )
      }
    }

    console.error('Update user role error:', error)
    return NextResponse.json(
      { error: 'Request failed', message: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}
