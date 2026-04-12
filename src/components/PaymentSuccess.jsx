import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import { api, formatPrice } from '../utils/api'
import OrderProgress from './OrderProgress'
import styles from './PaymentSuccess.module.css'

const GOOGLE_REVIEW_URL = 'https://search.google.com/local/writereview?placeid=ChIJGZMEfMFv5kcRwVHuMf-SVS4'

export default function PaymentSuccess() {
  const { isLoggedIn, customer, updateBalance } = useAuth()
  const { t, lang } = useLang()
  const location = useLocation()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const guestEmail = sessionStorage.getItem('de-guest-email') || ''

  useEffect(() => {
    async function init() {
      // HashRouter: React Router puts ?order= into location.search for internal navigates.
      // But when Stancer redirects back to:
      //   https://host/dragons-elysees/#/payment-success?order=DRG-008
      // the browser treats everything after # as the hash fragment, so React Router
      // correctly parses ?order= into location.search.
      // Belt-and-suspenders: also parse directly from window.location.hash.
      let orderNum = new URLSearchParams(location.search).get('order') || ''
      if (!orderNum) {
        const hashQuery = window.location.hash.split('?')[1] || ''
        orderNum = new URLSearchParams(hashQuery).get('order') || ''
      }

      // Load cached order written by Checkout before navigating away
      let cached = null
      try {
        const raw = sessionStorage.getItem('de-last-order')
        if (raw) cached = JSON.parse(raw)
      } catch (_) {}

      // Path A: cache matches (or no URL order param to check against)
      if (cached?.id && (!orderNum || cached.order_number === orderNum)) {
        // Always PATCH to paid — triggers cashback; idempotent on backend
        try {
          const paidOrder = await api.updateOrderStatus(cached.id, 'paid')
          const refreshed = toDisplay(paidOrder)
          setOrder(refreshed)
          sessionStorage.setItem('de-last-order', JSON.stringify(refreshed))
          if (isLoggedIn) {
            try { const me = await api.getMe(); updateBalance(me.balance) } catch (_) {}
          }
        } catch (_) {
          setOrder(cached)
        }
        return
      }

      // Path B: no matching cache → fetch from backend by order_number, then PATCH
      if (orderNum) {
        try {
          const result = await api.getOrders({ order_number: orderNum })
          const found = result?.orders?.[0]
          if (found) {
            try {
              const paidOrder = await api.updateOrderStatus(found.id, 'paid')
              const refreshed = toDisplay(paidOrder)
              setOrder(refreshed)
              sessionStorage.setItem('de-last-order', JSON.stringify(refreshed))
              if (isLoggedIn) {
                try { const me = await api.getMe(); updateBalance(me.balance) } catch (_) {}
              }
            } catch (_) {
              setOrder(toDisplay(found))
            }
          }
        } catch (_) {}
      }
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  const orderNum = (order.order_number || '').replace('DRG-', '') || '—'
  const balanceUsed = order.balance_used ?? 0
  const cashbackEarned = order.cashback_earned ?? 0
  const isDelivery = order.order_type === 'delivery'

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
        {/* Dine-in: table number + wait hint */}
        {!isDelivery && order.table_number && (
          <p className={styles.tableHint}>
            🍽️ {lang === 'zh' ? `桌号 ${order.table_number}` : `Table ${order.table_number}`}
          </p>
        )}
        <p className={styles.waitHint}>
          {isDelivery
            ? (lang === 'zh' ? '我们正在为您准备外送订单' : 'Votre commande est en cours de préparation')
            : t('waitHint')
          }
        </p>

        {/* Delivery only: progress bar + tracking link */}
        {isDelivery && order.status && (
          <div className={styles.card}>
            <OrderProgress order={order} lang={lang} />
          </div>
        )}
        {isDelivery && order.order_number && (
          <Link to={`/track/${order.order_number}`} className={styles.trackLink}>
            📋 {lang === 'zh' ? '追踪我的订单' : 'Suivre ma commande'}
          </Link>
        )}

        {/* Receipt download */}
        {order.id && (
          <a
            href={api.getReceiptUrl(order.id)}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.receiptBtn}
            download
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="11" x2="12" y2="17"/>
              <polyline points="9 14 12 17 15 14"/>
            </svg>
            {lang === 'zh' ? '下载收据 PDF' : 'Télécharger le reçu'}
          </a>
        )}

        {/* Amount breakdown */}
        <div className={styles.card}>
          <div className={styles.detailRow}>
            <span>{t('subtotal')}</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          {balanceUsed > 0 && (
            <div className={`${styles.detailRow} ${styles.green}`}>
              <span>{t('balanceUsed')}</span>
              <span>− {formatPrice(balanceUsed)}</span>
            </div>
          )}
          <div className={`${styles.detailRow} ${styles.bold}`}>
            <span>{t('paid')}</span>
            <span>{formatPrice(order.total_paid)}</span>
          </div>
        </div>

        {/* Cashback earned */}
        {cashbackEarned > 0 && isLoggedIn && (
          <div className={styles.cashbackCard}>
            <div className={styles.cashbackIcon}>🎁</div>
            <div>
              <div className={styles.cashbackTitle}>
                {t('cashbackEarned', formatPrice(cashbackEarned))}
              </div>
              <div className={styles.cashbackSub}>
                {t('cashbackCredited', formatPrice(customer?.balance || 0))}
              </div>
            </div>
          </div>
        )}

        {/* Register prompt for non-logged-in users */}
        {cashbackEarned > 0 && !isLoggedIn && (
          <div className={styles.registerCard}>
            <div className={styles.registerTitle}>
              {t('registerPromptTitle', formatPrice(cashbackEarned))}
            </div>
            <div className={styles.registerDesc}>{t('registerPromptDesc')}</div>
            <button
              className={styles.registerBtn}
              onClick={() => {
                if (guestEmail) sessionStorage.setItem('de-prefill-email', guestEmail)
                navigate('/account/login')
              }}
            >
              {t('registerButton')}
            </button>
          </div>
        )}

        {/* Google review */}
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

// Normalize backend order → display shape (unified field names)
function toDisplay(order) {
  return {
    id: order.id,
    order_number: order.order_number,
    order_type: order.order_type ?? 'dine_in',
    subtotal: order.subtotal,
    delivery_fee: order.delivery_fee ?? 0,
    delivery_address: order.delivery_address ?? '',
    balance_used: order.cashback_used ?? order.balance_used ?? 0,
    total_paid: order.total_paid,
    cashback_earned: order.cashback_earned ?? 0,
    status: order.status ?? 'paid',
    table_number: order.table_number ?? '',
    items: order.items ?? [],
  }
}
