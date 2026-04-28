import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import styles from './Header.module.css'

export default function Header() {
  const { count, openCart } = useCart()
  const { isLoggedIn, customer } = useAuth()
  const { toggle, t } = useLang()
  const location = useLocation()
  const isHome = location.pathname === '/'

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

          {/* Language toggle */}
          <button
            className={styles.langBtn}
            onClick={toggle}
            aria-label="Changer la langue"
            title={t('header.langTooltip')}
          >
            {t('header.langLabel')}
          </button>

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
