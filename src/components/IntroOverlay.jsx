import { useState, useEffect } from 'react'
import styles from './IntroOverlay.module.css'

/**
 * First-visit brand intro overlay.
 * Embeds the self-contained Canvas animation (public/intro.html) as a same-origin
 * full-screen iframe layered above the whole app. The iframe runs the 15s intro;
 * on "Entrer" it fades to warm gold and posts {type:'dragons-intro-enter'} to us
 * (see the bridge at the bottom of public/intro.html). We then mark it seen,
 * land on the homepage, fade the overlay out, and unmount — revealing the site.
 *
 * Shown only on the first visit (localStorage 'dragons_intro_seen').
 * - ?intro=1  → force replay (testing).
 * - prefers-reduced-motion → skipped entirely (accessibility).
 */
const INTRO_URL = `${import.meta.env.BASE_URL}intro.html`
const SEEN_KEY = 'dragons_intro_seen'

function decideShouldShow() {
  try {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return false
    const forceReplay = new URLSearchParams(window.location.search).get('intro') === '1'
    if (forceReplay) return true
    return localStorage.getItem(SEEN_KEY) !== '1'
  } catch {
    return false // never block the site if storage/matchMedia is unavailable
  }
}

export default function IntroOverlay() {
  const [visible, setVisible] = useState(decideShouldShow)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!visible) return
    const onMessage = (e) => {
      // Security: only accept our own same-origin intro message.
      if (e.origin !== window.location.origin) return
      if (!e.data || e.data.type !== 'dragons-intro-enter') return
      try { localStorage.setItem(SEEN_KEY, '1') } catch { /* ignore */ }
      // Route by the button the guest tapped: reservation page or homepage.
      window.location.hash = e.data.target === 'reservation' ? '#/reservation' : '#/'
      setLeaving(true)                        // fade the overlay out…
      setTimeout(() => setVisible(false), 600) // …then unmount, revealing the site
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [visible])

  if (!visible) return null

  return (
    <div className={`${styles.overlay} ${leaving ? styles.leaving : ''}`} aria-hidden="true">
      <iframe
        src={INTRO_URL}
        title="Dragons Élysées"
        className={styles.frame}
        allow="autoplay"
      />
    </div>
  )
}
