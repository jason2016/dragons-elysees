import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../hooks/useLang'
import { api, formatPrice } from '../utils/api'
import styles from './BalanceHistory.module.css'

const SOURCE_ICON = {
  recharge: '💳', cashback: '🎁', referral: '👥', review: '⭐',
  payment: '🍜', refund: '↩️', adjustment: '⚙️',
}

export default function BalanceHistory() {
  const { customer, isLoggedIn } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [bal, setBal] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn) { navigate('/account/login'); return }
    if (!customer?.id) return
    api.getBalance().then(setBal).catch(() => {})
    api.getBalanceHistory(customer.id)
      .then(setData)
      .catch(() => setData({ transactions: [] }))
      .finally(() => setLoading(false))
  }, [customer?.id, isLoggedIn, navigate])

  // Read tx.source / tx.category (the old single 'type' column was removed in the dual-ledger refactor).
  const srcLabel = (s) => `${SOURCE_ICON[s] || '•'} ${t(`bal.src.${s}`)}`
  const catLabel = (c) => t(`bal.cat.${c}`)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/account')}>←</button>
        <h1 className={styles.title}>{t('balance.title')}</h1>
      </header>

      {bal && (
        <div className={styles.balanceBanner}>
          <div className={styles.balanceBannerLabel}>{t('balance.currentBalance')}</div>
          <div className={styles.balanceBannerValue}>{formatPrice(bal.total_balance ?? 0)}</div>
          <div className={styles.balanceBannerSub}>
            {t('bal.paid')}: {formatPrice(bal.paid_balance ?? 0)} · {t('bal.bonus')}: {formatPrice(bal.bonus_balance ?? 0)}
          </div>
        </div>
      )}

      <div className={styles.listWrap}>
        {loading ? (
          <div className={styles.state}>{t('common.loading')}</div>
        ) : !data || data.transactions?.length === 0 ? (
          <div className={styles.state}>
            <div className={styles.stateIcon}>💰</div>
            <p>{t('balance.empty')}</p>
            <p className={styles.stateSub}>{t('balance.emptyHint')}</p>
          </div>
        ) : (
          data.transactions.map(tx => {
            const cls = tx.amount > 0 ? 'positive' : tx.amount < 0 ? 'negative' : 'neutral'
            return (
              <div key={tx.id} className={styles.txRow}>
                <div className={styles.txLeft}>
                  <span className={`${styles.txType} ${styles[cls]}`}>{srcLabel(tx.source)}</span>
                  <span className={styles.txNote}>
                    {catLabel(tx.category)}{tx.description ? ` · ${tx.description}` : ''}
                  </span>
                  <span className={styles.txDate}>
                    {new Date(tx.created_at).toLocaleString('fr-FR')}
                  </span>
                </div>
                <span className={`${styles.txAmount} ${styles[cls]}`}>
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
