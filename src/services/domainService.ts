import { supabase } from '@/lib/supabase'

export interface DomainRecord {
  id: string
  user_id: string
  domain_name: string
  is_verified: boolean
  verification_token: string
  created_at: string
  cloudflare_zone_id?: string
  cloudflare_nameservers?: string[]
  cloudflare_status?: string
}

export const domainService = {
  async addDomain(domainName: string) {
    const response = await fetch('/api/domains/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domainName }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to setup domain')
    }

    return await response.json()
  },

  async getSettings() {
    try {
      const { data } = await supabase.from('site_settings').select('*')
      const settings: Record<string, string> = {}
      data?.forEach((s: any) => settings[s.key] = s.value)
      return settings
    } catch (e) {
      console.error('getSettings failed:', e)
      return {}
    }
  },

  async updateSetting(key: string, value: string) {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() })
    if (error) throw error
  },

  async addAdmin(email: string) {
    const { error } = await supabase.from('admins').upsert({ email })
    if (error) throw error
  },

  async removeAdmin(email: string) {
    const { error } = await supabase.from('admins').delete().eq('email', email)
    if (error) throw error
  },

  async listAdmins() {
    try {
      const { data } = await supabase.from('admins').select('email')
      return data?.map((a: any) => a.email) || []
    } catch (e) {
      console.error('listAdmins failed:', e)
      return []
    }
  },

  async getStats() {
    try {
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
    } catch (e) {
      console.error('getStats failed:', e)
      return { totalDomains: 0, activeDomains: 0, totalEmails: 0 }
    }
  },

  async listDomains() {
    try {
      const { data, error } = await supabase
        .from('user_domains')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data as DomainRecord[]) || []
    } catch (e) {
      console.error('listDomains failed:', e)
      return []
    }
  },

  async deleteDomain(id: string) {
    const { error } = await supabase
      .from('user_domains')
      .delete()
      .match({ id })

    if (error) throw error
  },

  async getCustomDomains() {
    const { data, error } = await supabase.from('custom_domains').select('*')
    if (error) throw error
    return data
  },

  async addCustomDomain(domainName: string) {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
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

  async verifyCustomDomain(domainName: string) {
    const response = await fetch('/api/domains/custom-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: domainName }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'DNS Verification failed')
    }
    return await response.json()
  },

  async verifyDomain(id: string) {
    const response = await fetch('/api/domains/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Verification failed')
    }

    return await response.json()
  }
}
