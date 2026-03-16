"use client"

import { useState, useEffect, useCallback } from "react"
import { Settings, Loader2, Save } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useRouter } from "next/navigation"
import { domainService } from "@/services/domainService"

interface SystemSettings {
  main_domain: string;
  support_email: string;
  admin_email: string;
  copyright_text: string;
  terms_content: string;
  safety_clause_content: string;
}

export default function AdminSettings() {
  const { user } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [settings, setSettings] = useState<SystemSettings>({
    main_domain: "",
    support_email: "",
    admin_email: "",
    copyright_text: "",
    terms_content: "",
    safety_clause_content: ""
  })
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true)
      const [siteSettings, adminList] = await Promise.all([
        domainService.getSettings(),
        domainService.listAdmins()
      ])
      
      const email = user?.email
      const masterAdmin = siteSettings.admin_email || "info369skills@gmail.com"
      
      const isHardcodedAdmin = email === "info369skills@gmail.com" || email === "abcd@artradering.com"
      
      if (isHardcodedAdmin || adminList.includes(email || "")) {
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
        router.push("/")
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
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Fetch settings failed:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [user, router, setIsAdmin])

  useEffect(() => {
    if (!user) return
    fetchAdminData()
  }, [user, fetchAdminData])

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true)
      await Promise.all([
        domainService.updateSetting("main_domain", settings.main_domain),
        domainService.updateSetting("support_email", settings.support_email),
        domainService.updateSetting("admin_email", settings.admin_email),
        domainService.addAdmin(settings.admin_email),
        domainService.updateSetting("copyright_text", settings.copyright_text),
        domainService.updateSetting("terms_content", settings.terms_content),
        domainService.updateSetting("safety_clause_content", settings.safety_clause_content)
      ])
      alert("System updated successfully.")
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Save failed:', error)
      setError(error.message)
      alert(`Update Failed: ${error.message}`)
    } finally {
      setIsSaving(false)
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
            <Settings className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">System Configuration</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Global Platform Parameters</p>
          </div>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-[40px] border border-white/10 space-y-8 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Main System Domain</label>
            <input 
              type="text" 
              value={settings.main_domain}
              onChange={(e) => setSettings({...settings, main_domain: e.target.value})}
              className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Support Email</label>
            <input 
              type="email" 
              value={settings.support_email}
              onChange={(e) => setSettings({...settings, support_email: e.target.value})}
              className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Terms & Conditions</label>
          <textarea 
            value={settings.terms_content}
            onChange={(e) => setSettings({...settings, terms_content: e.target.value})}
            className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white min-h-[150px] resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Safety Clause</label>
          <textarea 
            value={settings.safety_clause_content}
            onChange={(e) => setSettings({...settings, safety_clause_content: e.target.value})}
            className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white min-h-[150px] resize-none"
          />
        </div>

        <button 
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="w-full py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-[var(--color-brand-pink)] hover:text-white transition-all disabled:opacity-50 shadow-xl"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Deploy System Update
        </button>
      </div>
    </div>
  )
}
