import { createClient } from '@/lib/supabase/client'

export interface DomainRecord {
  id: string
  user_id: string
  domain_name: string
  is_verified: boolean
  verification_token: string
  created_at: string
}

export const domainService = {
  async addDomain(domainName: string) {
    const supabase = createClient()
    
    // Clean domain name: remove https://, http://, and trailing slashes
    const cleanDomain = domainName
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
      .split('/')[0] // handle potential paths

    const verificationToken = `quamify-verify-${Math.random().toString(36).substring(2, 15)}`
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('AddDomain Error: No active session found')
      throw new Error('You must be logged in to add a domain')
    }

    const { data, error } = await supabase
      .from('user_domains')
      .insert([
        { 
          domain_name: cleanDomain, 
          verification_token: verificationToken,
          user_id: user.id // Explicit passing to satisfy RLS WITH CHECK
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Supabase Insertion Error:', error)
      throw error
    }
    return data as DomainRecord
  },

  async getSettings() {
    const supabase = createClient()
    const { data } = await supabase.from('site_settings').select('*')
    const settings: Record<string, string> = {}
    data?.forEach(s => settings[s.key] = s.value)
    return settings
  },

  async updateSetting(key: string, value: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() })
    if (error) throw error
  },

  async addAdmin(email: string) {
    const supabase = createClient()
    const { error } = await supabase.from('admins').upsert({ email })
    if (error) throw error
  },

  async removeAdmin(email: string) {
    const supabase = createClient()
    const { error } = await supabase.from('admins').delete().eq('email', email)
    if (error) throw error
  },

  async listAdmins() {
    const supabase = createClient()
    const { data } = await supabase.from('admins').select('email')
    return data?.map(a => a.email) || []
  },

  async getStats() {
    const supabase = createClient()
    
    // Get total domains count
    const { count: domainsCount } = await supabase
      .from('user_domains')
      .select('*', { count: 'exact', head: true })

    // Get total verified domains
    const { count: verifiedCount } = await supabase
      .from('user_domains')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', true)

    // Get total emails processed
    const { count: emailsCount } = await supabase
      .from('emails')
      .select('*', { count: 'exact', head: true })

    return {
      totalDomains: domainsCount || 0,
      activeDomains: verifiedCount || 0,
      totalEmails: emailsCount || 0
    }
  },

  async listDomains() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('user_domains')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as DomainRecord[]
  },

  async deleteDomain(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('user_domains')
      .delete()
      .match({ id })

    if (error) throw error
  },

  async getCustomDomains() {
    const supabase = createClient()
    const { data, error } = await supabase.from('custom_domains').select('*')
    if (error) throw error
    return data
  },

  async addCustomDomain(domainName: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    
    const { data, error } = await supabase
      .from('custom_domains')
      .upsert({ 
        domain_name: domainName.toLowerCase().trim(), 
        user_id: user.id 
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async verifyCustomDomain(domainName: string, force: boolean = false) {
    const response = await fetch('/api/domains/custom-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: domainName, force }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'DNS Verification failed')
    }
    return await response.json()
  },

  async verifyDomain(id: string, force: boolean = false) {
    const response = await fetch('/api/domains/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, force }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Verification failed')
    }

    return await response.json()
  }
}
