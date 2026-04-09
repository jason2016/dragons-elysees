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

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (!isLoggedIn) return null

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.profileCard}>
          <div className={styles.avatar}>
            {(customer?.name || customer?.email || '?')[0].toUpperCase()}
          </div>
          <div>
            <div className={styles.name}>{customer?.name || customer?.email?.split('@')[0]}</div>
            <div className={styles.email}>{customer?.email}</div>
          </div>
        </div>

        <div className={styles.balanceCard}>
          <div className={styles.balanceLabel}>Balance</div>
          <div className={styles.balanceValue}>{formatPrice(customer?.balance || 0)}</div>
          <div className={styles.balanceSub}>{t('balanceSub')}</div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>{t('txHistory')}</h2>
          {loading ? (
            <div className={styles.loading}>{t('txLoading')}</div>
          ) : transactions.length === 0 ? (
            <div className={styles.empty}>{t('txEmpty')}</div>
          ) : (
            <div className={styles.txList}>
              {transactions.map(tx => (
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
            </div>
          )}
        </div>

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
