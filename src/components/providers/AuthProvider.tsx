'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type User, type Session } from '@supabase/supabase-js'
import { domainService } from '@/services/domainService'

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
        const email = session.user.email
        const isHardcodedAdmin = email === 'info369skills@gmail.com' || email === 'danubaba369@gmail.com' || email === 'abcd@artradering.com'
        
        // Immediately set admin status for hardcoded admins
        if (isHardcodedAdmin) {
          setIsAdmin(true)
        }

        try {
          const adminList = await domainService.listAdmins()
          setIsAdmin(isHardcodedAdmin || adminList.includes(email || ""))
        } catch (e) {
          console.error('Admin check failed:', e)
          // Fallback to hardcoded check if DB fails
          if (isHardcodedAdmin) setIsAdmin(true)
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
        const email = session.user.email
        const isHardcodedAdmin = email === 'info369skills@gmail.com' || email === 'danubaba369@gmail.com' || email === 'abcd@artradering.com'
        
        if (isHardcodedAdmin) setIsAdmin(true)

        try {
          const adminList = await domainService.listAdmins()
          setIsAdmin(isHardcodedAdmin || adminList.includes(email || ""))
        } catch (e) {
          console.error('Admin check failed in onAuthStateChange:', e)
          if (isHardcodedAdmin) setIsAdmin(true)
        }
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
    try {
      // 1. Sign out from Supabase
      await supabase.auth.signOut()
      
      // 2. Clear application-specific local state
      localStorage.removeItem('quamify_active_email')
      
      // 3. Clear session storage to ensure no ghost data
      sessionStorage.clear()
      
      // 4. Force a hard redirect to the home page to reset all React state
      // This is the most definitive way to ensure a fresh state after multiple cycles
      window.location.href = '/?logout=success'
    } catch (err) {
      console.error('Sign out failed:', err)
      window.location.href = '/'
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
