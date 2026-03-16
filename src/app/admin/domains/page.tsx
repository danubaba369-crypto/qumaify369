"use client"

import { useState, useEffect } from "react"
import { Shield, Globe, Mail, Trash2, Loader2, AlertTriangle } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useRouter } from "next/navigation"
import { domainService, type DomainRecord } from "@/services/domainService"
import { supabase } from "@/lib/supabase"

export default function AdminDomains() {
  const { user } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [allDomains, setAllDomains] = useState<DomainRecord[]>([])
  const [customDomains, setCustomDomains] = useState<any[]>([])
  const [newCustomDomain, setNewCustomDomain] = useState("")
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    fetchDomainData()
  }, [user])

  const fetchDomainData = async () => {
    try {
      setLoading(true)
      const [adminList, domains, customList] = await Promise.all([
        domainService.listAdmins(),
        supabase.from('user_domains').select('*').order('created_at', { ascending: false }),
        domainService.getCustomDomains()
      ])
      
      const email = user?.email
      const isHardcodedAdmin = email === "info369skills@gmail.com" || email === "danubaba369@gmail.com" || email === "abcd@artradering.com"
      
      if (isHardcodedAdmin || adminList.includes(email || "")) {
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
        router.push("/")
        return
      }

      setAllDomains(domains.data || [])
      setCustomDomains(customList || [])
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Fetch domains failed:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCustomDomain = async () => {
    if (!newCustomDomain) return
    try {
      setIsSaving(true)
      await domainService.addCustomDomain(newCustomDomain)
      setNewCustomDomain("")
      fetchDomainData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleVerifyCustomDomain = async (domainName: string, force: boolean = false) => {
    try {
      setVerifying(domainName)
      const res = await domainService.verifyCustomDomain(domainName, force)
      alert(res.message)
      fetchDomainData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setVerifying(null)
    }
  }

  const handleDeleteDomain = async (id: string) => {
    if (!confirm("Admin Overwrite: Delete this domain from system?")) return
    try {
      await supabase.from('user_domains').delete().eq('id', id)
      setAllDomains(allDomains.filter(d => d.id !== id))
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (isAdmin === false) return null

  if (loading || (isAdmin === null && !error)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-[var(--color-brand-pink)] animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 space-y-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-3xl bg-red-500/10 border border-red-500/20">
            <Globe className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Domain Infrastructure</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Manage Global Nodes & Custom Branding</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center gap-4 text-red-400">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
        {/* Custom Branding Domain */}
        <div className="xl:col-span-2 space-y-8">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--color-brand-purple)]" />
            <h2 className="text-xl font-black text-white uppercase tracking-widest">Custom Branding Domain</h2>
          </div>
          
          <div className="glass-panel p-8 rounded-[40px] border border-white/10 space-y-6">
            <p className="text-xs text-gray-400 font-medium">Link your client's own domain to the Quamify infrastructure.</p>
            
            <div className="flex gap-4">
              <input 
                type="text" 
                placeholder="e.g. mail.client.com"
                value={newCustomDomain}
                onChange={(e) => setNewCustomDomain(e.target.value)}
                className="flex-1 px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-[var(--color-brand-purple)] outline-none text-white transition-all font-medium"
              />
              <button 
                onClick={handleAddCustomDomain}
                disabled={isSaving || !newCustomDomain}
                className="px-8 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all disabled:opacity-50"
              >
                Register
              </button>
            </div>

            {customDomains.length > 0 && (
              <div className="space-y-4 pt-4">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">DNS Instructions</h3>
                <div className="p-6 rounded-3xl bg-black/40 border border-white/5 space-y-4 font-mono text-[10px]">
                  <div className="flex justify-between items-center text-gray-400">
                    <span>TYPE: A</span>
                    <span>VALUE: 76.76.21.21 (Vercel IP)</span>
                  </div>
                  <div className="border-t border-white/5 pt-4 flex justify-between items-center text-gray-400">
                    <span>TYPE: CNAME</span>
                    <span>VALUE: cname.vercel-dns.com</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {customDomains.map(cd => (
                    <div key={cd.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-white uppercase">{cd.domain_name}</p>
                        <p className={`text-[8px] font-black uppercase mt-1 ${cd.dns_verified ? 'text-green-500' : 'text-red-500'}`}>
                          {cd.dns_verified ? '● LIVE / CONNECTED' : '○ PENDING DNS'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleVerifyCustomDomain(cd.domain_name)}
                          disabled={verifying === cd.domain_name}
                          className="px-4 py-2 rounded-xl bg-white text-black text-[9px] font-black uppercase tracking-widest hover:bg-[var(--color-brand-purple)] hover:text-white transition-all disabled:opacity-50"
                        >
                          {verifying === cd.domain_name ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Verify DNS'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global Domain List */}
        <div className="space-y-8">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-[var(--color-brand-pink)]" />
              <h2 className="text-xl font-black text-white uppercase tracking-widest">Network Nodes ({allDomains.length})</h2>
            </div>

            <div className="max-h-[80vh] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {allDomains.map(domain => (
                <div key={domain.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group">
                  <div>
                    <h4 className="text-sm font-bold text-white">{domain.domain_name}</h4>
                    <p className="text-[10px] text-gray-500 font-medium">OWNER: {domain.user_id.slice(0, 8)}...</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteDomain(domain.id)}
                    className="p-2 rounded-xl text-gray-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
        </div>
      </div>
    </div>
  )
}
