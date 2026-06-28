import { useState, useEffect, useRef } from 'react'
import { api, formatPrice } from '../utils/api'
import { useLang } from '../hooks/useLang'
import styles from './AdminPanel.module.css'

const ADMIN_PASSWORD = 'admin2026'

const STATUS_LABEL = {
  fr: { ordered: '🍽️ Commandé', pending: 'En attente', paid: '🔥 Payé', preparing: '🔥 En cuisine', ready: '✅ Prêt', delivering: '🚗 En livraison', completed: 'Servi', cancelled: 'Annulé' },
  zh: { ordered: '🍽️ 待制作', pending: '待付款', paid: '🔥 已付款', preparing: '🔥 制作中', ready: '✅ 已完成', delivering: '🚗 配送中', completed: '已服务', cancelled: '已取消' },
}
const STATUS_COLOR = {
  ordered: '#d4a300', pending: '#6b6355', paid: '#4285F4', preparing: '#ff7a44', ready: '#4caf7d',
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
  const [hidePaid, setHidePaid] = useState(false)   // toggle hides settled ROWS only — summary still counts them

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

  // Row filters: status dropdown + "hide settled" toggle. NOTE: summary/stats below are computed
  // from the full `orders`/`stats` (NOT `displayed`) — settled orders stay counted even when hidden.
  const displayed = orders.filter(o =>
    (!statusFilter || o.status === statusFilter) &&
    (!hidePaid || o.payment_status !== 'paid')
  )
  const statusLabels = STATUS_LABEL[lang] || STATUS_LABEL.fr
  // Daily by-status summary (get_stats already returns by_status — just surface it)
  const bs = stats?.by_status || {}
  const sumEnCours = (bs.ordered || 0) + (bs.preparing || 0)
  const sumReady = bs.ready || 0
  const sumSettled = bs.paid || 0
  // dine_in post-pay orders not yet settled (table-side checkout queue)
  const pendingSettle = orders.filter(
    o => o.order_type === 'dine_in' && o.payment_status === 'unpaid' && o.status !== 'cancelled'
  )

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

        {/* Daily by-status summary — always counts ALL orders (incl. settled), independent of the
            "hide settled" row toggle below. */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '2px 0 4px' }}>
          <SummaryChip color="#d4a300" label={t('adminEnCours')} value={sumEnCours} />
          <SummaryChip color="#4caf7d" label={t('adminReady')} value={sumReady} />
          <SummaryChip color="#4285F4" label={t('adminSettled')} value={sumSettled} />
        </div>

        {/* À encaisser — dine_in post-pay settlement queue */}
        {pendingSettle.length > 0 && (
          <div className={styles.card} style={{ borderLeft: '4px solid #d4a300' }}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>💰 À encaisser · 待结账 ({pendingSettle.length})</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0' }}>
              {pendingSettle.map(o => (
                <SettleRow key={o.id} order={o} statusLabels={statusLabels} onSettled={fetchData} />
              ))}
            </div>
          </div>
        )}

        {/* Orders */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              {`Commandes du ${new Date(dateFilter + 'T00:00:00').toLocaleDateString('fr-FR')} · ${new Date(dateFilter + 'T00:00:00').toLocaleDateString('zh-CN')} 订单`}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={hidePaid} onChange={e => setHidePaid(e.target.checked)} />
                {t('adminHidePaid')}
              </label>
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
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span
                        className={styles.statusBadge}
                        style={{ '--color': STATUS_COLOR[order.status] || '#6b6355' }}
                      >
                        {statusLabels[order.status] || order.status}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 999,
                        color: order.payment_status === 'paid' ? '#166534' : '#9a3412',
                        background: order.payment_status === 'paid' ? '#dcfce7' : '#ffedd5',
                      }}>
                        {order.payment_status === 'paid' ? t('payStatusPaid') : t('payStatusUnpaid')}
                      </span>
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

// Daily status-count chip (summary; always reflects ALL orders, incl. settled)
function SummaryChip({ color, label, value }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px',
      borderRadius: 999, background: '#fff', border: `1px solid ${color}33`, fontSize: 13,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      <span style={{ opacity: 0.8 }}>{label}</span>
      <strong style={{ color }}>{value}</strong>
    </span>
  )
}

// Table-side settlement of a dine_in (post-pay) order: cash / card (manual confirm) or balance
// (rule 甲, partial allowed with cash/card remainder). We never touch real money.
function SettleRow({ order, statusLabels, onSettled }) {
  const [showBalance, setShowBalance] = useState(false)
  const [balanceAmt, setBalanceAmt] = useState('')
  const [remainder, setRemainder] = useState('cash')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const total = order.total_paid || 0
  const reste = Math.max(0, total - (parseFloat(balanceAmt) || 0))

  const settle = async (payload) => {
    setBusy(true); setErr('')
    try {
      const res = await api.settleOrder(order.id, payload)
      if (res?.error) { setErr(res.error); return }
      onSettled()
    } catch (e) { setErr(e?.message || 'Erreur') } finally { setBusy(false) }
  }
  const settleBalance = () => {
    const amt = parseFloat(balanceAmt)
    if (!amt || amt <= 0) { setErr('Montant solde invalide'); return }
    settle({ method: amt >= total ? 'balance' : 'mixed', balance_amount: amt, customer_id: order.customer_id })
  }

  const btn = { padding: '7px 12px', borderRadius: 8, border: '1px solid #d8cdb8', background: '#fff', cursor: 'pointer', fontSize: 14 }
  return (
    <div style={{ border: '1px solid #ece4d3', borderRadius: 10, padding: '10px 12px', background: '#fcfaf4' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <strong>{order.order_number}</strong>
        {order.table_number && <span>🍽️ Table {order.table_number}</span>}
        {order.customer_id ? <span style={{ fontSize: 12, opacity: 0.7 }}>👤 #{order.customer_id}</span> : <span style={{ fontSize: 12, opacity: 0.7 }}>Invité</span>}
        <span style={{ fontSize: 12, opacity: 0.7 }}>{statusLabels[order.status] || order.status}</span>
        <strong style={{ marginLeft: 'auto' }}>{formatPrice(total)}</strong>
      </div>
      {err && <div style={{ color: '#c13b3b', fontSize: 13, marginTop: 6 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <button style={btn} disabled={busy} onClick={() => settle({ method: 'cash' })}>💵 Espèces</button>
        <button style={btn} disabled={busy} onClick={() => settle({ method: 'card' })}>💳 Carte</button>
        {order.customer_id && (
          <button style={btn} disabled={busy} onClick={() => setShowBalance(v => !v)}>🎁 Solde</button>
        )}
      </div>
      {showBalance && order.customer_id && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="number" step="0.01" min="0" placeholder="Solde à utiliser €"
            value={balanceAmt} onChange={e => setBalanceAmt(e.target.value)}
            style={{ ...btn, width: 150 }}
          />
          <span style={{ fontSize: 13 }}>Reste {formatPrice(reste)} en</span>
          <select value={remainder} onChange={e => setRemainder(e.target.value)} style={btn}>
            <option value="cash">💵 Espèces</option>
            <option value="card">💳 Carte</option>
          </select>
          <button style={{ ...btn, background: '#d4a300', color: '#fff', borderColor: '#d4a300' }} disabled={busy} onClick={settleBalance}>
            Confirmer
          </button>
        </div>
      )}
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
            <span>{item.qty}× {item.name?.zh || item.name_zh} / {item.name?.fr || item.name_fr}</span>
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
        {order.bonus_used > 0 && <span>🎁 Bonus: −{formatPrice(order.bonus_used)}</span>}
        {order.paid_used > 0 && <span>💳 Solde: −{formatPrice(order.paid_used)}</span>}
        {order.bonus_earned > 0 && <span>✨ Cashback: +{formatPrice(order.bonus_earned)}</span>}
      </div>
      {/* Receipt / Invoice actions — HIDDEN pending financial layer (step 2).
          TODO: facture/receipt include TVA = financial layer. Re-enable ONLY after
          expert-comptable confirms the TVA rules (judgment point A); the generator will use
          the balance ledger's taxable_amount + accountant-set rates. Backend
          /orders/{id}/receipt|invoice not implemented yet (404). */}
      {false && (
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
      )}
      {false && showInvoiceForm && (
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
