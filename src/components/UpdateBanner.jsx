import { useState, useEffect } from 'react'
import { useLang } from '../hooks/useLang'

// HF3 — "a newer build is live" bar. main.jsx raises `dragons-sw-updated` when the new
// service worker takes over; the page in front of the user is then the previous build.
// One tap reloads. We never auto-reload: that risks a loop and could discard form input.
export default function UpdateBanner() {
  const { t } = useLang()
  const [show, setShow] = useState(false)

  useEffect(() => {
    const on = () => setShow(true)
    window.addEventListener('dragons-sw-updated', on)
    return () => window.removeEventListener('dragons-sw-updated', on)
  }, [])

  if (!show) return null
  return (
    <button
      onClick={() => window.location.reload()}
      style={{
        position: 'fixed', left: '50%', transform: 'translateX(-50%)',
        bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', zIndex: 1200,
        maxWidth: 'calc(100vw - 24px)', padding: '10px 18px', borderRadius: 999,
        border: '1px solid rgba(201,168,76,0.55)', background: 'rgba(20,18,12,0.96)',
        color: 'var(--accent-gold, #c9a84c)', font: '600 13.5px/1.3 var(--font-body, system-ui)',
        cursor: 'pointer', boxShadow: '0 6px 24px rgba(0,0,0,0.45)', whiteSpace: 'nowrap',
        overflow: 'hidden', textOverflow: 'ellipsis',
      }}
    >
      ↻ {t('swUpdateReady')}
    </button>
  )
}
