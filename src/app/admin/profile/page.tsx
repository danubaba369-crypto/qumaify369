'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Loader2, Save, Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

export default function AdminProfilePage() {
  const { user } = useAuth()
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const supabase = createClient()

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      // Update Supabase Auth only. 
      // Verification email will be sent to BOTH new and old email.
      // Settings should be updated manually in /admin/settings AFTER verification.
      const { error: authError } = await supabase.auth.updateUser({ email })
      if (authError) throw authError

      setMessage({ type: 'success', text: 'Verification link sent to ' + email + '. Identity change will finish after you click the link.' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setMessage({ type: 'success', text: 'Password updated successfully.' })
      setPassword('')
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-12">
      <div className="flex items-center gap-4">
        <div className="p-4 rounded-3xl bg-green-500/10 border border-green-500/20">
          <ShieldCheck className="w-8 h-8 text-green-500" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Security Profile</h1>
          <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Manage Admin Credentials</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Email Update */}
        <section className="space-y-6">
          <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Mail className="w-5 h-5 text-[var(--color-brand-pink)]" />
            Update Portal Email
          </h2>
          <form onSubmit={handleUpdateEmail} className="glass-panel p-8 rounded-[40px] border border-white/10 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">New Email Address</label>
              <input 
                type="email"
                placeholder="Quamify's administration"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-[var(--color-brand-pink)] outline-none text-white transition-all font-medium"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-[var(--color-brand-pink)] hover:text-white transition-all disabled:opacity-50"
            >
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
               Request Change
            </button>
          </form>
        </section>

        {/* Password Update */}
        <section className="space-y-6">
          <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Lock className="w-5 h-5 text-[var(--color-brand-purple)]" />
            Rotate Password
          </h2>
          <form onSubmit={handleUpdatePassword} className="glass-panel p-8 rounded-[40px] border border-white/10 space-y-6">
            <div className="space-y-2 relative">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">New Secure Password</label>
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-[var(--color-brand-purple)] outline-none text-white transition-all font-medium pr-12"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[38px] text-gray-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <button 
              type="submit"
              disabled={loading || !password}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[var(--color-brand-purple)] to-[var(--color-brand-pink)] text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:shadow-[var(--color-brand-pink)]/20 shadow-lg transition-all disabled:opacity-50"
            >
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
               Update Secret
            </button>
          </form>
        </section>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-[30px] border flex items-center gap-4 text-sm font-bold ${
              message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
