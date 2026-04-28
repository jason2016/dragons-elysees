import { useState, useEffect, useRef } from 'react'
import { api } from '../utils/api'
import { useLang } from '../hooks/useLang'
import styles from './DeliveryPanel.module.css'

const DELIVERY_PASSWORD = 'delivery2026'
const POLL_INTERVAL = 5000

export default function DeliveryPanel() {
  const { t, lang } = useLang()
  const [unlocked, setUnlocked] = useState(false)
  const [pwd, setPwd] = useState('')
  const [pwdError, setPwdError] = useState(false)
  const [orders, setOrders] = useState([])
  const intervalRef = useRef(null)

  const fetchOrders = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const [readyRes, pickedRes, deliveringRes] = await Promise.all([
        api.getOrders({ status: 'ready', order_type: 'delivery', date: today }),
        api.getOrders({ status: 'picked_up', order_type: 'delivery', date: today }),
        api.getOrders({ status: 'delivering', order_type: 'delivery', date: today }),
      ])
      const all = [
        ...(readyRes.orders || []),
        ...(pickedRes.orders || []),
        ...(deliveringRes.orders || []),
      ]
      // Sort: delivering first, then picked_up, then ready
      const rank = { delivering: 0, picked_up: 1, ready: 2 }
      all.sort((a, b) => {
        const ra = rank[a.status] ?? 3
        const rb = rank[b.status] ?? 3
        if (ra !== rb) return ra - rb
        return new Date(a.created_at) - new Date(b.created_at)
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
              lang={lang}
              t={t}
              onPickup={() => handleStatus(order.id, 'picked_up')}
              onDelivering={() => handleStatus(order.id, 'delivering')}
              onDelivered={() => handleStatus(order.id, 'delivered')}
            />
          ))
        )}
      </div>
    </div>
  )
}

// Mini progress: ready → picked_up → delivering → delivered
const DELIVERY_STEPS = ['ready', 'picked_up', 'delivering', 'delivered']
const STEP_ICONS = { ready: '📦', picked_up: '🚗', delivering: '🛵', delivered: '✅' }

function MiniProgress({ status, lang }) {
  const cur = DELIVERY_STEPS.indexOf(status)
  const labels = {
    fr: { ready: 'Prêt', picked_up: 'Récupéré', delivering: 'En route', delivered: 'Livré' },
    zh: { ready: '待取', picked_up: '已取', delivering: '配送', delivered: '已达' },
  }
  const lbl = labels[lang] || labels.fr
  return (
    <div className={styles.miniProgress}>
      {DELIVERY_STEPS.map((s, i) => (
        <div key={s} className={styles.miniStep}>
          <div className={styles.miniDotRow}>
            {i > 0 && <div className={`${styles.miniLine} ${i <= cur ? styles.miniLineActive : ''}`} />}
            <div className={`${styles.miniDot} ${i <= cur ? styles.miniDotActive : ''} ${i === cur ? styles.miniDotCurrent : ''}`}>
              {i <= cur ? STEP_ICONS[s] : '○'}
            </div>
            {i < DELIVERY_STEPS.length - 1 && <div className={`${styles.miniLine} ${i < cur ? styles.miniLineActive : ''}`} />}
          </div>
          <div className={`${styles.miniLabel} ${i <= cur ? styles.miniLabelActive : ''}`}>{lbl[s]}</div>
        </div>
      ))}
    </div>
  )
}

function DeliveryCard({ order, lang, t, onPickup, onDelivering, onDelivered }) {
  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || []
  const mapsUrl = order.delivery_address
    ? `https://maps.google.com/?q=${encodeURIComponent(order.delivery_address)}`
    : null

  return (
    <div className={`${styles.card} ${order.status === 'delivering' ? styles.cardDelivering : order.status === 'picked_up' ? styles.cardPickedUp : ''}`}>
      <div className={styles.cardHeader}>
        <span className={styles.orderNum}>{order.order_number}</span>
        <span className={styles.orderTime}>
          {new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <MiniProgress status={order.status} lang={lang} />

      {order.delivery_address && (
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.address}>
          📍 {order.delivery_address}
        </a>
      )}

      {order.guest_name && (
        <div className={styles.customer}>👤 {order.guest_name}</div>
      )}

      {order.delivery_phone && (
        <a href={`tel:${order.delivery_phone.replace(/\s/g, '')}`} className={styles.phone}>
          📞 {order.delivery_phone}
        </a>
      )}

      {order.delivery_instructions && (
        <div className={styles.instructions}>🏷️ {order.delivery_instructions}</div>
      )}

      <div className={styles.items}>
        📦 {items.map((item, i) => (
          <span key={i}>{item.qty}× {item.name?.zh || item.name_zh} / {item.name?.fr || item.name_fr}{i < items.length - 1 ? ', ' : ''}</span>
        ))}
      </div>

      <div className={styles.actions}>
        {order.status === 'ready' && (
          <button className={styles.btnPickup} onClick={onPickup}>
            {t('deliveryPickup')}
          </button>
        )}
        {order.status === 'picked_up' && (
          <button className={styles.btnDelivering} onClick={onDelivering}>
            🛵 配送中 · En livraison
          </button>
        )}
        {order.status === 'delivering' && (
          <button className={styles.btnDelivered} onClick={onDelivered}>
            {t('deliveryDelivered')}
          </button>
        )}
        {order.delivery_phone && (
          <a href={`tel:${order.delivery_phone.replace(/\s/g, '')}`} className={styles.btnCall}>
            {t('deliveryCall')}
          </a>
        )}
        {(order.status === 'picked_up' || order.status === 'delivering') && order.delivery_address && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.btnNav}>
            📍 导航 · Naviguer
          </a>
        )}
      </div>
    </div>
  )
}
