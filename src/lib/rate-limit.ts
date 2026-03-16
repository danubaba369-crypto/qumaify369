import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter for demonstration.
// In production (especially with Cloudflare Workers), use Cloudflare KV or Upstash Redis.
const rateLimitMap = new Map<string, { count: number, reset: number }>()

export function rateLimit(ip: string, limit: number = 60, windowMs: number = 60000) {
  const now = Date.now()
  const record = rateLimitMap.get(ip) || { count: 0, reset: now + windowMs }

  if (now > record.reset) {
    record.count = 1
    record.reset = now + windowMs
  } else {
    record.count++
  }

  rateLimitMap.set(ip, record)

  return {
    success: record.count <= limit,
    limit,
    remaining: Math.max(0, limit - record.count),
    reset: record.reset
  }
}
