import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { EditProfileDialog } from '@/components/EditProfileDialog'
import { ChangeEmailDialog } from '@/components/ChangeEmailDialog'
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog'

const FEEDBACK_EMAIL = 'peterson.a.christopher@gmail.com'

function initialsFor(user: { email?: string | null; user_metadata?: any } | null): string {
  if (!user) return '?'
  const name = (user.user_metadata?.full_name as string | undefined)?.trim()
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0]!.slice(0, 2).toUpperCase()
  }
  const email = user.email ?? ''
  return email.slice(0, 1).toUpperCase() || '?'
}

export function ProfileMenu() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [changeEmailOpen, setChangeEmailOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const displayName = (user?.user_metadata?.full_name as string | undefined) || ''
  const initials = initialsFor(user)

  const handleLogout = async () => {
    setOpen(false)
    await signOut()
    navigate('/login')
  }

  const openItem = (action: () => void) => () => {
    setOpen(false)
    action()
  }

  return (
    <>
      <div ref={ref} className="relative">
        <button
          type="button"
          aria-label="Account menu"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {initials}
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {displayName || 'Signed in'}
              </p>
              <p className="text-xs text-gray-600 truncate">{user?.email}</p>
            </div>

            <div className="py-1">
              <MenuItem onClick={openItem(() => setEditProfileOpen(true))}>
                Edit profile
              </MenuItem>
              <MenuItem onClick={openItem(() => setChangeEmailOpen(true))}>
                Change email
              </MenuItem>
              <MenuItem onClick={openItem(() => setChangePasswordOpen(true))}>
                Reset password
              </MenuItem>
            </div>

            <div className="py-1 border-t border-gray-200">
              <MenuItem onClick={openItem(() => navigate('/privacy'))}>
                Privacy policy
              </MenuItem>
              <MenuItem onClick={openItem(() => navigate('/terms'))}>
                Terms of service
              </MenuItem>
              <MenuItem
                onClick={openItem(() => {
                  const subject = encodeURIComponent('Lineup Manager feedback')
                  window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}`
                })}
              >
                Send feedback
              </MenuItem>
            </div>

            <div className="py-1 border-t border-gray-200">
              <MenuItem onClick={handleLogout} variant="danger">
                Log out
              </MenuItem>
            </div>
          </div>
        )}
      </div>

      <EditProfileDialog
        open={editProfileOpen}
        currentName={displayName}
        onClose={() => setEditProfileOpen(false)}
      />
      <ChangeEmailDialog
        open={changeEmailOpen}
        currentEmail={user?.email ?? ''}
        onClose={() => setChangeEmailOpen(false)}
      />
      <ChangePasswordDialog
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </>
  )
}

function MenuItem({
  children,
  onClick,
  variant = 'default',
}: {
  children: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
}) {
  const color =
    variant === 'danger'
      ? 'text-red-700 hover:bg-red-50'
      : 'text-gray-900 hover:bg-gray-100'
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`w-full text-left px-4 py-2 text-sm font-medium ${color}`}
    >
      {children}
    </button>
  )
}
