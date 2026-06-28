import { Link, useLocation } from 'react-router-dom'
import { useLang } from '../hooks/useLang'
import styles from './PaymentSuccess.module.css'

// Dine-in (post-pay) confirmation: the order is PLACED (status 'ordered'), NOT paid.
// No payment, no status PATCH — the order goes to the kitchen and is settled at the table later.
export default function OrderPlaced() {
  const { t } = useLang()
  const location = useLocation()

  let params = new URLSearchParams(location.search)
  let orderNum = params.get('order') || ''
  let table = params.get('table') || ''
  if (!orderNum) {
    const hp = new URLSearchParams(window.location.hash.split('?')[1] || '')
    orderNum = hp.get('order') || ''
    table = table || hp.get('table') || ''
  }
  const num = (orderNum || '').replace('DRG-', '') || '—'

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.successRing}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.checkIcon}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className={styles.title}>{t('postpay.title')}</h1>
        <p className={styles.orderNum}>{t('orderNumber')}</p>
        <div className={styles.ticketNum}>#{num}</div>
        {table && (
          <p className={styles.tableHint}>🍽️ {t('success.tableHint', { table })}</p>
        )}
        <p className={styles.waitHint}>👨‍🍳 {t('postpay.kitchen')}</p>

        <div className={styles.card}>
          <p style={{ textAlign: 'center', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
            💳 {t('postpay.desc')}
          </p>
        </div>

        <Link to="/menu" className="btn-ghost" style={{ marginTop: 8 }}>
          {t('newOrder')}
        </Link>
      </div>
    </div>
  )
}
