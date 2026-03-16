'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Globe, CheckCircle2, XCircle, Trash2, RefreshCw, Loader2, ChevronRight } from 'lucide-react'
import { domainService, type DomainRecord } from '@/services/domainService'
import DomainSetupInstructions from '@/components/DomainSetupInstructions'

export default function DomainsPage() {
  const [domains, setDomains] = useState<DomainRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [newDomainName, setNewDomainName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedDomain, setSelectedDomain] = useState<DomainRecord | null>(null)
  const [stats, setStats] = useState({ totalDomains: 0, activeDomains: 0, totalEmails: 0 })

  useEffect(() => {
    fetchDomains()
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const data = await domainService.getStats()
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const fetchDomains = async () => {
    try {
      setLoading(true)
      const data = await domainService.listDomains()
      setDomains(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDomainName) return
    
    try {
      setIsAdding(true)
      setError(null)
      const added = await domainService.addDomain(newDomainName)
      setDomains([added, ...domains])
      setNewDomainName('')
      setSelectedDomain(added)
      fetchStats()
    } catch (err: any) {
      setError(err.message || 'Failed to add domain')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteDomain = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this domain?')) return
    
    try {
      await domainService.deleteDomain(id)
      setDomains(domains.filter(d => d.id !== id))
      if (selectedDomain?.id === id) setSelectedDomain(null)
      fetchStats()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleVerify = async (id: string, e: React.MouseEvent, force: boolean = false) => {
    e.stopPropagation()
    try {
      setVerifyingId(id)
      setError(null)
      const result = await domainService.verifyDomain(id, force)
      if (result.verified) {
        setDomains(domains.map(d => d.id === id ? { ...d, is_verified: true } : d))
        fetchStats()
        alert(result.message)
      } else {
        setError(result.message)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setVerifyingId(null)
    }
  }

  return (
    <div className="space-y-12 pb-12">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl group hover:border-[var(--color-brand-pink)]/30 transition-all">
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Engines Processed</p>
          <h3 className="text-3xl font-black text-white">{stats.totalEmails}</h3>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] text-green-500 uppercase font-bold">Real-time Transmission</span>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl group hover:border-[var(--color-brand-purple)]/30 transition-all">
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Active Domains</p>
          <h3 className="text-3xl font-black text-white">{stats.activeDomains} <span className="text-sm text-gray-600 font-medium">/ {stats.totalDomains}</span></h3>
          <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
             <div className="h-full bg-gradient-to-r from-[var(--color-brand-purple)] to-[var(--color-brand-pink)]" style={{ width: `${(stats.activeDomains / (stats.totalDomains || 1)) * 100}%` }}></div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl group hover:border-[var(--color-brand-gold)]/30 transition-all">
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Network Status</p>
          <h3 className="text-3xl font-black text-white">OPTIMIZED</h3>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] text-gray-400 uppercase font-bold">Latency: 42ms</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Domain List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              Domain Management
            </h2>
            <span className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 font-mono">
              CAP: 0{domains.length}/09
            </span>
          </div>

          <form onSubmit={handleAddDomain} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter your naked domain (e.g. example.com)"
              value={newDomainName}
              onChange={(e) => setNewDomainName(e.target.value)}
              className="flex-1 px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-[var(--color-brand-pink)] transition-all outline-none text-white text-sm font-medium"
            />
            <button
              type="submit"
              disabled={isAdding || domains.length >= 9}
              className="px-8 py-4 rounded-2xl bg-white text-black font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-[var(--color-brand-pink)] hover:text-white transition-all active:scale-95 disabled:opacity-50"
            >
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Deploy
            </button>
          </form>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}

          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
              </div>
            ) : domains.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
                <Globe className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500">No domains added yet</p>
              </div>
            ) : (
              domains.map((domain) => (
                <motion.div
                  key={domain.id}
                  layoutId={domain.id}
                  onClick={() => setSelectedDomain(domain)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                    selectedDomain?.id === domain.id 
                      ? 'bg-white/10 border-[var(--color-brand-pink)]/50' 
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${domain.is_verified ? 'bg-green-500/10' : 'bg-amber-500/10'}`}>
                        {domain.is_verified ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <Globe className="w-4 h-4 text-amber-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{domain.domain_name}</h4>
                        <p className={`text-xs font-bold uppercase ${domain.is_verified ? 'text-green-500' : 'text-amber-500'}`}>
                          {domain.is_verified ? '● Connected' : '○ Setup Pending'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!domain.is_verified && (
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => handleVerify(domain.id, e)}
                            disabled={verifyingId === domain.id}
                            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
                            title="Verify Connectivity"
                          >
                            {verifyingId === domain.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                      <button
                        onClick={(e) => handleDeleteDomain(domain.id, e)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"
                        title="Delete Engine"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Setup Details */}
        <div className="lg:sticky lg:top-24">
          <AnimatePresence mode="wait">
            {selectedDomain ? (
              <motion.div
                key={selectedDomain.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <DomainSetupInstructions 
                  domainName={selectedDomain.domain_name} 
                  verificationToken={selectedDomain.verification_token} 
                />
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-12 text-center rounded-3xl border border-white/5 bg-white/2 backdrop-blur-sm"
              >
                <Globe className="w-12 h-12 text-gray-800 mx-auto mb-4 opacity-20" />
                <p className="text-gray-600 italic uppercase text-[10px] tracking-widest font-black">Secure Tunnel Initialized. Select node for deployment data.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
