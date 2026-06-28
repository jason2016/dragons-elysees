import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import { api, formatPrice } from '../utils/api'
import styles from './AccountDashboard.module.css'

export default function AccountDashboard() {
  const { customer, isLoggedIn, logout } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [referralData, setReferralData] = useState(null)
  const [copyDone, setCopyDone] = useState(false)
  const [bal, setBal] = useState(null)
  const [orders, setOrders] = useState([])
  const [expandedOrder, setExpandedOrder] = useState(null)

  // Referral link/QR on the live custom domain (frontend override; backend de_get_referral_info
  // still returns the old github.io host — consumed only here). ?ref is read by AccountLogin from
  // window.location.search, so it is captured correctly on https://dragonselysees.com.
  const refUrl = referralData?.referral_code
    ? `https://dragonselysees.com/?ref=${referralData.referral_code}`
    : referralData?.referral_url
  const qrUrl = referralData?.referral_code
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(refUrl)}`
    : referralData?.qr_code_url

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/account/login')
      return
    }
    api.getBalance().then(setBal).catch(() => {})
    api.getTransactions()
      .then(data => setTransactions(data.transactions || []))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false))
  }, [isLoggedIn, navigate])

  useEffect(() => {
    if (!customer?.id) return
    api.getReferral(customer.id)
      .then(setReferralData)
      .catch(() => {})
    // My orders (incl. post-pay dine_in "Non réglé" before settlement)
    api.getOrders({ customer_id: customer.id })
      .then(d => setOrders(d.orders || []))
      .catch(() => {})
  }, [customer?.id])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const copyReferralCode = () => {
    if (!referralData?.referral_code) return
    navigator.clipboard.writeText(referralData.referral_code).then(() => {
      setCopyDone(true)
      setTimeout(() => setCopyDone(false), 2000)
    })
  }

  const shareWhatsApp = () => {
    if (!referralData) return
    const text = `Découvrez Dragons Elysées ! Utilisez mon code ${referralData.referral_code} et nous gagnons tous les deux ! ${refUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  if (!isLoggedIn) return null

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Profile card */}
        <div className={styles.profileCard}>
          <div className={styles.avatar}>
            {(customer?.name || customer?.email || '?')[0].toUpperCase()}
          </div>
          <div>
            <div className={styles.name}>{customer?.name || customer?.email?.split('@')[0]}</div>
            <div className={styles.email}>{customer?.email}</div>
          </div>
        </div>

        {/* Balance card — dual ledger: paid (recharged) + bonus (loyalty) */}
        <div className={styles.balanceCard}>
          <div className={styles.balanceLabel}>{t('account.balanceTitle')}</div>
          <div className={styles.balanceValue}>{formatPrice(bal?.total_balance ?? customer?.balance ?? 0)}</div>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', fontSize: 13, opacity: 0.9, margin: '4px 0' }}>
            <span>💳 {t('bal.paid')}: {formatPrice(bal?.paid_balance ?? 0)}</span>
            <span>🎁 {t('bal.bonus')}: {formatPrice(bal?.bonus_balance ?? 0)}</span>
          </div>
          <div className={styles.balanceSub}>{t('balanceSub')}</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
            <button className="btn-gold" onClick={() => navigate('/balance/recharge')}>💳 {t('bal.recharge')}</button>
            <button className={styles.historyLink} onClick={() => navigate('/balance/history')}>
              {t('account.viewHistory')}
            </button>
          </div>
        </div>

        {/* Recent transactions */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>{t('txHistory')}</h2>
          {loading ? (
            <div className={styles.loading}>{t('txLoading')}</div>
          ) : transactions.length === 0 ? (
            <div className={styles.empty}>{t('txEmpty')}</div>
          ) : (
            <div className={styles.txList}>
              {transactions.slice(0, 5).map(tx => (
                <div key={tx.id} className={styles.txRow}>
                  <div className={styles.txInfo}>
                    <span className={styles.txDesc}>{tx.description || t(`bal.src.${tx.source}`)}</span>
                    <span className={styles.txDate}>{new Date(tx.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <span className={`${styles.txAmount} ${tx.amount > 0 ? styles.positive : styles.negative}`}>
                    {tx.amount > 0 ? '+' : ''}{formatPrice(tx.amount)}
                  </span>
                </div>
              ))}
              {transactions.length > 5 && (
                <button className={styles.historyLink} onClick={() => navigate('/balance/history')}>
                  {t('account.viewAllTx', { count: transactions.length })}
                </button>
              )}
            </div>
          )}
        </div>

        {/* My orders — incl. post-pay dine_in awaiting table settlement (Non réglé) */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>📋 {t('account.myOrders')}</h2>
          {orders.length === 0 ? (
            <div className={styles.empty}>{t('account.noOrders')}</div>
          ) : (
            <div className={styles.txList}>
              {orders.slice(0, 10).map(o => {
                let items = []
                try { items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []) } catch { items = [] }
                const isPaid = o.payment_status === 'paid'
                return (
                  <div key={o.id}>
                    <div
                      className={styles.txRow}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}
                    >
                      <div className={styles.txInfo}>
                        <span className={styles.txDesc}>
                          {o.order_number}{o.table_number ? ` · 🍽️ ${o.table_number}` : ''}
                        </span>
                        <span className={styles.txDate}>{new Date(o.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 999,
                          color: isPaid ? '#166534' : '#9a3412',
                          background: isPaid ? '#dcfce7' : '#ffedd5',
                        }}>
                          {isPaid ? t('payStatusPaid') : t('payStatusUnpaid')}
                        </span>
                        <span className={styles.txAmount}>{formatPrice(o.total_paid)}</span>
                      </div>
                    </div>
                    {expandedOrder === o.id && (
                      <div style={{ padding: '2px 4px 10px', fontSize: 13, opacity: 0.85 }}>
                        {items.map((it, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                            <span>{it.qty}× {it.name?.fr || it.name_fr || it.name?.zh || it.name_zh}</span>
                            <span>{formatPrice((it.price || 0) * (it.qty || 1))}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Referral section */}
        {referralData && (
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>
              {t('account.referralTitle')}
            </h2>

            {/* Referral code */}
            <div className={styles.referralCodeBox}>
              <div className={styles.referralCodeLabel}>
                {t('account.yourCode')}
              </div>
              <div className={styles.referralCodeRow}>
                <span className={styles.referralCode}>{referralData.referral_code}</span>
                <button className={styles.copyBtn} onClick={copyReferralCode}>
                  {copyDone ? '✓ Copié' : '📋 Copier'}
                </button>
              </div>
            </div>

            {/* QR code */}
            {qrUrl && (
              <div className={styles.referralQR}>
                <img src={qrUrl} alt="QR Code recommandation" />
                <p className={styles.referralQRSub}>
                  {t('account.scanOrShare')}
                </p>
              </div>
            )}

            {/* Referral URL */}
            {refUrl && (
              <div className={styles.referralUrl}>{refUrl}</div>
            )}

            {/* WhatsApp share */}
            <button className={styles.shareWhatsApp} onClick={shareWhatsApp}>
              💬 {t('account.shareWhatsApp')}
            </button>

            {/* How it works */}
            <div className={styles.referralInfo}>
              <div className={styles.referralInfoTitle}>
                {t('account.howItWorks')}
              </div>
              <ol className={styles.referralInfoList}>
                <li>{t('account.step1')}</li>
                <li>{t('account.step2')}</li>
                <li>{t('account.step3')}</li>
                <li>{t('account.step4')}</li>
              </ol>
            </div>

            {/* Stats */}
            {referralData.stats && (
              <div className={styles.referralStats}>
                <div className={styles.referralStatItem}>
                  <div className={styles.referralStatValue}>{referralData.stats.total_referred ?? 0}</div>
                  <div className={styles.referralStatLabel}>
                    {t('account.statReferred')}
                  </div>
                </div>
                <div className={styles.referralStatItem}>
                  <div className={`${styles.referralStatValue} ${styles.positive}`}>
                    {formatPrice(referralData.stats.total_earned ?? 0)}
                  </div>
                  <div className={styles.referralStatLabel}>
                    {t('account.statEarned')}
                  </div>
                </div>
                <div className={styles.referralStatItem}>
                  <div className={styles.referralStatValue}>{referralData.stats.pending_referrals ?? 0}</div>
                  <div className={styles.referralStatLabel}>
                    {t('account.statPending')}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <button className={styles.logoutBtn} onClick={handleLogout}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {t('logout')}
        </button>
      </div>
    </div>
  )
}
