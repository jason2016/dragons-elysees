import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import { formatPrice } from '../utils/api'
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
            src="/dragons-elysees/icons/logo5.png"
            alt="Dragons Elysées 龙城酒楼"
            className={styles.logoImg}
          />
        </Link>

        <nav className={styles.nav}>
          <Link to="/menu" className={styles.navLink}>
            {t('menu')}
          </Link>

          <Link to="/reservation" className={styles.navLink}>
            {t('reservation.nav')}
          </Link>

          {isLoggedIn ? (
            <Link to="/account" className={styles.navLink}>
              <span className={styles.accountDot} />
              {customer?.name || customer?.email?.split('@')[0]}
              {customer?.balance > 0 && (
                <span className={styles.balanceBadge}>{formatPrice(customer.balance)}</span>
              )}
            </Link>
          ) : (
            <Link to="/account/login" className={styles.navLink}>
              {t('signIn')}
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
            {/* Plate + crossed utensils (lucide UtensilsCrossed) — dining/order icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/>
              <path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Z"/>
              <path d="m2.1 21.8 6.4-6.3"/>
              <path d="m19 5-7 7"/>
            </svg>
            {count > 0 && <span className={styles.cartBadge}>{count}</span>}
          </button>
        </nav>
      </div>
    </header>
  )
}
