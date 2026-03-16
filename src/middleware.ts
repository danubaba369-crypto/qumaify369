import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { rateLimit } from '@/lib/rate-limit'

export async function middleware(request: NextRequest) {
  // 1. Rate Limiting
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
  const limiter = rateLimit(ip, 100, 60000) // 100 requests per minute

  if (!limiter.success) {
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'X-RateLimit-Limit': limiter.limit.toString(),
        'X-RateLimit-Remaining': limiter.remaining.toString(),
        'X-RateLimit-Reset': limiter.reset.toString(),
      }
    })
  }

  // 2. Auth Session Management
  const response = await updateSession(request)
  
  // Apply rate limit headers to the final response
  response.headers.set('X-RateLimit-Limit', limiter.limit.toString())
  response.headers.set('X-RateLimit-Remaining', limiter.remaining.toString())

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
