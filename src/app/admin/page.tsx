'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, Loader2, LogIn, Eye, EyeOff, ShieldAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const supabase = createClient()

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      // Import domainService dynamically to avoid issues with SSR if any
      const { domainService } = await import('@/services/domainService')
      const settings = await domainService.getSettings()
      const masterAdmin = settings.admin_email || 'info369skills@gmail.com'

      // Basic login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Verify if it's the admin email or developer backup
      if (data.user?.email !== masterAdmin && data.user?.email !== 'info369skills@gmail.com') {
        await supabase.auth.signOut()
        throw new Error('Access denied: Unauthorized admin attempt.')
      }

      router.push('/admin/settings')
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-[40px] bg-[#0A0A0A] border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldAlert className="w-24 h-24 text-red-500" />
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Admin Portal</h1>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">Restricted Access Only</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
              <input
                type="email"
                placeholder="Admin Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-red-500/50 transition-all outline-none text-white text-sm"
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Secure Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-red-500/50 transition-all outline-none text-white text-sm"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-black uppercase tracking-widest shadow-lg hover:shadow-red-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              Initialize Session
            </button>
          </form>

          <AnimatePresence mode="wait">
            {message && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold text-center"
              >
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
