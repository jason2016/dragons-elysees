import { createContext, useContext, useState, useCallback, useEffect } from 'react'

/**
 * Tracks how many fullscreen panels (set-menu selector, dish detail) are open.
 * Used so the bottom InstallPrompt banner can hide while a fullscreen panel is up
 * (otherwise it overlaps the panel's bottom action buttons).
 * Counter-based so overlapping opens don't prematurely un-hide.
 */
const FullscreenContext = createContext(null)

export function FullscreenProvider({ children }) {
  const [count, setCount] = useState(0)
  const open = useCallback(() => setCount(c => c + 1), [])
  const close = useCallback(() => setCount(c => Math.max(0, c - 1)), [])
  return (
    <FullscreenContext.Provider value={{ anyFullscreenOpen: count > 0, open, close }}>
      {children}
    </FullscreenContext.Provider>
  )
}

export function useFullscreen() {
  const ctx = useContext(FullscreenContext)
  // Safe no-op fallback if a component is rendered outside the provider.
  return ctx || { anyFullscreenOpen: false, open: () => {}, close: () => {} }
}

/** Call inside a fullscreen panel component; registers open on mount, close on unmount. */
export function useRegisterFullscreen() {
  const { open, close } = useFullscreen()
  useEffect(() => {
    open()
    return close
  }, [open, close])
}
