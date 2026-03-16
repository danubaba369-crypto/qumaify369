"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Shield, Settings, Mail, Globe, Trash2, Loader2, Save, XCircle, AlertTriangle } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useRouter } from "next/navigation"
import { domainService, type DomainRecord } from "@/services/domainService"
import { supabase } from "@/lib/supabase"

export default function AdminSettings() {
  const { user } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [settings, setSettings] = useState({ 
    main_domain: "", 
    support_email: "",
    admin_email: "",
    copyright_text: "",
    terms_content: "",
    safety_clause_content: ""
  })
  const [allDomains, setAllDomains] = useState<DomainRecord[]>([])
  const [customDomains, setCustomDomains] = useState<any[]>([])
  const [newCustomDomain, setNewCustomDomain] = useState("")
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    fetchAdminData()
  }, [user])

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      const [siteSettings, domains, adminList, customList] = await Promise.all([
        domainService.getSettings(),
        supabase.from('user_domains').select('*').order('created_at', { ascending: false }),
        domainService.listAdmins(),
        domainService.getCustomDomains()
      ])
      
      const email = user?.email
      const masterAdmin = siteSettings.admin_email || "info369skills@gmail.com"
      
      // Developer backup or in the authorized admin list
      if (email === "info369skills@gmail.com" || adminList.includes(email || "")) {
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
        setTimeout(() => router.push("/"), 3000)
        return
      }

      setSettings({
        main_domain: siteSettings.main_domain || "",
        support_email: siteSettings.support_email || "",
        admin_email: masterAdmin,
        copyright_text: siteSettings.copyright_text || "",
        terms_content: siteSettings.terms_content || "",
        safety_clause_content: siteSettings.safety_clause_content || ""
      })
      setAllDomains(domains.data || [])
      setCustomDomains(customList || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true)
      await Promise.all([
        domainService.updateSetting("main_domain", settings.main_domain),
        domainService.updateSetting("support_email", settings.support_email),
        domainService.updateSetting("admin_email", settings.admin_email),
        domainService.addAdmin(settings.admin_email), // Sync to authorization table
        domainService.updateSetting("copyright_text", settings.copyright_text),
        domainService.updateSetting("terms_content", settings.terms_content),
        domainService.updateSetting("safety_clause_content", settings.safety_clause_content)
      ])
      alert("System updated successfully. All changes are live.")
    } catch (err: any) {
      alert(`Update Failed: ${err.message}`)
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddCustomDomain = async () => {
    if (!newCustomDomain) return
    try {
      setIsSaving(true)
      await domainService.addCustomDomain(newCustomDomain)
      setNewCustomDomain("")
      fetchAdminData()
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
      fetchAdminData()
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

  if (isAdmin === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        {error ? (
          <>
            <AlertTriangle className="w-16 h-16 text-yellow-500" />
            <h1 className="text-2xl font-black uppercase tracking-widest text-white">System Error</h1>
            <p className="text-gray-500 text-center max-w-md">{error}</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-white/10 rounded-xl text-white text-xs font-bold uppercase tracking-widest">Retry Connection</button>
          </>
        ) : (
          <>
            <XCircle className="w-16 h-16 text-red-500" />
            <h1 className="text-2xl font-black uppercase tracking-widest text-white">Access Denied</h1>
            <p className="text-gray-500">Redirecting to neutral zone...</p>
          </>
        )}
      </div>
    )
  }

  if (loading || (isAdmin === null && !error)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-[var(--color-brand-pink)] animate-spin" />
      </div>
    )
  }

  if (error && isAdmin === null) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <AlertTriangle className="w-16 h-16 text-red-500" />
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-black uppercase tracking-widest text-white">Database Sync Error</h1>
                <p className="text-gray-500 max-w-md mx-auto">{error}</p>
            </div>
            <div className="flex gap-4">
                <button onClick={() => window.location.reload()} className="px-8 py-4 bg-white text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[var(--color-brand-pink)] hover:text-white transition-all">Reload Portal</button>
                <button onClick={() => router.push('/admin/profile')} className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all">Go to Profile</button>
            </div>
        </div>
      )
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 space-y-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 sm:p-4 rounded-3xl bg-red-500/10 border border-red-500/20">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tighter">Admin Control Center</h1>
            <p className="text-[8px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest">Global holographic infrastructure management</p>
          </div>
        </div>
        <button 
           onClick={() => router.push('/admin/profile')}
           className="hidden sm:block px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
        >
            Security Profile
        </button>
      </div>

      {error && (
        <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center gap-4 text-red-400">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
        {/* Site Configuration */}
        <div className="xl:col-span-2 space-y-8">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[var(--color-brand-pink)]" />
            <h2 className="text-xl font-black text-white uppercase tracking-widest">System Parameters</h2>
          </div>

          <div className="glass-panel p-4 sm:p-8 rounded-[30px] sm:rounded-[40px] border border-white/10 space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Main System Domain</label>
                    <div className="relative group">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[var(--color-brand-pink)] transition-colors" />
                        <input 
                        type="text" 
                        value={settings.main_domain}
                        onChange={(e) => setSettings({...settings, main_domain: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-[var(--color-brand-pink)] outline-none text-white transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Global Support Email</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[var(--color-brand-purple)] transition-colors" />
                        <input 
                        type="email" 
                        value={settings.support_email}
                        onChange={(e) => setSettings({...settings, support_email: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-[var(--color-brand-purple)] outline-none text-white transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Master Administrator Email</label>
                    <div className="relative group">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400 group-focus-within:text-red-500 transition-colors" />
                        <input 
                        type="email" 
                        value={settings.admin_email}
                        onChange={(e) => setSettings({...settings, admin_email: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-red-500/50 outline-none text-white transition-all font-medium"
                        />
                    </div>
                    <p className="text-[8px] text-red-500/50 uppercase font-bold ml-2">WARNING: This user will have full destructive access to all system settings.</p>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Copyright Text</label>
                <input 
                    type="text" 
                    value={settings.copyright_text}
                    onChange={(e) => setSettings({...settings, copyright_text: e.target.value})}
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-[var(--color-brand-orange)] outline-none text-white transition-all font-medium"
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Terms & Conditions Content</label>
                <textarea 
                    value={settings.terms_content}
                    onChange={(e) => setSettings({...settings, terms_content: e.target.value})}
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-[var(--color-brand-pink)] outline-none text-white transition-all font-medium min-h-[150px] resize-none"
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Safety Clause Content</label>
                <textarea 
                    value={settings.safety_clause_content}
                    onChange={(e) => setSettings({...settings, safety_clause_content: e.target.value})}
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-red-500/50 outline-none text-white transition-all font-medium min-h-[150px] resize-none"
                />
            </div>

            <button 
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="w-full py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-[var(--color-brand-pink)] hover:text-white transition-all active:scale-95 disabled:opacity-50 shadow-xl"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Deploy System Update
            </button>
          </div>

          {/* Custom Branding Domain */}
          <div className="space-y-8 mt-12">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[var(--color-brand-purple)]" />
              <h2 className="text-xl font-black text-white uppercase tracking-widest">Custom Branding Domain</h2>
            </div>
            
            <div className="glass-panel p-4 sm:p-8 rounded-[30px] sm:rounded-[40px] border border-white/10 space-y-6">
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
                  className="px-4 sm:px-8 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all disabled:opacity-50"
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
                          <button 
                            onClick={() => handleVerifyCustomDomain(cd.domain_name, true)}
                            disabled={verifying === cd.domain_name}
                            className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                          >
                            Force
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Global Domain List (For Admin review of user domains) */}
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
                    <p className="text-[10px] text-gray-500 font-medium">OWNER ID: {domain.user_id.slice(0, 8)}...</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded ${domain.is_verified ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {domain.is_verified ? 'Verified' : 'Pending'}
                    </span>
                    <button 
                      onClick={() => handleDeleteDomain(domain.id)}
                      className="p-2 rounded-xl bg-red-500/0 hover:bg-red-500/10 text-gray-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
        </div>
      </div>
    </div>
  )
}
