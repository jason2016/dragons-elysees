import { useState, useEffect } from 'react'
import { api, formatPrice } from '../utils/api'
import styles from './AdminPanel.module.css'

const ADMIN_PASSWORD = 'admin2026'

export default function AdminPanel() {
  const [unlocked, setUnlocked] = useState(false)
  const [pwd, setPwd] = useState('')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [dateFilter, setDateFilter] = useState(() => new Date().toISOString().split('T')[0])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const data = await api.getOrders({ date: dateFilter })
      setOrders(data.orders || [])
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (unlocked) fetchOrders()
  }, [unlocked, dateFilter])

  if (!unlocked) {
    return (
      <div className={styles.lockScreen}>
        <div className={styles.lockBox}>
          <div className={styles.lockIcon}>⚙️</div>
          <h2>Admin</h2>
          <input
            type="password"
            className={styles.input}
            placeholder="Mot de passe admin"
            value={pwd}
            onChange={e => setPwd(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && pwd === ADMIN_PASSWORD && setUnlocked(true)}
          />
          <button className="btn-gold" onClick={() => { if (pwd === ADMIN_PASSWORD) { setUnlocked(true) } else { alert('Mot de passe incorrect') } }}>
            Accéder
          </button>
        </div>
      </div>
    )
  }

  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total_paid || 0), 0)
  const totalOrders = orders.filter(o => o.status !== 'cancelled').length
  const totalCashback = orders.reduce((s, o) => s + (o.cashback_earned || 0), 0)

  const statusLabel = {
    pending: 'En attente',
    paid: 'Payé',
    preparing: 'En préparation',
    ready: 'Prêt',
    completed: 'Servi',
    cancelled: 'Annulé',
  }

  const statusColor = {
    pending: '#6b6355',
    paid: '#4285F4',
    preparing: '#ff9944',
    ready: '#4caf7d',
    completed: '#6b6355',
    cancelled: '#c13b3b',
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h1 className={styles.title}>
          <span className={styles.titleZh}>龙城酒楼</span>
          Administration
        </h1>
        <input
          type="date"
          className={styles.dateInput}
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
        />
      </div>

      <div className={styles.content}>
        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{totalOrders}</div>
            <div className={styles.statLabel}>Commandes</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{formatPrice(totalRevenue)}</div>
            <div className={styles.statLabel}>Chiffre d'affaires</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{formatPrice(totalCashback)}</div>
            <div className={styles.statLabel}>Cashback distribué</div>
          </div>
        </div>

        {/* Orders */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Commandes du {new Date(dateFilter).toLocaleDateString('fr-FR')}</h2>
            <button className={styles.refreshBtn} onClick={fetchOrders}>↻ Actualiser</button>
          </div>

          {loading ? (
            <div className={styles.loading}>Chargement…</div>
          ) : orders.length === 0 ? (
            <div className={styles.empty}>Aucune commande pour cette date.</div>
          ) : (
            <div className={styles.table}>
              <div className={styles.tableHead}>
                <span>Commande</span>
                <span>Heure</span>
                <span>Table</span>
                <span>Montant</span>
                <span>Statut</span>
              </div>
              {orders.map(order => (
                <div key={order.id} className={styles.tableRow}>
                  <span className={styles.orderNum}>{order.order_number}</span>
                  <span className={styles.muted}>{new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className={styles.muted}>{order.table_number || '—'}</span>
                  <span className={styles.price}>{formatPrice(order.total_paid)}</span>
                  <span className={styles.statusBadge} style={{ '--color': statusColor[order.status] }}>
                    {statusLabel[order.status] || order.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
