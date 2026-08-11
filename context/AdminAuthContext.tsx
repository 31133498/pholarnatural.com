'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useHydrated } from '@/lib/use-hydrated'

/**
 * ============================ THIS IS NOT REAL AUTHENTICATION ============================
 *
 * There is no backend this sprint (doc §3.0 puts FastAPI in week 2), so there is nothing to
 * authenticate against. This is a client-side gate whose only job is to make the admin screens
 * demonstrable and to keep the shape of the real flow.
 *
 * Anyone can read the passphrase out of the JavaScript bundle, and anyone can set the
 * sessionStorage key by hand. It keeps nobody out.
 *
 * Week 2 replaces this with `POST /api/admin/login` (doc §3.2) issuing an httpOnly session
 * cookie, and the route protection moves to `proxy.ts` (Next 16 renamed `middleware`) so an
 * unauthenticated request never reaches the admin pages at all.
 * ========================================================================================
 */

const SESSION_KEY = 'pholar-admin-session-v1'

/** Demo passphrase. Not a secret — see the warning above. */
const DEMO_PASSPHRASE = process.env.NEXT_PUBLIC_ADMIN_DEMO_PASSPHRASE ?? 'pholar2026'

interface AdminAuthContextValue {
  authenticated: boolean
  /** False until sessionStorage has been read; gate rendering on this to avoid a flash. */
  ready: boolean
  signIn: (passphrase: string) => boolean
  signOut: () => void
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  // Seeded lazily on the first client render; `ready` stays false through hydration, so nothing
  // that depends on the session is rendered before the server and client agree.
  const [authenticated, setAuthenticated] = useState(
    () => typeof window !== 'undefined' && window.sessionStorage.getItem(SESSION_KEY) === 'true',
  )
  const ready = useHydrated()

  const signIn = useCallback((passphrase: string) => {
    if (passphrase !== DEMO_PASSPHRASE) return false
    window.sessionStorage.setItem(SESSION_KEY, 'true')
    setAuthenticated(true)
    return true
  }, [])

  const signOut = useCallback(() => {
    window.sessionStorage.removeItem(SESSION_KEY)
    setAuthenticated(false)
  }, [])

  const value = useMemo(
    () => ({ authenticated, ready, signIn, signOut }),
    [authenticated, ready, signIn, signOut],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used inside <AdminAuthProvider>')
  return ctx
}

export { DEMO_PASSPHRASE }
