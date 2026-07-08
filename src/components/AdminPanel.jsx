import { useState, useEffect } from 'react'
import { api, formatPrice, getAdminToken, clearAdminToken } from '../utils/api'
import { useLang } from '../hooks/useLang'
import BookingsView from './BookingsView'
import ClientsView from './ClientsView'
import ReviewsView from './ReviewsView'
import GroupesView from './GroupesView'
import styles from './AdminPanel.module.css'

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
  // Auth: single-password backend login → 1-year token (separate from customer auth).
  const [unlocked, setUnlocked] = useState(() => !!getAdminToken())
  const [pwd, setPwd] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dateFilter, setDateFilter] = useState(() => new Date().toISOString().split('T')[0])
  const [statusFilter, setStatusFilter] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [hidePaid, setHidePaid] = useState(false)   // toggle hides settled ROWS only — summary still counts them
  const [view, setView] = useState('orders')        // 'orders' | 'bookings'

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ordersRes, statsRes] = await Promise.all([
        api.adminGetOrders({ date: dateFilter }),
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

  // Any admin request that 401s (expired/invalid token) → drop back to the login screen.
  useEffect(() => {
    const onUnauth = () => { setUnlocked(false); setPwd(''); setPwdError('') }
    window.addEventListener('dragons-admin-unauthorized', onUnauth)
    return () => window.removeEventListener('dragons-admin-unauthorized', onUnauth)
  }, [])

  const handleLogin = async () => {
    if (!pwd || loggingIn) return
    setLoggingIn(true); setPwdError('')
    try {
      await api.adminLogin(pwd)          // stores the token on success
      setPwd(''); setUnlocked(true)
    } catch (e) {
      setPwdError(e?.message === 'invalid_password' ? 'Mot de passe incorrect' : 'Erreur de connexion — réessayez.')
    } finally { setLoggingIn(false) }
  }

  const handleLogout = () => { clearAdminToken(); setUnlocked(false); setOrders([]); setStats(null) }

  if (!unlocked) {
    return (
      <div className={styles.lockScreen}>
        <div className={styles.lockBox}>
          <div className={styles.lockIcon}>🔒</div>
          <h2 className={styles.lockTitle}>{t('adminTitle')}</h2>
          <input
            type="password"
            className={`${styles.input} ${pwdError ? styles.inputError : ''}`}
            placeholder="Mot de passe admin"
            value={pwd}
            onChange={e => { setPwd(e.target.value); setPwdError('') }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoFocus
          />
          {pwdError && <p className={styles.errorMsg}>{pwdError}</p>}
          <button className="btn-gold" onClick={handleLogin} disabled={loggingIn}>
            {loggingIn ? '…' : 'Accéder'}
          </button>
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
          {/* Date picker drives the Commandes date filter — hidden on Réservations
              (which uses its own À venir/Passées view toggle) to avoid confusion. */}
          {view !== 'bookings' && (
            <input
              type="date"
              className={styles.dateInput}
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
          )}
          <button className={styles.refreshBtn} onClick={fetchData}>↻</button>
          <button
            className={styles.refreshBtn}
            onClick={handleLogout}
            title="Déconnexion"
            style={{ fontSize: 13 }}
          >
            ⎋
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {/* Tabs: orders / reservations */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border-color, #2a2a2a)' }}>
          {[['orders', 'Commandes'], ['bookings', 'Réservations'], ['contacts', 'Clients / 客户'], ['reviews', 'Avis · 评价'], ['groupes', 'Groupes · 团体']].map(([k, lbl]) => (
            <button key={k} onClick={() => setView(k)}
              style={{
                padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 15, fontWeight: 700, marginBottom: -1,
                color: view === k ? 'var(--accent-gold, #d4a300)' : 'var(--text-muted)',
                borderBottom: view === k ? '2px solid var(--accent-gold, #d4a300)' : '2px solid transparent',
              }}>
              {lbl}
            </button>
          ))}
        </div>

        {view === 'bookings' && <BookingsView />}
        {view === 'contacts' && <ClientsView />}
        {view === 'reviews' && <ReviewsView />}
        {view === 'groupes' && <GroupesView />}

        {view === 'orders' && (<>
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
                    style={{ borderLeft: order.payment_status === 'paid' ? '3px solid transparent' : '3px solid #dc2626' }}
                    onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                  >
                    <span className={styles.orderNum}>
                      {order.order_number}
                      {order.order_type !== 'delivery' && order.table_number ? (
                        <span style={{ display: 'block', fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>
                          🍽️ Table {order.table_number}
                        </span>
                      ) : null}
                    </span>
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
                      {/* Unpaid = loud (action needed); paid = quiet (done) */}
                      <span style={order.payment_status === 'paid'
                        ? { fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 999, color: '#5a7a66', background: '#e6efe9' }
                        : { fontSize: 11.5, fontWeight: 800, padding: '2px 9px', borderRadius: 999, color: '#fff', background: '#dc2626' }
                      }>
                        {order.payment_status === 'paid' ? t('payStatusPaid') : `⚠️ ${t('payStatusUnpaid')}`}
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
        </>)}
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
// (rule 甲, partial allowed with cash/card remainder). We never touch real money. Every method goes
// through a confirmation dialog first (handling money — guard against mis-taps).
function SettleRow({ order, statusLabels, onSettled }) {
  const { t } = useLang()
  const [showBalance, setShowBalance] = useState(false)
  const [balanceAmt, setBalanceAmt] = useState('')
  const [remainder, setRemainder] = useState('cash')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [confirm, setConfirm] = useState(null)   // { payload, remainderMethod } — pending confirmation
  const total = order.total_paid || 0
  const reste = Math.max(0, total - (parseFloat(balanceAmt) || 0))

  // settle returns true on success (caller closes the dialog); false keeps it open to show the error.
  const settle = async (payload) => {
    setBusy(true); setErr('')
    try {
      const res = await api.settleOrder(order.id, payload)
      if (res?.error) { setErr(res.error); return false }
      onSettled(); return true
    } catch (e) { setErr(e?.message || 'Erreur'); return false } finally { setBusy(false) }
  }
  const askBalance = () => {
    const amt = parseFloat(balanceAmt)
    if (!amt || amt <= 0) { setErr('Montant solde invalide'); return }
    setErr('')
    setConfirm({ payload: { method: amt >= total ? 'balance' : 'mixed', balance_amount: amt, customer_id: order.customer_id }, remainderMethod: remainder })
  }
  const doConfirm = async () => {
    const ok = await settle(confirm.payload)
    if (ok) setConfirm(null)
  }

  const btn = { padding: '7px 12px', borderRadius: 8, border: '1px solid #d8cdb8', background: '#fff', color: '#3a3328', cursor: 'pointer', fontSize: 14 }
  const methodIconLabel = (m) =>
    m === 'cash' ? `💵 ${t('settle.cash')}`
    : m === 'card' ? `💳 ${t('settle.card')}`
    : `🎁 ${t('settle.balance')}`
  return (
    // White "ticket" card on the dark admin — set an explicit DARK text color so content does NOT
    // inherit the dark-theme's light text (var(--text-*)) and vanish on white.
    <div style={{ border: '1px solid #ece4d3', borderRadius: 10, padding: '10px 12px', background: '#fcfaf4', color: '#2a2520' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <strong>{order.order_number}</strong>
        {order.table_number && <span>🍽️ Table {order.table_number}</span>}
        {order.customer_id ? <span style={{ fontSize: 12, color: '#6b6355' }}>👤 #{order.customer_id}</span> : <span style={{ fontSize: 12, color: '#6b6355' }}>Invité</span>}
        <span style={{ fontSize: 12, color: '#6b6355' }}>{statusLabels[order.status] || order.status}</span>
        <strong style={{ marginLeft: 'auto' }}>{formatPrice(total)}</strong>
      </div>
      {err && !confirm && <div style={{ color: '#c13b3b', fontSize: 13, marginTop: 6 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
        <button className={`${styles.payBtn} ${styles.payCash}`} disabled={busy} onClick={() => { setErr(''); setConfirm({ payload: { method: 'cash' } }) }}>💵 {t('settle.cash')}</button>
        <button className={`${styles.payBtn} ${styles.payCard}`} disabled={busy} onClick={() => { setErr(''); setConfirm({ payload: { method: 'card' } }) }}>💳 {t('settle.card')}</button>
        {order.customer_id && (
          <button className={`${styles.payBtn} ${styles.payBalance}`} disabled={busy} onClick={() => setShowBalance(v => !v)}>🎁 {t('settle.balance')}</button>
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
            <option value="cash">💵 {t('settle.cash')}</option>
            <option value="card">💳 {t('settle.card')}</option>
          </select>
          <button className={`${styles.payBtn} ${styles.payBalance}`} disabled={busy} onClick={askBalance}>
            🎁 {t('settle.balance')} →
          </button>
        </div>
      )}

      {/* Confirmation dialog — nothing is settled until "Confirmer l'encaissement" */}
      {confirm && (
        <div onClick={() => !busy && setConfirm(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#fff', color: '#2a2520', borderRadius: 14, padding: 18, width: 'min(420px, 100%)', boxShadow: '0 10px 40px rgba(0,0,0,0.35)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 17 }}>💰 {t('settle.confirmTitle')}</h3>
            <div style={{ fontSize: 15, lineHeight: 1.6 }}>
              <div><strong>{order.order_number}</strong>{order.table_number ? ` · 🍽️ Table ${order.table_number}` : ''}</div>
              <div style={{ fontWeight: 800, fontSize: 22, margin: '4px 0' }}>{formatPrice(total)}</div>
              <div style={{ color: '#6b6355' }}>
                {confirm.payload.method === 'mixed'
                  ? `🎁 ${t('settle.balance')} + ${confirm.remainderMethod === 'card' ? `💳 ${t('settle.card')}` : `💵 ${t('settle.cash')}`}`
                  : methodIconLabel(confirm.payload.method)}
              </div>
            </div>
            {(confirm.payload.method === 'balance' || confirm.payload.method === 'mixed') && (
              <div style={{ marginTop: 12, padding: '9px 11px', background: '#fff4f4', border: '1px solid #f1c4c4', borderRadius: 8, fontSize: 13 }}>
                <div style={{ color: '#9a1c1c', fontWeight: 600 }}>⚠️ {t('settle.balanceWarn', { amount: formatPrice(confirm.payload.balance_amount) })}</div>
                {confirm.payload.method === 'mixed' && (
                  <div style={{ marginTop: 5, color: '#2a2520' }}>
                    🎁 {formatPrice(confirm.payload.balance_amount)} + {confirm.remainderMethod === 'card' ? t('settle.card') : t('settle.cash')} {formatPrice(total - confirm.payload.balance_amount)} = <strong>{formatPrice(total)}</strong>
                  </div>
                )}
              </div>
            )}
            {err && <div style={{ color: '#c13b3b', fontSize: 13, marginTop: 8 }}>{err}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button style={{ ...btn, background: '#f0ece3' }} disabled={busy} onClick={() => setConfirm(null)}>{t('settle.cancel')}</button>
              <button style={{ ...btn, background: '#1d8a4e', color: '#fff', borderColor: '#1d8a4e', fontWeight: 700 }} disabled={busy} onClick={doConfirm}>
                {busy ? '…' : `✓ ${t('settle.confirmBtn')}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function OrderDetail({ order, lang }) {
  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || []
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const isPaid = order.payment_status === 'paid' || order.status === 'paid'

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
      {/* Receipt / Invoice — shown once the order is settled (paid). Backend
          /orders/{id}/receipt|invoice generates the PDF (TVA breakdown + legal mentions).
          Shop SIRET/TVA are placeholders until 约翰 provides them; rates pending accountant. */}
      {isPaid && (
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
