import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import dns from 'dns/promises'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { id, force } = await request.json()

  // 1. Fetch domain details
  const { data: domain, error: fetchError } = await supabase
    .from('user_domains')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !domain) {
    return NextResponse.json({ message: 'Domain not found' }, { status: 404 })
  }

  if (domain.is_verified) {
    return NextResponse.json({ message: 'Domain already verified', verified: true })
  }

  // 1.5 Bypass if forced (for local dev)
  if (force) {
    const { error: updateError } = await supabase
      .from('user_domains')
      .update({ is_verified: true, verified_at: new Date().toISOString() })
      .eq('id', id)

    if (updateError) throw updateError
    return NextResponse.json({ message: 'Domain force-verified (Dev Mode)', verified: true })
  }

  try {
    // 2. Perform DNS TXT lookup
    // In a real environment, we check for the verification token
    const cleanDomain = domain.domain_name
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')

    const txtRecords = await dns.resolveTxt(cleanDomain)
    const flattenedRecords = txtRecords.flat()
    
    const isVerified = flattenedRecords.includes(domain.verification_token)

    if (isVerified) {
      // 3. Update database
      const { error: updateError } = await supabase
        .from('user_domains')
        .update({ is_verified: true, verified_at: new Date().toISOString() })
        .eq('id', id)

      if (updateError) throw updateError

      return NextResponse.json({ message: 'Domain verified successfully!', verified: true })
    } else {
      return NextResponse.json({ 
        message: 'Verification token not found in DNS records. Please check your setup and try again.', 
        verified: false 
      }, { status: 400 })
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Verification Error:', err)
    return NextResponse.json({ 
      message: `Verification failed: ${err.message}`, 
      verified: false 
    }, { status: 500 })
  }
}
