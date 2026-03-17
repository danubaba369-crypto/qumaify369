'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Loader2 } from 'lucide-react'
import { domainService } from '@/services/domainService'

export default function TermsPage() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      const settings = await domainService.getSettings()
      setContent(settings.terms_content || 'By accessing and using Quamify Mail, you agree to be bound by these terms. This service provides temporary holographic email addresses for testing and privacy purposes.')
    } catch (err) {
      setContent('Technical terms of service available upon infrastructure initialization.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-20 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20">
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Terms of Service</h1>
            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em]">Infrastructure Usage Protocol</p>
          </div>
        </div>

        <div className="glass-panel p-12 rounded-[50px] border border-white/5 bg-white/[0.02] backdrop-blur-3xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
          
          {loading ? (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
          ) : (
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-400 leading-relaxed whitespace-pre-wrap font-medium">
                {content}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
