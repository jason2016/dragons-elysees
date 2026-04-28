import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import styles from './Header.module.css'

const LANGUAGES = [
  { code: 'fr', label: 'Français', short: 'FR'   },
  { code: 'zh', label: '中文',     short: '中文'  },
  { code: 'en', label: 'English',  short: 'EN'   },
  { code: 'es', label: 'Español',  short: 'ES'   },
]

export default function Header() {
  const { count, openCart } = useCart()
  const { isLoggedIn, customer } = useAuth()
  const { lang, changeLang, t } = useLang()
  const location = useLocation()
  const isHome = location.pathname === '/'

  const [open, setOpen] = useState(false)
  const dropRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0]

  return (
    <header className={`${styles.header} ${isHome ? styles.transparent : styles.solid}`}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          <img
            src="https://longcheng.futushow.org/assets/images/logo5.png"
            alt="Dragons Elysées 龙城酒楼"
            className={styles.logoImg}
          />
        </Link>

        <nav className={styles.nav}>
          <Link to="/menu" className={styles.navLink}>
            {t('menu')}
          </Link>

          {isLoggedIn ? (
            <Link to="/account" className={styles.navLink}>
              <span className={styles.accountDot} />
              {customer?.name || customer?.email?.split('@')[0]}
            </Link>
          ) : (
            <Link to="/account/login" className={styles.navLink}>
              {t('login')}
            </Link>
          )}

          {/* Language dropdown */}
          <div className={styles.langDropdown} ref={dropRef}>
            <button
              className={styles.langBtn}
              onClick={() => setOpen(o => !o)}
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-label="Select language"
            >
              {current.short}
              <span className={styles.langArrow}>{open ? '▴' : '▾'}</span>
            </button>

            {open && (
              <ul className={styles.langMenu} role="listbox" aria-label="Language">
                {LANGUAGES.map(l => (
                  <li key={l.code}>
                    <button
                      className={`${styles.langOption} ${l.code === lang ? styles.langOptionActive : ''}`}
                      role="option"
                      aria-selected={l.code === lang}
                      onClick={() => { changeLang(l.code); setOpen(false) }}
                    >
                      <span className={styles.langCheck}>
                        {l.code === lang ? '✓' : ''}
                      </span>
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Cart */}
          <button
            className={styles.cartBtn}
            onClick={openCart}
            aria-label={t('cartTitle')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {count > 0 && <span className={styles.cartBadge}>{count}</span>}
          </button>
        </nav>
      </div>
    </header>
  )
}
