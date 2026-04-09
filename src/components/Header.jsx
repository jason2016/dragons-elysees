import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import styles from './Header.module.css'

export default function Header() {
  const { count } = useCart()
  const { isLoggedIn, customer } = useAuth()
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <header className={`${styles.header} ${isHome ? styles.transparent : styles.solid}`}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoZh}>龙城酒楼</span>
          <span className={styles.logoDivider}>·</span>
          <span className={styles.logoFr}>Dragons Elysées</span>
        </Link>

        <nav className={styles.nav}>
          <Link to="/menu" className={styles.navLink}>
            Menu
          </Link>
          {isLoggedIn ? (
            <Link to="/account" className={styles.navLink}>
              <span className={styles.accountDot} />
              {customer?.name || customer?.email?.split('@')[0]}
            </Link>
          ) : (
            <Link to="/account/login" className={styles.navLink}>
              Connexion
            </Link>
          )}
          <Link to="/menu" className={styles.cartBtn} aria-label="Panier">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {count > 0 && <span className={styles.cartBadge}>{count}</span>}
          </Link>
        </nav>
      </div>
    </header>
  )
}
