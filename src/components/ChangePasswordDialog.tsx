import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface Props {
  open: boolean
  onClose: () => void
}

export function ChangePasswordDialog({ open, onClose }: Props) {
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (open) {
      setPassword('')
      setConfirm('')
      setShowPassword(false)
      setError(null)
      setDone(false)
    }
  }, [open])

  if (!open) return null

  const handleSave = async () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await updatePassword(password)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Reset password</h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Choose a new password. You'll stay signed in on this device.
          </p>
        </div>

        <div className="px-4 py-3 space-y-3">
          {done ? (
            <div className="rounded-md bg-green-50 p-3">
              <p className="text-sm font-medium text-green-800">
                Password updated.
              </p>
            </div>
          ) : (
            <>
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
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                />
              </label>

              {error && (
                <div className="rounded-md bg-red-50 p-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-3 py-1.5 text-sm font-semibold text-gray-900 bg-white border border-gray-400 rounded hover:bg-gray-100 disabled:opacity-50"
          >
            {done ? 'Close' : 'Cancel'}
          </button>
          {!done && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 text-sm font-bold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Update password'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
