import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import dns from 'dns/promises'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { domain, force } = await request.json()

  if (!domain) {
    return NextResponse.json({ message: 'Domain name is required' }, { status: 400 })
  }

  try {
    const cleanDomain = domain.toLowerCase().trim()
    
    if (force) {
      const { error } = await supabase
        .from('custom_domains')
        .update({ dns_verified: true })
        .eq('domain_name', cleanDomain)

      if (error) throw error
      return NextResponse.json({ message: 'Domain force-verified successfully!', verified: true })
    }
    
    // In a real production app, you'd check against your specific IP or CNAME.
    // For this demonstration, we'll verify if ANY A or CNAME record exists.
    // In a final handover, we would provide the specific IP/CNAME to the user.
    
    const VERCEL_IP = "76.76.21.21"
    const VERCEL_CNAME = "cname.vercel-dns.com"
    
    let isVerified = false
    let reason = ""

    try {
      const aRecords = await dns.resolve4(cleanDomain)
      if (aRecords.includes(VERCEL_IP)) {
        isVerified = true
        reason = "Correct A-Record (76.76.21.21)"
      }
    } catch {}

    if (!isVerified) {
      try {
        const cnameRecords = await dns.resolveCname(cleanDomain)
        if (cnameRecords.includes(VERCEL_CNAME)) {
          isVerified = true
          reason = "Correct CNAME (cname.vercel-dns.com)"
        }
      } catch {}
    }

    if (isVerified) {
      const { error } = await supabase
        .from('custom_domains')
        .update({ dns_verified: true, verified_at: new Date().toISOString() })
        .eq('domain_name', cleanDomain)

      if (error) throw error

      return NextResponse.json({ 
        message: `Successfully verified via ${reason}!`, 
        verified: true 
      })
    } else {
      return NextResponse.json({ 
        message: 'No DNS records detected. Please ensure your A or CNAME record is configured correctly.', 
        verified: false 
      }, { status: 400 })
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Custom DNS Verification Error:', err)
    return NextResponse.json({ 
      message: `Verification failed: ${err.message}`, 
      verified: false 
    }, { status: 500 })
  }
}
