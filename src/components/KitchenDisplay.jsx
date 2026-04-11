import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../utils/api'
import { useLang } from '../hooks/useLang'
import styles from './KitchenDisplay.module.css'

const KITCHEN_PASSWORD = 'dragons2026'
const POLL_INTERVAL = 5000

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
  const [newOrders, setNewOrders] = useState([])       // status=paid
  const [cooking, setCooking] = useState([])            // status=preparing
  const [readyDineIn, setReadyDineIn] = useState([])   // status=ready, dine_in
  const [readyDelivery, setReadyDelivery] = useState([]) // status=ready, delivery
  const [soundOn, setSoundOn] = useState(true)
  const prevNewCount = useRef(0)
  const intervalRef = useRef(null)

  const fetchOrders = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const [paidRes, preparingRes, readyRes] = await Promise.all([
        api.getOrders({ status: 'paid', date: today }),
        api.getOrders({ status: 'preparing', date: today }),
        api.getOrders({ status: 'ready', date: today }),
      ])
      const newOrd = paidRes.orders || []
      const prepOrd = preparingRes.orders || []
      const readyOrd = readyRes.orders || []

      if (newOrd.length > prevNewCount.current && soundOn) playSound()
      prevNewCount.current = newOrd.length

      setNewOrders(newOrd)
      setCooking(prepOrd)
      setReadyDineIn(readyOrd.filter(o => o.order_type !== 'delivery'))
      setReadyDelivery(readyOrd.filter(o => o.order_type === 'delivery'))
    } catch (_) {}
  }, [soundOn])

  useEffect(() => {
    if (!unlocked) return
    fetchOrders()
    intervalRef.current = setInterval(fetchOrders, POLL_INTERVAL)
    return () => clearInterval(intervalRef.current)
  }, [unlocked, fetchOrders])

  const markStatus = async (orderId, status, changedBy = 'kitchen') => {
    await api.updateOrderStatus(orderId, status).catch(() => {})
    fetchOrders()
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

      <div className={styles.columns4}>
        {/* Column 1: New orders */}
        <KitchenColumn
          header={`📥 ${t('kitchenNewOrders')} (${newOrders.length})`}
          colorClass={styles.colNew}
          orders={newOrders}
          actionLabel={t('kitchenStartCooking')}
          onAction={id => markStatus(id, 'preparing')}
          emptyMsg={t('kitchenNoOrders')}
        />

        {/* Column 2: Cooking */}
        <KitchenColumn
          header={`🔥 ${t('kitchenCooking')} (${cooking.length})`}
          colorClass={styles.colFire}
          orders={cooking}
          actionLabel={t('kitchenMarkReady')}
          onAction={id => markStatus(id, 'ready')}
          emptyMsg={t('kitchenNoOrders')}
          blink
        />

        {/* Column 3: Ready – dine-in */}
        <KitchenColumn
          header={`✅ ${t('kitchenReadyPickup')} (${readyDineIn.length})`}
          colorClass={styles.colReady}
          orders={readyDineIn}
          actionLabel={t('kitchenMarkDone')}
          onAction={id => markStatus(id, 'completed')}
          emptyMsg={t('kitchenNoReady')}
        />

        {/* Column 4: Ready – delivery waiting */}
        <KitchenColumn
          header={`🚗 ${t('kitchenWaitingDelivery')} (${readyDelivery.length})`}
          colorClass={styles.colDelivery}
          orders={readyDelivery}
          actionLabel={null}
          onAction={null}
          emptyMsg={t('kitchenNoReady')}
        />
      </div>

      <div className={styles.footer}>
        🔄 actualisation auto 5s
      </div>
    </div>
  )
}

function KitchenColumn({ header, colorClass, orders, actionLabel, onAction, emptyMsg, blink }) {
  return (
    <div className={styles.column}>
      <div className={`${styles.colHeader} ${colorClass}`}>{header}</div>
      <div className={styles.colBody}>
        {orders.length === 0
          ? <div className={styles.colEmpty}>{emptyMsg}</div>
          : orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onAction={onAction ? () => onAction(order.id) : null}
              actionLabel={actionLabel}
              blink={blink}
            />
          ))
        }
      </div>
    </div>
  )
}

function OrderCard({ order, onAction, actionLabel, blink }) {
  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || []
  const num = order.order_number?.replace('DRG-', '') || order.id
  const isDelivery = order.order_type === 'delivery'
  const updatedAt = order.updated_at ? new Date(order.updated_at) : null
  const minutesAgo = updatedAt ? Math.floor((Date.now() - updatedAt.getTime()) / 60000) : null

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

      {(order.guest_name || order.delivery_address) && (
        <div className={styles.customerInfo}>
          {order.guest_name && <span>👤 {order.guest_name}</span>}
          {order.guest_phone && <span>📞 {order.guest_phone}</span>}
        </div>
      )}

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
        {onAction && actionLabel && (
          <button className={styles.actionBtn} onClick={onAction}>{actionLabel}</button>
        )}
      </div>
    </div>
  )
}
