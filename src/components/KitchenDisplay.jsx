import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '../utils/api'
import { useLang } from '../hooks/useLang'
import { FEATURES } from '../config'
import styles from './KitchenDisplay.module.css'

const KITCHEN_PASSWORD = 'dragons2026'
const POLL_INTERVAL = 5000

// Single reused AudioContext (lazy). Browsers gate audio behind a user gesture; the kitchen unlock
// click ("Accéder") resumes it via unlockAudio(), after which the big screen can beep indefinitely.
let _audioCtx = null
function _ctx() {
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  } catch (_) { return null }
  return _audioCtx
}
function _tone(freq, duration, startDelay = 0) {
  setTimeout(() => {
    const ctx = _ctx()
    if (!ctx) return
    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = freq; osc.type = 'sine'; gain.gain.value = 0.3
      osc.start()
      setTimeout(() => { try { osc.stop() } catch (_) {} }, duration * 1000)
    } catch (_) {}
  }, startDelay)
}
// Distinct cues so runners can tell them apart by ear.
function playNewOrderSound() { _tone(660, 0.15, 0); _tone(880, 0.3, 180) }          // new order: two-tone
function playReadySound() { _tone(523, 0.15, 0); _tone(659, 0.15, 180); _tone(784, 0.35, 360) } // ready: rising arpeggio
function unlockAudio() {
  const ctx = _ctx()
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {})
}

export default function KitchenDisplay() {
  const { t } = useLang()
  const [unlocked, setUnlocked] = useState(false)
  const [pwd, setPwd] = useState('')
  const [pwdError, setPwdError] = useState(false)
  const [newOrders, setNewOrders] = useState([])       // dine_in 'ordered' + takeaway/delivery 'paid'
  const [cooking, setCooking] = useState([])            // status=preparing
  const [readyDineIn, setReadyDineIn] = useState([])   // status=ready, dine_in
  const [readyDelivery, setReadyDelivery] = useState([]) // status=ready, delivery
  const [soundOn, setSoundOn] = useState(true)
  const [newlyReady, setNewlyReady] = useState(() => new Set())  // ready order ids to blink (~9s)
  const prevNewIds = useRef(new Set())
  const prevReadyIds = useRef(new Set())
  const firstPoll = useRef(true)   // first load only fills the refs — no alert for pre-existing orders
  const intervalRef = useRef(null)

  const fetchOrders = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const [orderedRes, paidRes, preparingRes, readyRes] = await Promise.all([
        api.getOrders({ status: 'ordered', date: today }),
        api.getOrders({ status: 'paid', date: today }),
        api.getOrders({ status: 'preparing', date: today }),
        api.getOrders({ status: 'ready', date: today }),
      ])
      // New kitchen queue, by order_type (post-pay step 2):
      //  - dine_in 'ordered'        → POST-PAY: cook before settlement
      //  - takeaway/delivery 'paid' → PRE-PAY: only AFTER payment
      // EXCLUDED: dine_in 'paid' (= settled at the table, done). And 'pending' is NEVER fetched,
      // so an unpaid takeaway/delivery order can never reach the kitchen (red line).
      const newOrd = [
        ...((orderedRes.orders || []).filter(o => o.order_type === 'dine_in')),
        ...((paidRes.orders || []).filter(o => o.order_type !== 'dine_in')),
      ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      const prepOrd = preparingRes.orders || []
      const readyOrd = readyRes.orders || []

      // Detect by ID set (not count — count misses a simultaneous in+out). First poll only seeds
      // the refs so we don't alert for orders already on screen at load.
      const newIds = new Set(newOrd.map(o => o.id))
      const readyIds = new Set(readyOrd.map(o => o.id))
      if (firstPoll.current) {
        firstPoll.current = false
      } else {
        const hasFreshNew = [...newIds].some(id => !prevNewIds.current.has(id))
        const freshReady = [...readyIds].filter(id => !prevReadyIds.current.has(id))
        if (soundOn && hasFreshNew) playNewOrderSound()
        if (freshReady.length > 0) {
          if (soundOn) playReadySound()
          setNewlyReady(prev => {
            const n = new Set(prev)
            freshReady.forEach(id => n.add(id))
            return n
          })
          freshReady.forEach(id => setTimeout(() => setNewlyReady(prev => {
            const n = new Set(prev); n.delete(id); return n
          }), 9000))
        }
      }
      prevNewIds.current = newIds
      prevReadyIds.current = readyIds

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
    if (pwd === KITCHEN_PASSWORD) { setUnlocked(true); setPwdError(false); unlockAudio() }  // unlock audio on the gesture
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
            onClick={() => setSoundOn(s => { if (!s) unlockAudio(); return !s })}
            title="Son"
          >
            {soundOn ? '🔊' : '🔇'}
          </button>
          <button className={styles.iconBtn} onClick={fetchOrders} title="Actualiser">↻</button>
        </div>
      </div>

      {FEATURES.delivery ? (
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
            blinkIds={newlyReady}
          />
          {/* Column 4: Ready – delivery waiting */}
          <KitchenColumn
            header={`🚗 ${t('kitchenWaitingDelivery')} (${readyDelivery.length})`}
            colorClass={styles.colDelivery}
            orders={readyDelivery}
            actionLabel={null}
            onAction={null}
            emptyMsg={t('kitchenNoReady')}
            blinkIds={newlyReady}
          />
        </div>
      ) : (
        <div className={styles.columns}>
          {/* Left: En préparation (new + cooking merged) */}
          <div className={styles.column}>
            <div className={`${styles.colHeader} ${styles.colFire}`}>
              🔥 En préparation ({newOrders.length + cooking.length})
            </div>
            <div className={styles.colBody}>
              {newOrders.length === 0 && cooking.length === 0
                ? <div className={styles.colEmpty}>{t('kitchenNoOrders')}</div>
                : [...newOrders, ...cooking]
                    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                    .map(order => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        blink={order.status === 'preparing'}
                        actionLabel={order.status === 'preparing' ? t('kitchenMarkReady') : t('kitchenStartCooking')}
                        onAction={() => markStatus(order.id, order.status === 'preparing' ? 'ready' : 'preparing')}
                      />
                    ))
              }
            </div>
          </div>
          {/* Right: Prêt — À récupérer */}
          <KitchenColumn
            header={`✅ Prêt — À récupérer (${readyDineIn.length})`}
            colorClass={styles.colReady}
            orders={readyDineIn}
            actionLabel={t('kitchenMarkDone')}
            onAction={id => markStatus(id, 'completed')}
            emptyMsg={t('kitchenNoReady')}
            blinkIds={newlyReady}
          />
        </div>
      )}

      <div className={styles.footer}>
        🔄 actualisation auto 5s
      </div>
    </div>
  )
}

function KitchenColumn({ header, colorClass, orders, actionLabel, onAction, emptyMsg, blink, blinkIds }) {
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
              blink={blinkIds ? blinkIds.has(order.id) : blink}
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
            <div className={styles.orderItemMain}>
              <span className={styles.itemQty}>{item.qty}×</span>
              <span>
                {item.type === 'set_menu' ? '🍱 ' : ''}
                {item.name?.zh || item.name_zh} / {item.name?.fr || item.name_fr}
              </span>
            </div>
            {item.type === 'set_menu' && Array.isArray(item.selections) && (
              <div className={styles.setMenuLines}>
                {item.selections.map(sel => (
                  <div key={sel.key} className={styles.setMenuLine}>
                    <span className={styles.setMenuCourse}>{sel.label?.fr || sel.key}:</span>
                    <span>{sel.name?.zh || ''} / {sel.name?.fr || ''}</span>
                  </div>
                ))}
              </div>
            )}
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
