import { useState, useEffect, useRef } from 'react'
import { api } from '../utils/api'
import { useLang } from '../hooks/useLang'
import styles from './DeliveryPanel.module.css'

const DELIVERY_PASSWORD = 'delivery2026'
const POLL_INTERVAL = 5000

export default function DeliveryPanel() {
  const { t } = useLang()
  const [unlocked, setUnlocked] = useState(false)
  const [pwd, setPwd] = useState('')
  const [pwdError, setPwdError] = useState(false)
  const [orders, setOrders] = useState([])
  const intervalRef = useRef(null)

  const fetchOrders = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      // Fetch ready+delivering delivery orders
      const [readyRes, deliveringRes] = await Promise.all([
        api.getOrders({ status: 'ready', order_type: 'delivery', date: today }),
        api.getOrders({ status: 'delivering', order_type: 'delivery', date: today }),
      ])
      const all = [...(readyRes.orders || []), ...(deliveringRes.orders || [])]
      // Sort: delivering first, then ready
      all.sort((a, b) => {
        if (a.status === b.status) return new Date(a.created_at) - new Date(b.created_at)
        return a.status === 'delivering' ? -1 : 1
      })
      setOrders(all)
    } catch (_) {}
  }

  useEffect(() => {
    if (!unlocked) return
    fetchOrders()
    intervalRef.current = setInterval(fetchOrders, POLL_INTERVAL)
    return () => clearInterval(intervalRef.current)
  }, [unlocked])

  const handleStatus = async (orderId, newStatus) => {
    await api.updateOrderStatus(orderId, newStatus).catch(() => {})
    fetchOrders()
  }

  const handleUnlock = () => {
    if (pwd === DELIVERY_PASSWORD) { setUnlocked(true); setPwdError(false) }
    else { setPwdError(true) }
  }

  if (!unlocked) {
    return (
      <div className={styles.lockScreen}>
        <div className={styles.lockBox}>
          <div className={styles.lockIcon}>🚗</div>
          <h2 className={styles.lockTitle}>Accès Livraison</h2>
          <input
            type="password"
            className={`${styles.lockInput} ${pwdError ? styles.inputError : ''}`}
            placeholder="Mot de passe"
            value={pwd}
            onChange={e => { setPwd(e.target.value); setPwdError(false) }}
            onKeyDown={e => e.key === 'Enter' && handleUnlock()}
            autoFocus
          />
          {pwdError && <p className={styles.errorMsg}>Mot de passe incorrect</p>}
          <button className="btn-gold" onClick={handleUnlock}>Accéder</button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h1 className={styles.title}>🚗 {t('deliveryTitle')}</h1>
        <span className={styles.count}>{orders.length} en cours</span>
      </div>

      <div className={styles.list}>
        {orders.length === 0 ? (
          <div className={styles.empty}>{t('deliveryNoOrders')}</div>
        ) : (
          orders.map(order => (
            <DeliveryCard
              key={order.id}
              order={order}
              onPickup={() => handleStatus(order.id, 'delivering')}
              onDelivered={() => handleStatus(order.id, 'completed')}
              t={t}
            />
          ))
        )}
      </div>
    </div>
  )
}

function DeliveryCard({ order, onPickup, onDelivered, t }) {
  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || []
  const isDelivering = order.status === 'delivering'
  const mapsUrl = order.delivery_address
    ? `https://maps.google.com/?q=${encodeURIComponent(order.delivery_address)}`
    : null

  return (
    <div className={`${styles.card} ${isDelivering ? styles.cardDelivering : ''}`}>
      <div className={styles.cardHeader}>
        <span className={styles.orderNum}>{order.order_number}</span>
        <span className={`${styles.statusBadge} ${isDelivering ? styles.statusDelivering : styles.statusReady}`}>
          {isDelivering ? `🟢 ${t('deliveryEnRoute')}` : `🟡 ${t('deliveryWaiting')}`}
        </span>
      </div>

      {order.delivery_address && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.address}
        >
          📍 {order.delivery_address}
        </a>
      )}

      {order.delivery_phone && (
        <div className={styles.phone}>📞 {order.delivery_phone}</div>
      )}

      {order.delivery_instructions && (
        <div className={styles.instructions}>🏷️ {order.delivery_instructions}</div>
      )}

      <div className={styles.items}>
        📦 {items.map((item, i) => (
          <span key={i}>{item.qty}× {item.name_zh || item.name_fr}{i < items.length - 1 ? ', ' : ''}</span>
        ))}
      </div>

      <div className={styles.time}>
        {new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </div>

      <div className={styles.actions}>
        {!isDelivering && (
          <button className={styles.btnPickup} onClick={onPickup}>
            {t('deliveryPickup')}
          </button>
        )}
        {isDelivering && (
          <button className={styles.btnDelivered} onClick={onDelivered}>
            {t('deliveryDelivered')}
          </button>
        )}
        {order.delivery_phone && (
          <a href={`tel:${order.delivery_phone.replace(/\s/g, '')}`} className={styles.btnCall}>
            {t('deliveryCall')}
          </a>
        )}
      </div>
    </div>
  )
}
