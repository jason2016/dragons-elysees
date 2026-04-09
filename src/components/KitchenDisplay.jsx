import { useState, useEffect, useRef } from 'react'
import { api } from '../utils/api'
import styles from './KitchenDisplay.module.css'

const KITCHEN_PASSWORD = 'dragons2026'
const POLL_INTERVAL = 15000

export default function KitchenDisplay() {
  const [unlocked, setUnlocked] = useState(false)
  const [pwd, setPwd] = useState('')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const intervalRef = useRef(null)

  const fetchOrders = async () => {
    try {
      const data = await api.getOrders({ status: 'paid,preparing' })
      setOrders(data.orders || [])
    } catch {
      // silent
    }
  }

  useEffect(() => {
    if (!unlocked) return
    fetchOrders()
    intervalRef.current = setInterval(fetchOrders, POLL_INTERVAL)
    return () => clearInterval(intervalRef.current)
  }, [unlocked])

  const markReady = async (orderId) => {
    try {
      await api.updateOrderStatus(orderId, 'ready')
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'ready' } : o))
    } catch {}
  }

  const markCompleted = async (orderId) => {
    try {
      await api.updateOrderStatus(orderId, 'completed')
      setOrders(prev => prev.filter(o => o.id !== orderId))
    } catch {}
  }

  if (!unlocked) {
    return (
      <div className={styles.lockScreen}>
        <div className={styles.lockBox}>
          <div className={styles.lockIcon}>🔒</div>
          <h2 className={styles.lockTitle}>Accès Cuisine</h2>
          <input
            type="password"
            className={styles.lockInput}
            placeholder="Mot de passe"
            value={pwd}
            onChange={e => setPwd(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && pwd === KITCHEN_PASSWORD && setUnlocked(true)}
          />
          <button
            className="btn-gold"
            onClick={() => { if (pwd === KITCHEN_PASSWORD) { setUnlocked(true) } else { alert('Mot de passe incorrect') } }}
          >
            Accéder
          </button>
        </div>
      </div>
    )
  }

  const preparing = orders.filter(o => o.status === 'paid' || o.status === 'preparing')
  const ready = orders.filter(o => o.status === 'ready')

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h1 className={styles.topTitle}>
          <span>龙城酒楼</span>
          <span className={styles.topSub}>Cuisine — {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
        </h1>
        <button className={styles.refreshBtn} onClick={fetchOrders}>
          ↻ Actualiser
        </button>
      </div>

      <div className={styles.columns}>
        {/* Preparing */}
        <div className={styles.column}>
          <div className={`${styles.colHeader} ${styles.colFire}`}>
            🔥 À préparer ({preparing.length})
          </div>
          <div className={styles.colBody}>
            {preparing.length === 0 ? (
              <div className={styles.colEmpty}>Aucune commande en attente</div>
            ) : (
              preparing.map(order => (
                <OrderCard key={order.id} order={order} onAction={() => markReady(order.id)} actionLabel="✓ Prêt" />
              ))
            )}
          </div>
        </div>

        {/* Ready */}
        <div className={styles.column}>
          <div className={`${styles.colHeader} ${styles.colReady}`}>
            ✅ Appel client ({ready.length})
          </div>
          <div className={styles.colBody}>
            {ready.length === 0 ? (
              <div className={styles.colEmpty}>Aucun plat prêt</div>
            ) : (
              ready.map(order => (
                <OrderCard key={order.id} order={order} onAction={() => markCompleted(order.id)} actionLabel="✓ Remis" blink />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function OrderCard({ order, onAction, actionLabel, blink }) {
  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || []
  const num = order.order_number?.replace('DRG-', '') || order.id

  return (
    <div className={`${styles.orderCard} ${blink ? styles.blink : ''}`}>
      <div className={styles.orderNum}>#{num}</div>
      {order.table_number && (
        <div className={styles.tableNum}>Table {order.table_number}</div>
      )}
      <div className={styles.orderItems}>
        {items.map((item, i) => (
          <div key={i} className={styles.orderItem}>
            <span className={styles.itemQty}>{item.qty}×</span>
            <span>{item.name_zh || item.name_fr}</span>
          </div>
        ))}
      </div>
      {order.note && (
        <div className={styles.orderNote}>📝 {order.note}</div>
      )}
      <button className={styles.actionBtn} onClick={onAction}>
        {actionLabel}
      </button>
    </div>
  )
}
