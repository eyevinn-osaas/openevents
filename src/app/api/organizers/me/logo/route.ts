import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { getDownloadPresignedUrl } from '@/lib/storage'

function extractObjectKeyFromUrl(image: string): string | null {
  if (!image) return null

  if (!image.startsWith('http://') && !image.startsWith('https://')) {
    return image.replace(/^\/+/, '')
  }

  try {
    const parsed = new URL(image)
    const bucket = process.env.S3_BUCKET_NAME || 'openevents'
    const path = decodeURIComponent(parsed.pathname).replace(/^\/+/, '')

    if (path.startsWith(`${bucket}/`)) {
      return path.slice(bucket.length + 1)
    }

    if (
      path.startsWith('events/') ||
      path.startsWith('speakers/') ||
      path.startsWith('users/') ||
      path.startsWith('organizers/')
    ) {
      return path
    }

    if (parsed.host.startsWith(`${bucket}.`)) {
      return path
    }

    return null
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const user = await requireRole(['ORGANIZER', 'SUPER_ADMIN'])

    const profile = await prisma.organizerProfile.findUnique({
      where: { userId: user.id },
      select: { logo: true },
    })

    if (!profile?.logo) {
      return NextResponse.json({ error: 'Logo not found' }, { status: 404 })
    }

    const key = extractObjectKeyFromUrl(profile.logo)
    if (!key) {
      return NextResponse.json({ error: 'Invalid logo key' }, { status: 400 })
    }

    const signedUrl = await getDownloadPresignedUrl(key, 900)
    return NextResponse.redirect(signedUrl, {
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    console.error('Get organizer logo failed:', error)
    return NextResponse.json({ error: 'Failed to load logo' }, { status: 500 })
  }
}
