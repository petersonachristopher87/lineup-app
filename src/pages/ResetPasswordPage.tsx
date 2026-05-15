import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/lib/supabase/authService'
import { useAuth } from '@/hooks/useAuth'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { updatePassword } = useAuth()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  // Supabase puts the recovery token in the URL hash and fires a session
  // when the page loads. Wait for that session before letting the user submit.
  useEffect(() => {
    let active = true
    ;(async () => {
      const { session } = await authService.getSession()
      if (active && session) setReady(true)
    })()
    const sub = authService.onAuthStateChange((event, session) => {
      if (!active) return
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true)
    })
    return () => {
      active = false
      sub?.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }
    setSaving(true)
    try {
      await updatePassword(password)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Set a new password
          </h2>
        </div>

        <div className="bg-white shadow rounded-lg p-6 text-left">
          {done ? (
            <div className="space-y-4">
              <div className="rounded-md bg-green-50 p-3">
                <p className="text-sm font-medium text-green-800">
                  Password updated. You can now sign in with your new password.
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2 px-4 text-sm font-bold rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Go to sign in
              </button>
            </div>
          ) : !ready ? (
            <p className="text-sm text-gray-700">
              Verifying your reset link…
            </p>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="flex items-center justify-between">
                  <span className="block text-sm font-semibold text-gray-900">
                    New password
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  placeholder="At least 8 characters"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  autoFocus
                />
              </label>
              <label className="block">
                <span className="block text-sm font-semibold text-gray-900">
                  Confirm new password
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                />
              </label>

              {error && (
                <div className="rounded-md bg-red-50 p-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2 px-4 text-sm font-bold rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Set password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
