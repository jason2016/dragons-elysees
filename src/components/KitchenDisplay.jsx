import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../utils/api'
import { useLang } from '../hooks/useLang'
import styles from './KitchenDisplay.module.css'

const KITCHEN_PASSWORD = 'dragons2026'
const POLL_INTERVAL = 5000
const READY_AUTO_COMPLETE_MS = 10 * 60 * 1000 // 10 min

function playSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.value = 0.3
    osc.start()
    setTimeout(() => { osc.frequency.value = 1100 }, 150)
    setTimeout(() => { osc.stop(); ctx.close() }, 400)
  } catch (_) {}
}

export default function KitchenDisplay() {
  const { t } = useLang()
  const [unlocked, setUnlocked] = useState(false)
  const [pwd, setPwd] = useState('')
  const [pwdError, setPwdError] = useState(false)
  const [preparing, setPreparing] = useState([])
  const [ready, setReady] = useState([])
  const [soundOn, setSoundOn] = useState(true)
  const prevPrepCount = useRef(0)
  const intervalRef = useRef(null)

  const fetchOrders = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const [paidRes, readyRes] = await Promise.all([
        api.getOrders({ status: 'paid', date: today }),
        api.getOrders({ status: 'ready', date: today }),
      ])
      const newPreparing = paidRes.orders || []
      const newReady = readyRes.orders || []

      // Sound on new paid orders
      if (newPreparing.length > prevPrepCount.current && soundOn) {
        playSound()
      }
      prevPrepCount.current = newPreparing.length

      setPreparing(newPreparing)
      setReady(newReady)
    } catch (_) {}
  }, [soundOn])

  useEffect(() => {
    if (!unlocked) return
    fetchOrders()
    intervalRef.current = setInterval(fetchOrders, POLL_INTERVAL)
    return () => clearInterval(intervalRef.current)
  }, [unlocked, fetchOrders])

  // Auto-complete ready orders older than 10 min
  useEffect(() => {
    if (!unlocked || ready.length === 0) return
    const now = Date.now()
    ready.forEach(order => {
      const age = now - new Date(order.updated_at).getTime()
      if (age > READY_AUTO_COMPLETE_MS) {
        api.updateOrderStatus(order.id, 'completed').catch(() => {})
      }
    })
  }, [ready, unlocked])

  const markReady = async (orderId) => {
    await api.updateOrderStatus(orderId, 'ready').catch(() => {})
    setPreparing(prev => prev.filter(o => o.id !== orderId))
    fetchOrders()
  }

  const markCompleted = async (orderId) => {
    await api.updateOrderStatus(orderId, 'completed').catch(() => {})
    setReady(prev => prev.filter(o => o.id !== orderId))
  }

  const handleUnlock = () => {
    if (pwd === KITCHEN_PASSWORD) { setUnlocked(true); setPwdError(false) }
    else { setPwdError(true) }
  }

  if (!unlocked) {
    return (
      <div className={styles.lockScreen}>
        <div className={styles.lockBox}>
          <div className={styles.lockIcon}>🍳</div>
          <h2 className={styles.lockTitle}>Accès Cuisine</h2>
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
        <h1 className={styles.topTitle}>
          🍳 龙城酒楼 — Cuisine
          <span className={styles.clock}>
            {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </h1>
        <div className={styles.topActions}>
          <button
            className={`${styles.iconBtn} ${soundOn ? styles.iconBtnOn : ''}`}
            onClick={() => setSoundOn(s => !s)}
            title="Son"
          >
            {soundOn ? '🔊' : '🔇'}
          </button>
          <button className={styles.iconBtn} onClick={fetchOrders} title="Actualiser">↻</button>
        </div>
      </div>

      <div className={styles.columns}>
        {/* Left: preparing */}
        <div className={styles.column}>
          <div className={`${styles.colHeader} ${styles.colFire}`}>
            🔥 {t('kitchenPreparing')} ({preparing.length})
          </div>
          <div className={styles.colBody}>
            {preparing.length === 0
              ? <div className={styles.colEmpty}>{t('kitchenNoOrders')}</div>
              : preparing.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAction={() => markReady(order.id)}
                  actionLabel={t('kitchenMarkReady')}
                />
              ))
            }
          </div>
        </div>

        {/* Right: ready */}
        <div className={styles.column}>
          <div className={`${styles.colHeader} ${styles.colReady}`}>
            ✅ {t('kitchenReady')} ({ready.length})
          </div>
          <div className={styles.colBody}>
            {ready.length === 0
              ? <div className={styles.colEmpty}>{t('kitchenNoReady')}</div>
              : ready.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAction={() => markCompleted(order.id)}
                  actionLabel={t('kitchenMarkDone')}
                  blink
                />
              ))
            }
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        🔄 {t('kitchenPreparing').toLowerCase()} — actualisation auto 5s
      </div>
    </div>
  )
}

function OrderCard({ order, onAction, actionLabel, blink }) {
  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || []
  const num = order.order_number?.replace('DRG-', '') || order.id
  const isDelivery = order.order_type === 'delivery'
  const readyAt = order.updated_at ? new Date(order.updated_at) : null
  const minutesAgo = readyAt ? Math.floor((Date.now() - readyAt.getTime()) / 60000) : null

  return (
    <div className={`${styles.orderCard} ${blink ? styles.blink : ''}`}>
      <div className={styles.orderHeader}>
        <span className={styles.orderNum}>#{num}</span>
        {isDelivery
          ? <span className={styles.deliveryBadge}>🚗 Livraison</span>
          : order.table_number
            ? <span className={styles.tableBadge}>Table {order.table_number}</span>
            : null
        }
      </div>

      {isDelivery && order.delivery_address && (
        <div className={styles.deliveryAddr}>📍 {order.delivery_address.slice(0, 40)}</div>
      )}

      <div className={styles.orderItems}>
        {items.map((item, i) => (
          <div key={i} className={styles.orderItem}>
            <span className={styles.itemQty}>{item.qty}×</span>
            <span>{item.name_zh || item.name_fr}</span>
          </div>
        ))}
      </div>

      {order.note && <div className={styles.orderNote}>📝 {order.note}</div>}

      <div className={styles.orderFooter}>
        <span className={styles.orderTime}>
          {new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          {blink && minutesAgo !== null && ` · ${minutesAgo}min`}
        </span>
        <button className={styles.actionBtn} onClick={onAction}>{actionLabel}</button>
      </div>
    </div>
  )
}
