import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import { formatPrice } from '../utils/api'
import styles from './PaymentSuccess.module.css'

const GOOGLE_REVIEW_URL = 'https://search.google.com/local/writereview?placeid=ChIJGZMEfMFv5kcRwVHuMf-SVS4'

export default function PaymentSuccess() {
  const { isLoggedIn, customer } = useAuth()
  const { t } = useLang()
  const [order, setOrder] = useState(null)

  useEffect(() => {
    const saved = sessionStorage.getItem('de-last-order')
    if (saved) setOrder(JSON.parse(saved))
  }, [])

  if (!order) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.icon}>✅</div>
          <h1 className={styles.title}>{t('confirmed')}</h1>
          <Link to="/menu" className="btn-gold">{t('backToMenu')}</Link>
        </div>
      </div>
    )
  }

  const orderNum = order.order_number?.replace('DRG-', '') || '—'

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.successRing}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.checkIcon}>
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <h1 className={styles.title}>{t('confirmed')}</h1>
        <p className={styles.orderNum}>{t('orderNumber')}</p>
        <div className={styles.ticketNum}>#{orderNum}</div>
        <p className={styles.waitHint}>{t('waitHint')}</p>

        <div className={styles.card}>
          <div className={styles.detailRow}>
            <span>{t('subtotal')}</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          {order.balance_used > 0 && (
            <div className={`${styles.detailRow} ${styles.green}`}>
              <span>{t('balanceUsed')}</span>
              <span>− {formatPrice(order.balance_used)}</span>
            </div>
          )}
          <div className={`${styles.detailRow} ${styles.bold}`}>
            <span>{t('paid')}</span>
            <span>{formatPrice(order.total_paid)}</span>
          </div>
        </div>

        {order.cashback_earned > 0 && isLoggedIn && (
          <div className={styles.cashbackCard}>
            <div className={styles.cashbackIcon}>🎁</div>
            <div>
              <div className={styles.cashbackTitle}>
                {t('cashbackEarned', formatPrice(order.cashback_earned))}
              </div>
              <div className={styles.cashbackSub}>
                {t('cashbackCredited', formatPrice(customer?.balance || 0))}
              </div>
            </div>
          </div>
        )}

        {order.cashback_earned > 0 && !isLoggedIn && (
          <div className={styles.cashbackCardGhost}>
            <div className={styles.cashbackIcon}>💡</div>
            <div>
              <div className={styles.cashbackTitle}>
                {t('loginForCashbackSuccess', formatPrice(order.cashback_earned))}
              </div>
              <div className={styles.cashbackSub}>
                <Link to="/account/login" className={styles.loginLink}>{t('createAccount')}</Link>
              </div>
            </div>
          </div>
        )}

        <div className={styles.reviewCard}>
          <div className={styles.reviewStars}>⭐⭐⭐⭐⭐</div>
          <h2 className={styles.reviewTitle}>{t('howWasIt')}</h2>
          <p className={styles.reviewSub}>{t('reviewSub')}</p>
          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.reviewBtn}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t('leaveReview')}
          </a>
        </div>

        <Link to="/menu" className="btn-ghost" style={{ marginTop: 8 }}>
          {t('newOrder')}
        </Link>
      </div>
    </div>
  )
}
