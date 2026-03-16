'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type User, type Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  isAdmin: boolean
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAdmin: false,
  isLoading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const setData = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) console.error('Error getting session:', error)
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Robust admin check
        try {
          const { domainService } = await import('@/services/domainService')
          const adminList = await domainService.listAdmins()
          const email = session.user.email
          setIsAdmin(email === 'info369skills@gmail.com' || adminList.includes(email || ""))
        } catch (e) {
          console.error('Admin check failed:', e)
        }
      } else {
        setIsAdmin(false)
      }
      
      setIsLoading(false)
    }

    setData()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        try {
          const { domainService } = await import('@/services/domainService')
          const adminList = await domainService.listAdmins()
          setIsAdmin(session.user.email === 'info369skills@gmail.com' || adminList.includes(session.user.email || ""))
        } catch (e) {}
      } else {
        setIsAdmin(false)
      }
      
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
