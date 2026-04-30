import { supabase } from './client'

export const authService = {
  async signInWithMagicLink(email: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    return { session: data.session, error }
  },

  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser()
    return { user: data.user, error }
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    const { data } = supabase.auth.onAuthStateChange(callback)
    return data.subscription
  },
}
