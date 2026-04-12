import { useState, useEffect, useRef } from 'react'
import { api, formatPrice } from '../utils/api'
import { useLang } from '../hooks/useLang'
import styles from './AdminPanel.module.css'

const ADMIN_PASSWORD = 'admin2026'

const STATUS_LABEL = {
  fr: { pending: 'En attente', paid: '🔥 Payé', ready: '✅ Prêt', delivering: '🚗 En livraison', completed: 'Servi', cancelled: 'Annulé' },
  zh: { pending: '待付款', paid: '🔥 已付款', ready: '✅ 已完成', delivering: '🚗 配送中', completed: '已服务', cancelled: '已取消' },
}
const STATUS_COLOR = {
  pending: '#6b6355', paid: '#4285F4', ready: '#4caf7d',
  delivering: '#ff9944', completed: '#6b6355', cancelled: '#c13b3b',
}

export default function AdminPanel() {
  const { t, lang } = useLang()
  const [unlocked, setUnlocked] = useState(false)
  const [pwd, setPwd] = useState('')
  const [pwdError, setPwdError] = useState(false)
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dateFilter, setDateFilter] = useState(() => new Date().toISOString().split('T')[0])
  const [statusFilter, setStatusFilter] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ordersRes, statsRes] = await Promise.all([
        api.getOrders({ date: dateFilter }),
        api.getStats(dateFilter),
      ])
      setOrders(ordersRes.orders || [])
      setStats(statsRes)
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (unlocked) fetchData()
  }, [unlocked, dateFilter])

  const handleUnlock = () => {
    if (pwd === ADMIN_PASSWORD) { setUnlocked(true); setPwdError(false) }
    else { setPwdError(true) }
  }

  if (!unlocked) {
    return (
      <div className={styles.lockScreen}>
        <div className={styles.lockBox}>
          <div className={styles.lockIcon}>⚙️</div>
          <h2 className={styles.lockTitle}>{t('adminTitle')}</h2>
          <input
            type="password"
            className={`${styles.input} ${pwdError ? styles.inputError : ''}`}
            placeholder="Mot de passe admin"
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

  const displayed = statusFilter ? orders.filter(o => o.status === statusFilter) : orders
  const statusLabels = STATUS_LABEL[lang] || STATUS_LABEL.fr

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h1 className={styles.title}>
          <span className={styles.titleZh}>龙城酒楼</span>
          {t('adminTitle')}
        </h1>
        <div className={styles.topRight}>
          <input
            type="date"
            className={styles.dateInput}
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
          />
          <button className={styles.refreshBtn} onClick={fetchData}>↻</button>
        </div>
      </div>

      <div className={styles.content}>
        {/* Stats */}
        <div className={styles.stats}>
          <StatCard icon="📦" value={stats?.total_orders ?? orders.length} label={t('adminOrders')} />
          <StatCard icon="💰" value={formatPrice(stats?.revenue ?? 0)} label={t('adminRevenue')} />
          <StatCard icon="🎁" value={formatPrice(stats?.cashback_issued ?? 0)} label={t('adminCashback')} />
          <StatCard icon="🍽️" value={stats?.by_type?.dine_in ?? '—'} label={t('adminDineIn')} />
          <StatCard icon="🚗" value={stats?.by_type?.delivery ?? '—'} label={t('adminDelivery')} />
          <StatCard icon="💳" value={stats?.by_type?.balance_only ?? '—'} label={t('adminBalance')} />
        </div>

        {/* Orders */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              {lang === 'zh'
                ? `${new Date(dateFilter + 'T00:00:00').toLocaleDateString('zh-CN')} 订单`
                : `Commandes du ${new Date(dateFilter + 'T00:00:00').toLocaleDateString('fr-FR')}`
              }
            </h2>
            <select
              className={styles.statusSelect}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">{t('adminAllStatuses')}</option>
              {Object.keys(STATUS_LABEL.fr).map(s => (
                <option key={s} value={s}>{statusLabels[s]}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className={styles.loading}>Chargement…</div>
          ) : displayed.length === 0 ? (
            <div className={styles.empty}>Aucune commande pour cette date.</div>
          ) : (
            <div className={styles.table}>
              <div className={styles.tableHead}>
                <span>Commande</span>
                <span>Heure</span>
                <span>Type</span>
                <span>Montant</span>
                <span>Statut</span>
              </div>
              {displayed.map(order => (
                <div key={order.id}>
                  <div
                    className={styles.tableRow}
                    onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                  >
                    <span className={styles.orderNum}>{order.order_number}</span>
                    <span className={styles.muted}>
                      {new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={styles.typeBadge}>
                      {order.order_type === 'delivery' ? '🚗' : '🍽️'}
                    </span>
                    <span className={styles.price}>{formatPrice(order.total_paid)}</span>
                    <span
                      className={styles.statusBadge}
                      style={{ '--color': STATUS_COLOR[order.status] || '#6b6355' }}
                    >
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>
                  {expandedId === order.id && (
                    <OrderDetail order={order} lang={lang} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, value, label }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  )
}

function OrderDetail({ order, lang }) {
  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || []
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)

  return (
    <div className={styles.orderDetail}>
      <div className={styles.detailItems}>
        {items.map((item, i) => (
          <div key={i} className={styles.detailItem}>
            <span>{item.qty}× {lang === 'zh' ? (item.name_zh || item.name_fr) : (item.name_fr || item.name_zh)}</span>
            <span>{formatPrice(item.price * item.qty)}</span>
          </div>
        ))}
      </div>
      <div className={styles.detailMeta}>
        {order.guest_name && <span>👤 {order.guest_name}</span>}
        {order.guest_phone && <span>📞 {order.guest_phone}</span>}
        {order.table_number && <span>🍽️ Table {order.table_number}</span>}
        {order.delivery_address && <span>📍 {order.delivery_address}</span>}
        {order.delivery_phone && order.delivery_phone !== order.guest_phone && <span>📞 {order.delivery_phone}</span>}
        {order.note && <span>📝 {order.note}</span>}
        <span>💳 {order.payment_method}</span>
        {order.cashback_used > 0 && <span>🎁 Balance: −{formatPrice(order.cashback_used)}</span>}
        {order.cashback_earned > 0 && <span>✨ Cashback: +{formatPrice(order.cashback_earned)}</span>}
      </div>
      {/* Receipt / Invoice actions */}
      <div className={styles.detailActions}>
        <a
          href={api.getReceiptUrl(order.id)}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.pdfBtn}
          download
        >
          📄 Reçu
        </a>
        <button className={styles.pdfBtn} onClick={() => setShowInvoiceForm(v => !v)}>
          📄 Facture
        </button>
      </div>
      {showInvoiceForm && (
        <InvoiceForm orderId={order.id} onClose={() => setShowInvoiceForm(false)} />
      )}
    </div>
  )
}

function InvoiceForm({ orderId, onClose }) {
  const [company, setCompany] = useState('')
  const [address, setAddress] = useState('')
  const [vat, setVat] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!company.trim() || !address.trim()) { setError('Entreprise et adresse requis'); return }
    setLoading(true); setError('')
    try {
      const blob = await api.createInvoice(orderId, {
        client_company: company,
        client_address: address,
        client_vat_number: vat,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `facture-${orderId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.invoiceForm}>
      <h4 className={styles.invoiceTitle}>📄 Générer une facture</h4>
      <input
        className={styles.invoiceInput}
        placeholder="Entreprise *"
        value={company}
        onChange={e => setCompany(e.target.value)}
      />
      <input
        className={styles.invoiceInput}
        placeholder="Adresse *"
        value={address}
        onChange={e => setAddress(e.target.value)}
      />
      <input
        className={styles.invoiceInput}
        placeholder="N° TVA (optionnel)"
        value={vat}
        onChange={e => setVat(e.target.value)}
      />
      {error && <span className={styles.invoiceError}>{error}</span>}
      <div className={styles.invoiceActions}>
        <button className={styles.invoiceGenBtn} onClick={handleGenerate} disabled={loading}>
          {loading ? '…' : 'Générer la facture'}
        </button>
        <button className={styles.invoiceCancelBtn} onClick={onClose}>Annuler</button>
      </div>
    </div>
  )
}
