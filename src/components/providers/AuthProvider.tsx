'use client'

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type User, type Session } from '@supabase/supabase-js'
import { domainService } from '@/services/domainService'

interface AuthContextType {
  user: User | null
  session: Session | null
  isAdmin: boolean | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAdmin: null,
  isLoading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Memoize supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let mounted = true;

    const checkAdminStatus = async (userEmail: string | undefined) => {
      if (!userEmail) return false;
      
      try {
        const settings = await domainService.getSettings()
        const masterAdmin = settings.admin_email || 'info369skills@gmail.com'
        
        // Check master admin or developer backup
        if (userEmail === masterAdmin || userEmail === 'info369skills@gmail.com' || userEmail === 'danubaba369@gmail.com') {
          return true;
        }
        
        const adminList = await domainService.listAdmins()
        return adminList.includes(userEmail)
      } catch (e) {
        console.error('Admin check failed:', e)
        return userEmail === 'info369skills@gmail.com';
      }
    };

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          setIsLoading(false)

          if (session?.user) {
            const adminStatus = await checkAdminStatus(session.user.email)
            if (mounted) setIsAdmin(adminStatus)
          } else {
            setIsAdmin(false)
          }
        }
      } catch (e) {
        console.error('Initial state check failed:', e)
        if (mounted) {
          setIsAdmin(false)
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      setSession(currentSession)
      setUser(currentSession?.user ?? null)

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || (event === 'INITIAL_SESSION' && currentSession)) {
        setIsAdmin(null) // Checking...
        const adminStatus = await checkAdminStatus(currentSession?.user?.email)
        if (mounted) setIsAdmin(adminStatus)
      } else if (event === 'SIGNED_OUT') {
        setIsAdmin(false)
      }
      
      setIsLoading(false)
    })

    return () => {
      mounted = false;
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    try {
      setIsLoading(true)
      await supabase.auth.signOut()
      localStorage.clear()
      sessionStorage.clear()
      // Clear cookies for double insurance
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      window.location.href = '/'
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
