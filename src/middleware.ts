/**
 * Next.js Middleware
 *
 * Handles:
 * - CSRF protection for Server Actions
 * - Rate limiting for authentication endpoints
 */
import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit, rateLimitConfigs, rateLimitHeaders } from '@/lib/rateLimit'

/**
 * Get client IP address from request headers
 */
function getClientIp(request: NextRequest): string {
  // Check various headers in order of priority
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // Take the first IP if multiple are present
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to a hash of user-agent + some headers as a fingerprint
  return 'unknown-ip'
}

/**
 * Check if origin is valid for CSRF protection
 */
function isValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')

  // No origin header (same-origin requests from browser)
  if (!origin) {
    return true
  }

  // Check if origin matches host
  if (host) {
    try {
      const originUrl = new URL(origin)
      // Compare hostnames (ignore port for flexibility)
      if (originUrl.hostname === host.split(':')[0]) {
        return true
      }
      // Also allow localhost variations in development
      if (
        process.env.NODE_ENV === 'development' &&
        (originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1')
      ) {
        return true
      }
    } catch {
      return false
    }
  }

  return false
}

/**
 * Rate-limited auth paths and their configurations
 */
const authRateLimitPaths: Record<string, keyof typeof rateLimitConfigs> = {
  '/api/auth/signin': 'login',
  '/api/auth/callback': 'login',
  '/api/auth/register': 'register',
  '/api/auth/forgot-password': 'forgotPassword',
  '/api/auth/reset-password': 'forgotPassword',
  '/api/discount-codes/validate': 'discountValidation',
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // =========================================================================
  // CSRF Protection for Server Actions
  // =========================================================================
  // Server Actions are identified by the 'next-action' header
  const isServerAction = request.headers.get('next-action')

  if (isServerAction && request.method === 'POST') {
    if (!isValidOrigin(request)) {
      console.warn('[CSRF] Blocked cross-origin Server Action request', {
        origin: request.headers.get('origin'),
        host: request.headers.get('host'),
        action: isServerAction,
      })

      return new NextResponse('CSRF check failed', { status: 403 })
    }
  }

  // =========================================================================
  // Rate Limiting for Authentication Endpoints
  // =========================================================================
  const rateLimitConfigKey = authRateLimitPaths[pathname]

  if (rateLimitConfigKey && request.method === 'POST') {
    const ip = getClientIp(request)
    const config = rateLimitConfigs[rateLimitConfigKey]

    // For forgot-password, also rate limit by email if available
    let identifier = ip
    if (rateLimitConfigKey === 'forgotPassword') {
      try {
        // Clone request to read body without consuming it
        const clonedRequest = request.clone()
        const body = await clonedRequest.json()
        if (body.email) {
          identifier = `${ip}:${body.email.toLowerCase()}`
        }
      } catch {
        // If we can't parse body, just use IP
      }
    }

    const result = await checkRateLimit(identifier, config)

    if (!result.success) {
      console.warn('[RateLimit] Request blocked', {
        path: pathname,
        identifier,
        resetIn: result.resetIn,
      })

      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${result.resetIn} seconds.`,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...rateLimitHeaders(result, config),
          },
        }
      )
    }

    // Add rate limit headers to successful responses
    const response = NextResponse.next()
    const headers = rateLimitHeaders(result, config)
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
