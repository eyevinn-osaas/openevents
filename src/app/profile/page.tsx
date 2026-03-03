import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUser, hasRole, requireRole } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { requestAccountDeletion, cancelAccountDeletionForUser } from '@/lib/accountDeletion'
import { AttendeeProfileForm } from '@/components/profile/AttendeeProfileForm'

type PageProps = {
  searchParams: Promise<{ deletion?: string | string[] }>
}

type DeletionNotice = 'requested' | 'scheduled' | 'cancelled' | 'invalid' | 'expired' | null

function firstQueryValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

function parseDeletionNotice(value: string | undefined): DeletionNotice {
  if (value === 'requested') return 'requested'
  if (value === 'scheduled') return 'scheduled'
  if (value === 'cancelled') return 'cancelled'
  if (value === 'invalid') return 'invalid'
  if (value === 'expired') return 'expired'
  return null
}

export default async function AttendeeProfilePage({ searchParams }: PageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (!hasRole(user.roles, 'ATTENDEE')) {
    redirect('/events')
  }

  const query = await searchParams
  const deletionNotice = parseDeletionNotice(firstQueryValue(query.deletion))

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      image: true,
      passwordHash: true,
      deletionRequestedAt: true,
      deletionScheduledFor: true,
    },
  })

  if (!dbUser) {
    redirect('/login')
  }

  async function deleteAccountAction(formData: FormData) {
    'use server'
    void formData

    const currentUser = await requireRole('ATTENDEE')

    const currentDbUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { passwordHash: true },
    })

    if (currentDbUser?.passwordHash) {
      const confirmPassword = String(formData.get('confirmPassword') || '')
      if (!confirmPassword) {
        throw new Error('Password confirmation is required to delete your account')
      }
      const isValid = await bcrypt.compare(confirmPassword, currentDbUser.passwordHash)
      if (!isValid) {
        throw new Error('Incorrect password')
      }
    }

    await requestAccountDeletion(currentUser.id)
    revalidatePath('/profile')
  }

  async function cancelDeletionAction(formData: FormData) {
    'use server'
    void formData

    const currentUser = await requireRole('ATTENDEE')
    await cancelAccountDeletionForUser(currentUser.id)
    revalidatePath('/profile')
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <AttendeeProfileForm
        initial={{
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName || '',
          lastName: dbUser.lastName || '',
          image: dbUser.image || '',
        }}
        deleteAccountAction={deleteAccountAction}
        cancelDeletionAction={cancelDeletionAction}
        deletionRequestedAt={dbUser.deletionRequestedAt}
        deletionScheduledFor={dbUser.deletionScheduledFor}
        deletionNotice={deletionNotice}
      />
    </div>
  )
}
