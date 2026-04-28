import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import { api, formatPrice } from '../utils/api'
import styles from './BalanceHistory.module.css'

const TYPE_MAP = {
  credit_referral: { label: '🎁 Recommandation', cls: 'positive' },
  credit_review: { label: '⭐ Avis Google', cls: 'positive' },
  credit_cashback: { label: '🎁 Cashback', cls: 'positive' },
  debit_order: { label: '🍜 Utilisé', cls: 'negative' },
  admin_adjust: { label: '⚙️ Ajustement', cls: 'neutral' },
}

function typeInfo(type) {
  return TYPE_MAP[type] || { label: type, cls: 'neutral' }
}

export default function BalanceHistory() {
  const { customer, isLoggedIn } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn) { navigate('/account/login'); return }
    if (!customer?.id) return
    api.getBalanceHistory(customer.id)
      .then(setData)
      .catch(() => setData({ current_balance: customer?.balance || 0, transactions: [] }))
      .finally(() => setLoading(false))
  }, [customer?.id, isLoggedIn, navigate])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/account')}>←</button>
        <h1 className={styles.title}>
          {t('balance.title')}
        </h1>
      </header>

      {data && (
        <div className={styles.balanceBanner}>
          <div className={styles.balanceBannerLabel}>
            {t('balance.currentBalance')}
          </div>
          <div className={styles.balanceBannerValue}>
            {formatPrice(data.current_balance ?? customer?.balance ?? 0)}
          </div>
          <div className={styles.balanceBannerSub}>
            {t('balance.usableNote')}
          </div>
        </div>
      )}

      <div className={styles.listWrap}>
        {loading ? (
          <div className={styles.state}>
            {t('balance.loading')}
          </div>
        ) : !data || data.transactions?.length === 0 ? (
          <div className={styles.state}>
            <div className={styles.stateIcon}>💰</div>
            <p>{t('balance.empty')}</p>
            <p className={styles.stateSub}>
              {t('balance.emptyHint')}
            </p>
          </div>
        ) : (
          data.transactions.map(tx => {
            const info = typeInfo(tx.type)
            return (
              <div key={tx.id} className={styles.txRow}>
                <div className={styles.txLeft}>
                  <span className={`${styles.txType} ${styles[info.cls]}`}>{info.label}</span>
                  {tx.note && <span className={styles.txNote}>{tx.note}</span>}
                  <span className={styles.txDate}>
                    {new Date(tx.created_at).toLocaleString('fr-FR')}
                  </span>
                </div>
                <span className={`${styles.txAmount} ${styles[info.cls]}`}>
                  {tx.amount > 0 ? '+' : ''}{formatPrice(tx.amount)}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
