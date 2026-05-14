import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

type Mode = 'signin' | 'signup' | 'forgot' | 'magic'

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const {
    signInWithPassword,
    signUpWithPassword,
    sendPasswordResetEmail,
    signInWithMagicLink,
  } = useAuth()

  const reset = () => {
    setFormError(null)
    setInfo(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    reset()
    setBusy(true)
    try {
      if (mode === 'signin') {
        await signInWithPassword(email, password)
      } else if (mode === 'signup') {
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters.')
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords don't match.")
        }
        await signUpWithPassword(email, password)
        setInfo(
          'Account created. Check your email to confirm your address, then come back and sign in.'
        )
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(email)
        setInfo(`If an account exists for ${email}, a reset link is on the way.`)
      } else if (mode === 'magic') {
        await signInWithMagicLink(email)
        setInfo(`Magic link sent to ${email}. Click it to sign in.`)
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const title =
    mode === 'signin'
      ? 'Sign in'
      : mode === 'signup'
      ? 'Create your account'
      : mode === 'forgot'
      ? 'Reset your password'
      : 'Email me a sign-in link'

  const submitLabel =
    mode === 'signin'
      ? busy
        ? 'Signing in…'
        : 'Sign in'
      : mode === 'signup'
      ? busy
        ? 'Creating account…'
        : 'Create account'
      : mode === 'forgot'
      ? busy
        ? 'Sending…'
        : 'Send reset link'
      : busy
      ? 'Sending…'
      : 'Send magic link'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Lineup Manager
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Coach your team with fairness and confidence
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 text-left">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email-address"
                className="block text-sm font-semibold text-gray-900"
              >
                Email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
              />
            </div>

            {(mode === 'signin' || mode === 'signup') && (
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-900"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={
                    mode === 'signup' ? 'new-password' : 'current-password'
                  }
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={mode === 'signup' ? 'At least 8 characters' : ''}
                />
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-semibold text-gray-900"
                >
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {formError && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm font-medium text-red-800">{formError}</p>
              </div>
            )}

            {info && (
              <div className="rounded-md bg-green-50 p-3">
                <p className="text-sm font-medium text-green-800">{info}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitLabel}
            </button>
          </form>

          <div className="mt-4 space-y-2 text-sm text-gray-700">
            {mode === 'signin' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    reset()
                    setMode('forgot')
                  }}
                  className="text-blue-700 hover:text-blue-900 font-semibold"
                >
                  Forgot your password?
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">New here?</span>
                  <button
                    type="button"
                    onClick={() => {
                      reset()
                      setMode('signup')
                    }}
                    className="text-blue-700 hover:text-blue-900 font-semibold"
                  >
                    Create an account
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    reset()
                    setMode('magic')
                  }}
                  className="text-blue-700 hover:text-blue-900 font-semibold"
                >
                  Email me a sign-in link instead
                </button>
              </>
            )}
            {mode !== 'signin' && (
              <button
                type="button"
                onClick={() => {
                  reset()
                  setMode('signin')
                }}
                className="text-blue-700 hover:text-blue-900 font-semibold"
              >
                ← Back to sign in
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-500">
          By continuing you agree to our{' '}
          <Link to="/terms" className="text-blue-700 hover:underline">
            Terms
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-blue-700 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
