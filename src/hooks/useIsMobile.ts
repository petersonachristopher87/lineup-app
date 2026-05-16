import { useSyncExternalStore } from 'react'

const QUERY = '(max-width: 767px)'

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {}
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(QUERY).matches
}

function getServerSnapshot(): boolean {
  return false
}

/**
 * `true` when the viewport is narrower than Tailwind's `md` breakpoint
 * (≤ 767px). Used to switch the lineup page into its phone-friendly mode
 * for in-game dugout edits.
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
