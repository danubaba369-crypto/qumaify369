"use client"

import { useState, useEffect, useCallback } from "react"
import { ShieldCheck, Loader2, CheckCircle, XCircle, Clock, Globe, User } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useRouter } from "next/navigation"
import { domainService, type DomainRecord } from "@/services/domainService"

export default function AdminRequests() {
  const { user, isAdmin, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [pendingDomains, setPendingDomains] = useState<DomainRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchPendingRequests = useCallback(async () => {
    if (!isAdmin) return
    try {
      setLoading(true)
      const domains = await domainService.listPendingDomains()
      setPendingDomains(domains || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => {
    if (authLoading) return
    if (!isAdmin) {
      router.push("/")
      return
    }
    fetchPendingRequests()
  }, [authLoading, isAdmin, router, fetchPendingRequests])

  const handleApprove = async (id: string) => {
    try {
      setProcessing(id)
      await domainService.approveDomain(id)
      alert("Domain approved and Cloudflare setup initiated.")
      fetchPendingRequests()
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Approval Failed: ${error.message}`)
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject this domain request?")) return
    try {
      setProcessing(id)
      await domainService.rejectDomain(id)
      alert("Domain request rejected.")
      fetchPendingRequests()
    } catch (err: unknown) {
      const error = err as Error;
      alert(`Rejection Failed: ${error.message}`)
    } finally {
      setProcessing(null)
    }
  }

  if (authLoading || isAdmin === null) {
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
          <div className="p-4 rounded-3xl bg-orange-500/10 border border-orange-500/20">
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Domain Requests</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Pending Admin Approval</p>
          </div>
        </div>
        
        <button 
          onClick={() => router.push('/admin/settings')}
          className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
        >
          System Settings
        </button>
      </div>

      <div className="glass-panel p-8 rounded-[40px] border border-white/10 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 opacity-30" />
        
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="w-10 h-10 text-gray-600 animate-spin" />
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Scanning Submissions...</p>
          </div>
        ) : pendingDomains.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <ShieldCheck className="w-16 h-16 text-green-500/20 mx-auto" />
            <p className="text-xs text-gray-600 font-black uppercase tracking-widest italic">All clear. No pending requests.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase font-black tracking-widest text-gray-500">
                  <th className="px-4 py-3 pb-6">Domain Node</th>
                  <th className="px-4 py-3 pb-6">Requested By</th>
                  <th className="px-4 py-3 pb-6">Date</th>
                  <th className="px-4 py-3 pb-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pendingDomains.map((domain) => (
                  <tr key={domain.id} className="group hover:bg-white/[0.01] transition-colors">
                    <td className="px-4 py-6">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-white font-black tracking-tight uppercase">{domain.domain_name}</p>
                          <p className="text-[9px] text-orange-500 font-bold uppercase">Pending Verification</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="text-xs text-gray-400 font-medium">{domain.user_id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-6">
                      <span className="text-[10px] text-gray-500 font-bold uppercase">{new Date(domain.created_at).toLocaleDateString()}</span>
                    </td>
                    <td className="px-4 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => handleApprove(domain.id)}
                          disabled={!!processing}
                          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all disabled:opacity-50"
                        >
                          {processing === domain.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          Approve
                        </button>
                        <button 
                          onClick={() => handleReject(domain.id)}
                          disabled={!!processing}
                          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
