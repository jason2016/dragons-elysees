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

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/account/login')
      return
    }
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
    const text = `Découvrez Dragons Elysées ! Utilisez mon code ${referralData.referral_code} et nous gagnons tous les deux ! ${referralData.referral_url}`
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

        {/* Balance card */}
        <div className={styles.balanceCard}>
          <div className={styles.balanceLabel}>{t('account.balanceTitle')}</div>
          <div className={styles.balanceValue}>{formatPrice(customer?.balance || 0)}</div>
          <div className={styles.balanceSub}>{t('balanceSub')}</div>
          <button className={styles.historyLink} onClick={() => navigate('/balance/history')}>
            {t('account.viewHistory')}
          </button>
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
                    <span className={styles.txDesc}>{tx.description || tx.type}</span>
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
            {referralData.qr_code_url && (
              <div className={styles.referralQR}>
                <img src={referralData.qr_code_url} alt="QR Code recommandation" />
                <p className={styles.referralQRSub}>
                  {t('account.scanOrShare')}
                </p>
              </div>
            )}

            {/* Referral URL */}
            {referralData.referral_url && (
              <div className={styles.referralUrl}>{referralData.referral_url}</div>
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
