import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Lightweight session update - essential for Auth
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets:
     * - _next/static, _next/image, favicon.ico, and common image formats
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
