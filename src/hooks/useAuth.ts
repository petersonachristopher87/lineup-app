import { useEffect, useState } from 'react'
import { authService } from '@/lib/supabase/authService'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const { user: currentUser } = await authService.getCurrentUser()
        setUser(currentUser)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Auth error')
      } finally {
        setLoading(false)
      }
    })()

    const subscription = authService.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      setLoading(true)
      await authService.signOut()
      setUser(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out error')
    } finally {
      setLoading(false)
    }
  }

  const signInWithMagicLink = async (email: string) => {
    try {
      setLoading(true)
      setError(null)
      await authService.signInWithMagicLink(email)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in error')
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    error,
    signOut,
    signInWithMagicLink,
  }
}
