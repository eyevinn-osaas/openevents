import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { AccountSettings } from '@/components/dashboard/AccountSettings'

// Email validation schema
const emailSchema = z.string().email('Invalid email format').min(1, 'Email is required')

export default async function AccountSettingsPage() {
  const user = await requireRole('ORGANIZER')

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      accounts: {
        select: {
          provider: true,
        },
      },
    },
  })

  if (!dbUser) {
    redirect('/login')
  }

  async function updateEmailAction(formData: FormData) {
    'use server'

    const currentUser = await requireRole('ORGANIZER')
    const rawEmail = String(formData.get('email') || '').trim().toLowerCase()

    // Validate email format
    const parseResult = emailSchema.safeParse(rawEmail)
    if (!parseResult.success) {
      throw new Error(parseResult.error.issues[0]?.message || 'Invalid email format')
    }

    const email = parseResult.data

    // Check if email is the same as current
    const currentDbUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { email: true },
    })

    if (currentDbUser?.email === email) {
      // No change needed
      return
    }

    // Check if email is already in use by another account
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser && existingUser.id !== currentUser.id) {
      throw new Error('This email address is already in use by another account')
    }

    // Update email
    // NOTE: For full security, this should trigger email re-verification.
    // A proper implementation would:
    // 1. Store email as pendingEmail with a verification token
    // 2. Send verification email to the new address
    // 3. Only update email after verification link is clicked
    // This requires schema changes (pendingEmail, pendingEmailToken fields)
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { email },
    })

    revalidatePath('/dashboard/settings/account')
  }

  async function changePasswordAction(formData: FormData) {
    'use server'

    const currentUser = await requireRole('ORGANIZER')
    const currentPassword = String(formData.get('currentPassword') || '')
    const newPassword = String(formData.get('newPassword') || '')

    if (!currentPassword || !newPassword) return

    const currentDbUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        passwordHash: true,
      },
    })

    if (!currentDbUser?.passwordHash) return

    const isValid = await bcrypt.compare(currentPassword, currentDbUser.passwordHash)
    if (!isValid) return

    const newHash = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { passwordHash: newHash },
    })

    revalidatePath('/dashboard/settings/account')
  }

  async function deleteAccountAction(formData: FormData) {
    'use server'

    const currentUser = await requireRole('ORGANIZER')
    const confirmPassword = String(formData.get('confirmPassword') || '')

    // Require password confirmation for account deletion
    const currentDbUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { passwordHash: true },
    })

    // If user has a password (not OAuth-only), require confirmation
    if (currentDbUser?.passwordHash) {
      if (!confirmPassword) {
        throw new Error('Password confirmation is required to delete your account')
      }

      const isValid = await bcrypt.compare(confirmPassword, currentDbUser.passwordHash)
      if (!isValid) {
        throw new Error('Incorrect password')
      }
    }

    await prisma.user.delete({
      where: { id: currentUser.id },
    })

    const cookieStore = await cookies()
    const sessionCookieNames = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'authjs.session-token',
      '__Secure-authjs.session-token',
    ]

    for (const cookieName of sessionCookieNames) {
      cookieStore.delete(cookieName)
    }

    redirect('/events')
  }

  return (
    <AccountSettings
      userEmail={dbUser.email}
      connectedAccounts={dbUser.accounts.map((account) => account.provider)}
      updateEmailAction={updateEmailAction}
      changePasswordAction={changePasswordAction}
      deleteAccountAction={deleteAccountAction}
    />
  )
}
