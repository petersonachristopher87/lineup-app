import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface Props {
  open: boolean
  currentEmail: string
  onClose: () => void
}

export function ChangeEmailDialog({ open, currentEmail, onClose }: Props) {
  const { updateEmail } = useAuth()
  const [newEmail, setNewEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (open) {
      setNewEmail('')
      setError(null)
      setSent(false)
    }
  }, [open])

  if (!open) return null

  const handleSave = async () => {
    const trimmed = newEmail.trim()
    if (!trimmed || trimmed === currentEmail) {
      setError('Enter a new email address.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await updateEmail(trimmed)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update email.')
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
          <h2 className="text-lg font-bold text-gray-900">Change email</h2>
          <p className="text-xs text-gray-600 mt-0.5">
            We'll send a confirmation link to your new address.
          </p>
        </div>

        <div className="px-4 py-3 space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Current</p>
            <p className="text-sm text-gray-700">{currentEmail}</p>
          </div>

          <label className="block">
            <span className="block text-sm font-semibold text-gray-900">
              New email
            </span>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={sent}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white disabled:bg-gray-100"
              autoFocus
            />
          </label>

          {sent && (
            <div className="rounded-md bg-green-50 p-3">
              <p className="text-sm font-medium text-green-800">
                Check <strong>{newEmail}</strong> for a confirmation link. Your
                email won't change until you click it.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-3 py-1.5 text-sm font-semibold text-gray-900 bg-white border border-gray-400 rounded hover:bg-gray-100 disabled:opacity-50"
          >
            {sent ? 'Close' : 'Cancel'}
          </button>
          {!sent && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 text-sm font-bold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Sending…' : 'Send confirmation'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
